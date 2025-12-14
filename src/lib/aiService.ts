// AI Service using TinyLlama for summarization and text generation
export class AIService {
    private static instance: AIService;
    private generator: any = null;
    private modelId = 'Xenova/TinyLlama-1.1B-Chat-v1.0';
    private isInitializing = false;
    private initializationFailed = false;

    private constructor() { }

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    private async getGenerator() {
        if (this.generator || this.initializationFailed) return this.generator;

        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.generator;
        }

        this.isInitializing = true;
        try {
            console.log('[AIService] Dynamically loading TinyLlama for summarization...');

            const transformers = await import('@huggingface/transformers');
            const { pipeline, env } = transformers;

            // Configure environment
            env.allowLocalModels = false;
            env.useBrowserCache = false;

            console.log(`[AIService] Loading model ${this.modelId}...`);

            this.generator = await pipeline('text-generation', this.modelId, {
                dtype: 'q4',
                device: 'cpu',
            });
            console.log('[AIService] ✅ TinyLlama model loaded successfully!');
        } catch (error) {
            console.error('[AIService] Failed to load TinyLlama:', error);
            console.warn('[AIService] Summarization will not be available.');
            this.initializationFailed = true;
            this.generator = null;
        } finally {
            this.isInitializing = false;
        }

        return this.generator;
    }

    async generateSummary(text: string): Promise<string> {
        try {
            const generator = await this.getGenerator();

            if (!generator) {
                return "Summarization is currently unavailable. Please try again later.";
            }

            // Truncate very long text for summarization (TinyLlama 2k context)
            const maxText = 1500;
            const inputText = text.length > maxText
                ? text.slice(0, maxText) + '...'
                : text;

            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert at creating clear, concise summaries of academic documents. Focus on key concepts, main ideas, and important details.'
                },
                {
                    role: 'user',
                    content: `Please summarize the following document:\n\n${inputText}`
                }
            ];

            console.log('[AIService] Generating summary with TinyLlama...');
            const output = await generator(messages, {
                max_new_tokens: 512,
                temperature: 0.3, // Low temperature for focused summaries
                do_sample: false,
                return_full_text: false
            });

            let summary = output[0]?.generated_text || '';

            // Extract assistant response if needed
            if (Array.isArray(summary)) {
                const lastMsg = summary[summary.length - 1];
                if (lastMsg.role === 'assistant') summary = lastMsg.content;
            } else if (typeof summary === 'string') {
                summary = summary.trim();
            }

            console.log('[AIService] ✅ Summary generated!');
            return summary || "Could not generate summary from the provided text.";

        } catch (error: any) {
            console.error(' AIService] Summary generation error:', error);
            return "Error generating summary. Please try again.";
        }
    }

    async generateAnswer(context: string, question: string): Promise<string> {
        try {
            const generator = await this.getGenerator();

            if (!generator) {
                return "Answer generation is currently unavailable. Please try again later.";
            }

            // Truncate long context
            const maxContext = 1500;
            const contextText = context.length > maxContext
                ? context.slice(0, maxContext) + '...'
                : context;

            const messages = [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that answers questions based on the provided context. Be concise and accurate.'
                },
                {
                    role: 'user',
                    content: `Context: ${contextText}\n\nQuestion: ${question}\n\nPlease answer based on the context provided.`
                }
            ];

            const output = await generator(messages, {
                max_new_tokens: 256,
                temperature: 0.2,
                do_sample: false,
                return_full_text: false
            });

            let answer = output[0]?.generated_text || '';

            // Extract assistant response if needed
            if (Array.isArray(answer)) {
                const lastMsg = answer[answer.length - 1];
                if (lastMsg.role === 'assistant') answer = lastMsg.content;
            } else if (typeof answer === 'string') {
                answer = answer.trim();
            }

            return answer || "Could not generate answer from the provided context.";

        } catch (error: any) {
            console.error('[AIService] Generation error:', error);
            return "Error generating answer. Please try again.";
        }
    }
}

export const aiService = AIService.getInstance();