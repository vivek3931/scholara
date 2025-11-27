import { pipeline, env, PipelineType } from '@xenova/transformers';

// Skip local model checks for production/deployment environments if needed
// env.allowLocalModels = false;
env.allowRemoteModels = true;

class AIEngine {
    private static instance: AIEngine;
    private embeddingPipeline: any = null;
    private generationPipeline: any = null;
    private isInitializingEmbeddings = false;
    private isInitializingGeneration = false;

    private constructor() { }

    static getInstance(): AIEngine {
        if (!AIEngine.instance) {
            AIEngine.instance = new AIEngine();
        }
        return AIEngine.instance;
    }

    async getEmbeddingPipeline() {
        if (this.embeddingPipeline) return this.embeddingPipeline;

        if (this.isInitializingEmbeddings) {
            while (this.isInitializingEmbeddings) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return this.embeddingPipeline;
        }

        this.isInitializingEmbeddings = true;
        try {
            console.log('[AI Engine] Loading embedding model...');
            this.embeddingPipeline = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2'
            );
            console.log('[AI Engine] Embedding model loaded');
        } catch (error) {
            console.error('[AI Engine] Failed to load embedding model:', error);
            throw error;
        } finally {
            this.isInitializingEmbeddings = false;
        }

        return this.embeddingPipeline;
    }

    async getGenerationPipeline() {
        if (this.generationPipeline) return this.generationPipeline;

        if (this.isInitializingGeneration) {
            while (this.isInitializingGeneration) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return this.generationPipeline;
        }

        this.isInitializingGeneration = true;
        try {
            console.log('[AI Engine] Loading generation model...');
            // Using LaMini-Flan-T5-783M for better quality than 248M, but still runnable locally
            this.generationPipeline = await pipeline(
                'text2text-generation',
                'Xenova/LaMini-Flan-T5-783M'
            );
            console.log('[AI Engine] Generation model loaded');
        } catch (error) {
            console.error('[AI Engine] Failed to load generation model:', error);
            throw error;
        } finally {
            this.isInitializingGeneration = false;
        }

        return this.generationPipeline;
    }

    async generateEmbeddings(text: string): Promise<number[]> {
        const pipe = await this.getEmbeddingPipeline();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    async generateResponse(
        prompt: string,
        context: string = ''
    ): Promise<string> {
        const pipe = await this.getGenerationPipeline();

        // Construct a prompt suitable for Flan-T5
        const fullPrompt = `Answer the following question based on the context provided. If the answer is not in the context, say "I don't know based on the available information."

Context:
${context}

Question:
${prompt}

Answer:`;

        const output = await pipe(fullPrompt, {
            max_new_tokens: 512,
            temperature: 0.3,
            do_sample: true,
            repetition_penalty: 1.2,
        });

        return output[0]?.generated_text || 'No response generated.';
    }
}

export const aiEngine = AIEngine.getInstance();