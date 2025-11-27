import { pipeline, env } from '@xenova/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = true;

class AIService {
    private static instance: AIService;
    private generator: any = null;
    private isInitializing = false;

    private constructor() { }

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    async getGenerator() {
        if (this.generator) return this.generator;

        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.generator;
        }

        this.isInitializing = true;
        try {
            console.log('[AI] Loading text generation model...');
            this.generator = await pipeline(
                'text2text-generation',
                'Xenova/LaMini-Flan-T5-248M'
            );
            console.log('[AI] Generation model loaded');
        } finally {
            this.isInitializing = false;
        }

        return this.generator;
    }

    async generateAnswer(context: string, question: string): Promise<string> {
        try {
            const generator = await this.getGenerator();

            // Truncate long context
            const maxContext = 2000;
            const contextText = context.length > maxContext 
                ? context.slice(0, maxContext) + '...' 
                : context;

            const prompt = `Answer based on context:

Context: ${contextText}

Question: ${question}

Answer:`;

            const output = await generator(prompt, {
                max_new_tokens: 200,
                temperature: 0.7,
                do_sample: true
            });

            return output[0]?.generated_text || 
                   "Could not generate answer from the provided context.";
        } catch (error: any) {
            console.error('[AI] Generation error:', error.message);
            return "Error generating answer. Please try again.";
        }
    }
}

export const aiService = AIService.getInstance();