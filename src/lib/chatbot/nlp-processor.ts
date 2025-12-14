import { pipeline } from '@huggingface/transformers';
import { vocabularyBuilder } from './vocabulary-builder';

export interface Entity {
    text: string;
    type: 'topic' | 'person' | 'subject' | 'course' | 'other';
}

export interface NLPAnalysis {
    entities: Entity[];
    topics: string[];
    subjects: string[];
    people: string[];
    expandedQueries: string[];
    characteristics: {
        questionType: string;
        isComparison: boolean;
        isProcedural: boolean;
        isList: boolean;
        complexity: 'simple' | 'moderate' | 'complex';
        hasNumericalData: boolean;
        keywordMatches: string[];
    };
}

export class NLPProcessor {
    private static instance: NLPProcessor;
    private nerPipeline: any = null;
    private isInitializing = false;

    private constructor() { }

    static getInstance(): NLPProcessor {
        if (!NLPProcessor.instance) {
            NLPProcessor.instance = new NLPProcessor();
        }
        return NLPProcessor.instance;
    }

    async getNERPipeline() {
        if (this.nerPipeline) return this.nerPipeline;

        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.nerPipeline;
        }

        this.isInitializing = true;
        try {
            console.log('[NLPProcessor] Loading NER model...');
            this.nerPipeline = await pipeline(
                'token-classification',
                'Xenova/bert-base-NER'
            );
            console.log('[NLPProcessor] NER model loaded');
        } catch (error) {
            console.error('[NLPProcessor] Failed to load NER model:', error);
            // We can continue without NER if it fails, just return empty entities
        } finally {
            this.isInitializing = false;
        }

        return this.nerPipeline;
    }

    async process(userInput: string): Promise<NLPAnalysis> {
        const entities = await this.extractEntities(userInput);
        const expandedQueries = await this.expandQuery(userInput);
        const characteristics = this.analyzeQuestion(userInput);

        return {
            entities: entities.entities,
            topics: entities.topics,
            subjects: entities.subjects,
            people: entities.people,
            expandedQueries: expandedQueries.expandedQueries,
            characteristics
        };
    }

    async extractEntities(userInput: string) {
        const entities: Entity[] = [];
        const topics: string[] = [];
        const subjects: string[] = [];
        const people: string[] = [];

        try {
            const ner = await this.getNERPipeline();
            if (ner) {
                const output = await ner(userInput);
                // Output is array of { entity_group, score, word, start, end }

                for (const item of output) {
                    const typeMap: Record<string, Entity['type']> = {
                        'PER': 'person',
                        'ORG': 'topic',
                        'LOC': 'topic',
                        'MISC': 'topic'
                    };

                    const type = typeMap[item.entity_group] || 'other';
                    const text = item.word;

                    entities.push({ text, type });

                    if (type === 'person') people.push(text);
                    if (type === 'topic') topics.push(text);
                }
            }
        } catch (e) {
            console.warn('[NLPProcessor] NER extraction failed:', e);
        }

        // Dynamic extraction using VocabularyBuilder
        const words = userInput.split(/\W+/);
        for (const word of words) {
            if (vocabularyBuilder.isSubject(word)) {
                subjects.push(word);
                entities.push({ text: word, type: 'subject' });
            }
        }

        return { entities, topics, subjects, people };
    }

    async expandQuery(query: string) {
        // Dynamic expansion could use embeddings here if available
        // For now, we rely on the query reranker module which handles this more robustly
        // We just return the original query as the base
        return { originalQuery: query, expandedQueries: [query] };
    }

    analyzeQuestion(userInput: string) {
        const lower = userInput.toLowerCase();

        // Use vocabulary builder to help identify intent signals if possible
        // For now, these structural checks are still valid as fallback
        const isComparison = lower.includes('compare') || lower.includes('difference') || lower.includes(' vs ') || lower.includes('versus');
        const isProcedural = lower.includes('how to') || lower.includes('steps') || lower.includes('procedure') || lower.includes('process');
        const isList = lower.includes('list') || lower.includes('what are') || lower.includes('examples') || lower.includes('types of');

        // Complexity heuristic
        let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
        if (userInput.split(' ').length > 15 || isComparison) complexity = 'moderate';
        if (userInput.split(' ').length > 25 || (isComparison && isProcedural)) complexity = 'complex';

        const hasNumericalData = /\d+/.test(userInput);

        const keywords = ['what', 'how', 'why', 'when', 'where', 'who', 'define', 'explain', 'analyze'].filter(k => lower.includes(k));

        return {
            questionType: keywords[0] || 'unknown',
            isComparison,
            isProcedural,
            isList,
            complexity,
            hasNumericalData,
            keywordMatches: keywords
        };
    }
}

export const nlpProcessor = NLPProcessor.getInstance();
