import { pipeline } from '@huggingface/transformers';

export type IntentType = 'scholara-help' | 'resource-qa' | 'web-search' | 'greeting' | 'general';
export type QuestionType = 'what' | 'how' | 'why' | 'compare' | 'list' | 'definition' | 'other';

export interface IntentResult {
    intent: IntentType;
    confidence: number;
    questionType: QuestionType;
    hasMultipleIntents: boolean;
    details: string;
}

export class IntentClassifier {
    private static instance: IntentClassifier;
    private classifier: any = null;
    private isInitializing = false;

    private constructor() { }

    static getInstance(): IntentClassifier {
        if (!IntentClassifier.instance) {
            IntentClassifier.instance = new IntentClassifier();
        }
        return IntentClassifier.instance;
    }

    async getClassifier() {
        if (this.classifier) return this.classifier;

        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.classifier;
        }

        this.isInitializing = true;
        try {
            console.log('[IntentClassifier] Loading model...');
            this.classifier = await pipeline(
                'zero-shot-classification',
                'Xenova/mobilebert-uncased-mnli'
            );
            console.log('[IntentClassifier] Model loaded');
        } catch (error) {
            console.error('[IntentClassifier] Failed to load model:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }

        return this.classifier;
    }

    async classifyIntent(userInput: string): Promise<IntentResult> {
        try {
            const classifier = await this.getClassifier();
            const candidateLabels = ['scholara help', 'resource question', 'web search', 'greeting', 'general conversation'];

            const output = await classifier(userInput, candidateLabels);

            // Map labels back to IntentType
            const labelMap: Record<string, IntentType> = {
                'scholara help': 'scholara-help',
                'resource question': 'resource-qa',
                'web search': 'web-search',
                'greeting': 'greeting',
                'general conversation': 'general'
            };

            const topLabel = output.labels[0];
            const topScore = output.scores[0];
            const intent = labelMap[topLabel] || 'general';

            // Detect question type
            const questionType = this.detectQuestionType(userInput);

            // Check for multiple intents (if second score is close to first)
            const hasMultipleIntents = output.scores.length > 1 && (topScore - output.scores[1] < 0.1);

            return {
                intent,
                confidence: topScore,
                questionType,
                hasMultipleIntents,
                details: `Classified as ${intent} with ${(topScore * 100).toFixed(1)}% confidence`
            };

        } catch (error) {
            console.error('[IntentClassifier] Classification error:', error);
            // Fallback
            return {
                intent: 'general',
                confidence: 0,
                questionType: 'other',
                hasMultipleIntents: false,
                details: 'Classification failed, defaulting to general'
            };
        }
    }

    private detectQuestionType(input: string): QuestionType {
        const lower = input.toLowerCase();
        if (lower.startsWith('what')) return 'what';
        if (lower.startsWith('how')) return 'how';
        if (lower.startsWith('why')) return 'why';
        if (lower.includes('compare') || lower.includes('difference') || lower.includes('vs')) return 'compare';
        if (lower.includes('list') || lower.startsWith('name')) return 'list';
        if (lower.includes('define') || lower.includes('meaning')) return 'definition';
        return 'other';
    }
}

export const intentClassifier = IntentClassifier.getInstance();
