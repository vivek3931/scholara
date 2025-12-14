import { pipeline, env } from '@huggingface/transformers';

// Enable remote models for production
env.allowRemoteModels = true;

interface EmbeddingCache {
    [key: string]: number[];
}

class AIEngine {
    private static instance: AIEngine;
    private embeddingPipeline: any = null;
    private crossEncoderPipeline: any = null;
    private isInitializingEmbeddings = false;
    private isInitializingCrossEncoder = false;
    private embeddingCache: EmbeddingCache = {};

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
            console.log('[AI Engine] Loading MiniLM embedding model...');
            this.embeddingPipeline = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2'
            );
            console.log('[AI Engine] MiniLM embedding model loaded successfully');
        } catch (error) {
            console.error('[AI Engine] Failed to load embedding model:', error);
            throw error;
        } finally {
            this.isInitializingEmbeddings = false;
        }

        return this.embeddingPipeline;
    }

    async getCrossEncoderPipeline() {
        if (this.crossEncoderPipeline) return this.crossEncoderPipeline;

        if (this.isInitializingCrossEncoder) {
            while (this.isInitializingCrossEncoder) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return this.crossEncoderPipeline;
        }

        this.isInitializingCrossEncoder = true;
        try {
            console.log('[AI Engine] Loading MS-MARCO cross-encoder for re-ranking...');
            // Using MS-MARCO MiniLM cross-encoder for passage re-ranking
            this.crossEncoderPipeline = await pipeline(
                'text-classification',
                'Xenova/ms-marco-MiniLM-L6-cos-v5'
            );
            console.log('[AI Engine] Cross-encoder model loaded successfully');
        } catch (error) {
            console.error('[AI Engine] Failed to load cross-encoder:', error);
            throw error;
        } finally {
            this.isInitializingCrossEncoder = false;
        }

        return this.crossEncoderPipeline;
    }

    /**
     * Generate embeddings for a single text with caching
     */
    async generateEmbeddings(text: string, useCache: boolean = true): Promise<number[]> {
        // Check cache first
        if (useCache && this.embeddingCache[text]) {
            return this.embeddingCache[text];
        }

        const pipe = await this.getEmbeddingPipeline();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data) as number[];

        // Cache the result
        if (useCache) {
            this.embeddingCache[text] = embedding;
        }

        return embedding;
    }

    /**
     * Generate embeddings for multiple texts in batch (more efficient)
     */
    async generateBatchEmbeddings(texts: string[], useCache: boolean = true): Promise<number[][]> {
        const embeddings: number[][] = [];
        const textsToEmbed: string[] = [];
        const indices: number[] = [];

        // Check cache and collect uncached texts
        for (let i = 0; i < texts.length; i++) {
            if (useCache && this.embeddingCache[texts[i]]) {
                embeddings[i] = this.embeddingCache[texts[i]];
            } else {
                textsToEmbed.push(texts[i]);
                indices.push(i);
            }
        }

        // Generate embeddings for uncached texts
        if (textsToEmbed.length > 0) {
            const pipe = await this.getEmbeddingPipeline();

            for (let i = 0; i < textsToEmbed.length; i++) {
                const output = await pipe(textsToEmbed[i], { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data) as number[];

                embeddings[indices[i]] = embedding;

                // Cache the result
                if (useCache) {
                    this.embeddingCache[textsToEmbed[i]] = embedding;
                }
            }
        }

        return embeddings;
    }

    /**
     * Score query-passage pairs using cross-encoder for re-ranking
     * Returns relevance scores (higher is better)
     */
    async scoreQueryPassagePairs(
        query: string,
        passages: string[]
    ): Promise<number[]> {
        if (passages.length === 0) return [];

        const pipe = await this.getCrossEncoderPipeline();
        const scores: number[] = [];

        // Score each passage against the query
        for (const passage of passages) {
            try {
                // Construct input as query + passage
                const input = `${query} [SEP] ${passage}`;
                const output = await pipe(input);

                // Extract relevance score
                // MS-MARCO models output a score, we take the first label's score
                const score = output[0]?.score || 0;
                scores.push(score);
            } catch (error) {
                console.warn('[AI Engine] Cross-encoder scoring failed for passage:', error);
                scores.push(0);
            }
        }

        return scores;
    }

    /**
     * Calculate semantic similarity between two texts
     */
    async calculateSimilarity(text1: string, text2: string): Promise<number> {
        const [emb1, emb2] = await this.generateBatchEmbeddings([text1, text2]);
        return this.cosineSimilarity(emb1, emb2);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (norm1 * norm2);
    }

    /**
     * Clear embedding cache to free memory
     */
    clearCache() {
        this.embeddingCache = {};
        console.log('[AI Engine] Embedding cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const size = Object.keys(this.embeddingCache).length;
        return {
            cachedEmbeddings: size,
            estimatedMemoryKB: size * 384 * 4 / 1024 // 384 dimensions * 4 bytes per float
        };
    }
}

export const aiEngine = AIEngine.getInstance();