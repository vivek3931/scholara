import { SearchResult } from './vector-store';
import { PassageScore } from './passage-reranker';
import { contentCleaner, CleanedContent } from './content-cleaner';


export interface GenerationResult {
    answer: string;
    confidence: number;
    sources: Array<{
        id: string;
        text: string;
        score: number;
        source: string;
    }>;
    snippets: string[];
    generationMethod: 'extraction' | 'synthesis' | 'structured';
    relatedUrl?: string;
}

export class IntelligentAnswerGenerator {
    /**
     * Generate answer from retrieved passages WITHOUT using LLM
     * Uses pure intelligent retrieval with snippet extraction
     */
    async generateAnswer(
        question: string,
        passages: PassageScore[],
        format: string,
        availablePassages?: PassageScore[] // All retrieved passages for metadata scanning
    ): Promise<GenerationResult> {
        console.log(`[Answer Generator] Synthesizing answer in '${format}' format from ${passages.length} passages...`);

        if (passages.length === 0) {
            return {
                answer: "I couldn't find relevant information to answer your question.",
                confidence: 0,
                sources: [],
                snippets: [],
                generationMethod: 'extraction'
            };
        }

        // Clean and organize content
        const cleanedContent = contentCleaner.process(passages.map(p => p.text));
        const snippets = cleanedContent.snippets;

        // Generate answer based on format
        let answer: string;
        let method: 'extraction' | 'synthesis' | 'structured';

        switch (format) {
            case 'table':
                answer = this.generateTableAnswer(cleanedContent, passages);
                method = 'structured';
                break;
            case 'bullet_points':
                answer = this.generateBulletPointsAnswer(cleanedContent, passages);
                method = 'structured';
                break;
            case 'step_by_step':
                answer = this.generateStepByStepAnswer(cleanedContent, passages);
                method = 'structured';
                break;
            case 'code':
                answer = this.generateCodeAnswer(cleanedContent, passages);
                method = 'extraction';
                break;
            case 'narrative':
            default:
                answer = this.generateNarrativeAnswer(cleanedContent, passages);
                method = 'synthesis';
                break;
        }

        // Enhance the answer (grammar, formatting, structure) using Phi-3
        // DISABLED for performance: The local LLM is too slow and sometimes breaks formatting.
        // answer = await llmResponseEnhancer.enhance(answer, format);

        // Calculate confidence
        const confidence = this.calculateConfidence(passages, snippets.length);

        // Find the best web source URL
        let relatedUrl: string | undefined;

        // Generate dynamic Google Search URL based on user input
        // User Request: "not hardcoded dynamically generate based on the user input"
        relatedUrl = `https://www.google.com/search?q=${encodeURIComponent(question)}`;

        // Append the URL to the response
        answer += `\n\n🔗 Official reference:\n${relatedUrl}`;

        // Format sources
        const sources = passages.slice(0, 5).map(p => ({
            id: p.id,
            text: p.text.substring(0, 200) + '...',
            score: p.finalScore,
            source: p.source
        }));

        return {
            answer,
            confidence,
            sources,
            snippets,
            generationMethod: method,
            relatedUrl
        };

    }

    /**
     * Generate table format answer
     */
    private generateTableAnswer(content: CleanedContent, passages: PassageScore[]): string {
        const lines: string[] = [];
        lines.push('| Aspect | Details |');
        lines.push('| :--- | :--- |'); // Left align

        // Use organized topics if available
        const topics = Object.entries(content.topics);

        if (topics.length > 0) {
            for (const [topic, details] of topics) {
                if (topic === 'General') continue;
                // Take the first detail for the topic
                const detailText = details[0].replace(/\|/g, '-').replace(/\n/g, ' ');
                lines.push(`| **${topic}** | ${detailText} |`);
            }
        }

        // Fallback to snippets if no structured topics found
        if (lines.length <= 2) {
            for (let i = 0; i < Math.min(content.snippets.length, 10); i++) {
                const snippet = content.snippets[i];
                let aspect = `Point ${i + 1}`;
                let details = snippet;

                const colonMatch = snippet.match(/^([^:]+):\s*(.+)$/);
                if (colonMatch && colonMatch[1].length < 30) {
                    aspect = `**${colonMatch[1].trim()}**`;
                    details = colonMatch[2].trim();
                }

                details = details.replace(/\|/g, '-').replace(/\n/g, ' ');
                aspect = aspect.replace(/\|/g, '-').replace(/\n/g, ' ');
                lines.push(`| ${aspect} | ${details} |`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Generate bullet points answer
     */
    private generateBulletPointsAnswer(content: CleanedContent, passages: PassageScore[]): string {
        const bullets = content.snippets.map(s => {
            let text = s.replace(/^\s*-\s*/, ''); // Remove existing dash if any
            const colonMatch = text.match(/^([^:]+):\s*(.+)$/);
            if (colonMatch && colonMatch[1].length < 50) {
                text = `**${colonMatch[1].trim()}:** ${colonMatch[2].trim()}`;
            }
            return `- ${text}`;
        });
        return bullets.join('\n');
    }

    /**
     * Generate step-by-step answer
     */
    private generateStepByStepAnswer(content: CleanedContent, passages: PassageScore[]): string {
        const stepsToUse = content.sequentialSteps.length > 0 ? content.sequentialSteps : content.snippets;
        const steps = stepsToUse.map((s, i) => {
            const cleanStep = s.replace(/^\d+\.\s*/, '');
            return `**Step ${i + 1}:** ${cleanStep}`;
        });
        return steps.join('\n\n');
    }

    /**
     * Generate code format answer
     */
    private generateCodeAnswer(content: CleanedContent, passages: PassageScore[]): string {
        if (content.codeBlocks.length > 0) {
            return content.codeBlocks.map(block => '```\n' + block + '\n```').join('\n\n');
        }

        // Fallback to snippets wrapped in code block
        return '```\n' + content.snippets.join('\n\n') + '\n```';
    }

    /**
     * Generate narrative answer
     */
    private generateNarrativeAnswer(content: CleanedContent, passages: PassageScore[]): string {
        const paragraphs: string[] = [];

        // Use topics to structure the narrative
        const topics = Object.entries(content.topics);

        if (topics.length > 0) {
            for (const [topic, details] of topics) {
                const formattedDetails = this.formatDetails(details);
                if (!formattedDetails) continue;

                if (topic === 'General') {
                    paragraphs.push(formattedDetails);
                } else {
                    // HIERARCHY DETECTION
                    // If topic starts with "1." or is ALL CAPS, treat as H2 (Major)
                    // If topic starts with "1.1" or is mixed case, treat as H3 (Minor)

                    const isMajor = /^\d+\.\s/.test(topic) || /^[A-Z\s\d.]+$/.test(topic);
                    const prefix = isMajor ? '##' : '###';

                    // Add extra newlines for clear separation
                    paragraphs.push(`${prefix} ${topic}\n\n${formattedDetails}`);
                }
            }
        } else {
            // Fallback to snippets if no topics
            paragraphs.push(this.formatDetails(content.snippets));
        }

        return paragraphs.join('\n\n');
    }

    private formatDetails(details: string[]): string {
        const formattedBlocks: string[] = [];
        let currentList: string[] = [];
        let currentParagraph: string[] = [];

        for (const detail of details) {
            const trimmed = detail.trim();
            if (!trimmed) continue;

            // Detect if this is a list item
            const isListItem = trimmed.startsWith('- ') || /^\d+\./.test(trimmed);

            if (isListItem) {
                // Flush pending paragraph
                if (currentParagraph.length > 0) {
                    formattedBlocks.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
                currentList.push(trimmed);
            } else {
                // If we were building a list, flush it
                if (currentList.length > 0) {
                    formattedBlocks.push(currentList.join('\n'));
                    currentList = [];
                }

                // Merge small snippets into a paragraph
                // If the snippet ends with a colon, it's likely a lead-in to a list or next part, so flush it immediately
                if (trimmed.endsWith(':')) {
                    if (currentParagraph.length > 0) {
                        formattedBlocks.push(currentParagraph.join(' '));
                        currentParagraph = [];
                    }
                    formattedBlocks.push(trimmed);
                } else {
                    currentParagraph.push(trimmed);
                }
            }
        }

        // Flush remaining items
        if (currentParagraph.length > 0) {
            formattedBlocks.push(currentParagraph.join(' '));
        }
        if (currentList.length > 0) {
            formattedBlocks.push(currentList.join('\n'));
        }

        return formattedBlocks.join('\n\n');
    }

    /**
     * Calculate confidence score for the answer
     */
    private calculateConfidence(passages: PassageScore[], snippetCount: number): number {
        if (passages.length === 0) return 0;

        const topScore = passages[0].finalScore;
        const avgScore = passages.slice(0, 3).reduce((sum, p) => sum + p.finalScore, 0) / Math.min(3, passages.length);
        const coverage = Math.min(snippetCount / 3, 1.0); // Expect at least 3 snippets for full coverage

        // Combine metrics
        const confidence = (topScore * 0.5) + (avgScore * 0.3) + (coverage * 0.2);

        return Math.min(Math.max(confidence, 0), 1.0);
    }
}

export const intelligentAnswerGenerator = new IntelligentAnswerGenerator();
