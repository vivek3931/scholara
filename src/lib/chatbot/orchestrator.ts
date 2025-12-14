import { intentClassifier } from './intent-classifier';
import { nlpProcessor } from './nlp-processor';
import { semanticFormatDetector } from './semantic-format-detector';
import { queryReranker } from './query-reranker';
import { multiSourceRetriever } from './multi-source-retriever';
import { passageReranker } from './passage-reranker';
import { contextOptimizer } from './context-optimizer';
import { intelligentAnswerGenerator } from './answer-generator';
import { qualityScorer } from './quality-scorer';
import { conversationMemory } from './conversation-memory';
import { feedbackCollector } from './feedback-collector';
import { responseFormatter } from './response-formatter';
import { vocabularyBuilder } from './vocabulary-builder';

class ChatbotOrchestrator {
    private isInitialized = false;

    async initializeSystem() {
        if (this.isInitialized) return;
        console.log('[Orchestrator] Initializing system...');
        // Ideally, we would load all documents here. 
        // For now, we'll mark as initialized and learn incrementally.
        this.isInitialized = true;
        console.log('[Orchestrator] System initialized.');
    }

    /**
     * Process question using pure intelligent retrieval (NO LLM generation)
     */
    /**
     * Process question using pure intelligent retrieval (NO LLM generation)
     */
    async processQuestion(userInput: string, sessionId: string, resourceUrl?: string) {
        if (!this.isInitialized) await this.initializeSystem();

        try {
            console.log(`[Orchestrator] Processing question: "${userInput}" for session: ${sessionId}`);

            // Step 1: Get conversation context
            const history = await conversationMemory.getConversationContext(sessionId);

            // Step 2: Classify intent
            const intentResult = await intentClassifier.classifyIntent(userInput);
            console.log(`[Orchestrator] Intent: ${intentResult.intent}`);

            // Step 3: NLP processing
            const nlpResult = await nlpProcessor.process(userInput);

            let initialResults: any[] = [];
            let retrievalStats = {};

            // ON-DEMAND CONTEXT OR RETRIEVAL
            if (resourceUrl) {
                console.log(`[Orchestrator] 🚀 Using ON-DEMAND resource: ${resourceUrl}`);
                // Fetch and parse the specific resource
                const passages = await this.getOnDemandContext(resourceUrl);
                console.log(`[Orchestrator] Extracted ${passages.length} chunks from resource`);

                initialResults = passages.map((text, index) => ({
                    id: `chunk-${index}`,
                    text: text,
                    score: 1, // Base score, will be reranked
                    metadata: { source: resourceUrl, type: 'pdf-chunk' },
                    source: resourceUrl
                }));

                retrievalStats = {
                    documentsRetrieved: 1,
                    mode: 'on-demand'
                };
            } else {
                // FALLBACK: Existing global retrieval
                console.log('[Orchestrator] Using GLOBAL retrieval (Vector DB)');

                // Query re-ranking
                const queryRerankResult = await queryReranker.rerankQueries(userInput, nlpResult);

                // Multi-source retrieval
                const retrievalResult = await multiSourceRetriever.retrieveMultiSource(
                    userInput,
                    queryRerankResult.rankedQueries,
                    intentResult.intent,
                    15
                );

                initialResults = retrievalResult.results;
                retrievalStats = {
                    queriesGenerated: queryRerankResult.totalQueries,
                    documentsRetrieved: retrievalResult.totalResults,
                    mode: 'global'
                };
            }

            // Step 6: Select output format
            const formatResult = await semanticFormatDetector.detectFormat(
                userInput,
                initialResults.map(r => ({ ...r, finalScore: r.score || 0, vectorScore: 0, crossEncoderScore: 0 }))
            );

            // Step 7: Passage re-ranking (CRITICAL for on-demand to find best chunks)
            const rerankResult = await passageReranker.rerankPassages(
                userInput,
                initialResults.map(r => ({
                    id: r.id,
                    text: r.text,
                    score: r.score || 0,
                    metadata: r.metadata,
                    source: r.source
                })),
                10,
                true
            );

            // Step 8: Optimize context
            const contextResult = await contextOptimizer.optimizeContext(
                rerankResult.rankedPassages,
                userInput,
                10
            );

            // Step 9: Generate Answer
            if (contextResult.optimizedPassages.length === 0) {
                return {
                    answer: "I couldn't find specific information in the document context.",
                    confidence: 0,
                    generationMethod: 'error',
                    sources: [],
                    feedbackEnabled: false,
                    relatedQuestions: [],
                    retrievalStats
                };
            }

            const generationResult = await intelligentAnswerGenerator.generateAnswer(
                userInput,
                contextResult.optimizedPassages,
                formatResult.format
            );

            // Step 10: Quality/Memory/Formatting
            const qualityResult = await qualityScorer.scoreAnswer(
                userInput,
                contextResult.optimizedPassages.map(p => p.text).join('\n\n'),
                generationResult.answer
            );

            await conversationMemory.storeMessage(sessionId, 'user', userInput, { intent: intentResult.intent });
            await conversationMemory.storeMessage(sessionId, 'assistant', generationResult.answer, {
                quality: qualityResult.overallRating,
                context: resourceUrl ? 'on-demand' : 'global'
            });

            const finalResponse = await responseFormatter.formatResponse(
                generationResult.answer,
                formatResult.format,
                qualityResult,
                generationResult.sources,
                history
            );

            return {
                ...finalResponse,
                confidence: generationResult.confidence,
                generationMethod: generationResult.generationMethod,
                retrievalStats,
                usedWeb: generationResult.sources.some(s => s.source === 'web')
            };

        } catch (error: any) {
            console.error('[Orchestrator] Error:', error);
            return {
                answer: "I encountered an error processing your question.",
                error: true,
                sources: [],
                relatedQuestions: [],
                confidence: 0,
                generationMethod: 'error',
                usedWeb: false
            };
        }
    }

    /**
     * Helper to fetch and chunk a PDF/Text resource on the fly
     */
    /**
     * Helper to fetch and chunk a PDF/Text resource on the fly
     */
    private async getOnDemandContext(url: string): Promise<string[]> {
        try {
            // fetch the file
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch resource: ${res.statusText}`);

            const buffer = await res.arrayBuffer();

            // Use pdf2json which is more reliable in this env
            const PDFParserModule = await import('pdf2json');
            const PDFParser = PDFParserModule.default || PDFParserModule;
            const parser = new (PDFParser as any)(null, 1); // 1 for text content

            const text = await new Promise<string>((resolve, reject) => {
                parser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
                parser.on('pdfParser_dataReady', () => {
                    resolve(parser.getRawTextContent());
                });
                parser.parseBuffer(Buffer.from(buffer));
            });

            // Clean up text (pdf2json raw text often has artifacts)
            const cleanText = text.replace(/----------------Page \(\d+\) Break----------------/g, '\n');

            // Simple chunking strategy (sentences or fixed size)
            // Splitting by double newline or periods for rough chunks
            // Ideally we'd use a better splitter, but this works for on-demand
            const rawChunks = cleanText.split(/\n\s*\n/);
            const chunks: string[] = [];

            for (const chunk of rawChunks) {
                const clean = chunk.trim();
                if (clean.length > 50) {
                    // Split larger chunks
                    if (clean.length > 1000) {
                        const parts = clean.match(/[\s\S]{1,1000}/g) || [];
                        chunks.push(...parts);
                    } else {
                        chunks.push(clean);
                    }
                }
            }

            return chunks.slice(0, 100); // Limit to top 100 chunks to prevent overload

        } catch (error) {
            console.error('[Orchestrator] On-demand fetch failed:', error);
            return [];
        }
    }

    async submitFeedback(
        questionId: string,
        answerId: string,
        rating: number,
        reason?: string,
        comment?: string
    ) {
        return await feedbackCollector.collectFeedback(
            questionId,
            answerId,
            rating,
            reason,
            comment
        );
    }
}

export const chatbotOrchestrator = new ChatbotOrchestrator();
