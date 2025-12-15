import { aiEngine } from '../ai/engine';

export interface PassageScore {
    id: string;
    text: string;
    score: number;
    vectorScore: number;
    crossEncoderScore: number;
    finalScore: number;
    metadata: Record<string, any>;
    source: string;
}

export interface RerankResult {
    rankedPassages: PassageScore[];
    totalPassages: number;
    avgScore: number;
}

export class PassageReranker {
    /**
     * Re-rank passages using vector similarity (MiniLM embeddings)
     * No need for MS-MARCO cross-encoder - using existing MiniLM model
     */
    /**
     * Re-rank passages using vector similarity (MiniLM embeddings)
     */
    async rerankPassages(
        query: string,
        passages: Array<{
            id: string;
            text: string;
            score: number;
            metadata: Record<string, any>;
            source: string;
        }>,
        topK: number = 10,
        diversityBoost: boolean = true
    ): Promise<RerankResult> {
        if (passages.length === 0) {
            return {
                rankedPassages: [],
                totalPassages: 0,
                avgScore: 0
            };
        }

        console.log(`[Passage Re-Ranker] Re-ranking ${passages.length} passages using vector similarity (MiniLM)...`);

        try {
            // 1. Generate embedding for the query
            const queryEmbedding = await aiEngine.generateEmbeddings(query);

            // 2. Generate embeddings for all passages
            // We use batch generation for efficiency
            const passageTexts = passages.map(p => p.text);
            const passageEmbeddings = await aiEngine.generateBatchEmbeddings(passageTexts);

            // 3. Calculate similarity scores
            const scoredPassages: PassageScore[] = passages.map((passage, index) => {
                const embedding = passageEmbeddings[index];

                // Calculate cosine similarity
                const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);

                return {
                    ...passage,
                    vectorScore: similarity,
                    crossEncoderScore: similarity, // Using vector score as proxy for now
                    finalScore: similarity,
                };
            });

            // 4. Apply diversity boosting if enabled
            let rankedPassages = scoredPassages;
            if (diversityBoost) {
                rankedPassages = this.applyDiversityBoosting(scoredPassages);
            }

            // 5. Sort by final score
            rankedPassages.sort((a, b) => b.finalScore - a.finalScore);

            // 6. Take top K
            const final = rankedPassages.slice(0, topK);

            // 7. Calculate average score
            const avgScore = final.reduce((sum, p) => sum + p.finalScore, 0) / final.length;

            console.log(`[Passage Re-Ranker] ✅ Re-ranked to top ${final.length} passages. Top score: ${final[0]?.finalScore.toFixed(4)}`);

            return {
                rankedPassages: final,
                totalPassages: passages.length,
                avgScore
            };

        } catch (error) {
            console.error('[Passage Re-Ranker] Error during reranking:', error);
            // Fallback to original order if reranking fails
            return {
                rankedPassages: passages.slice(0, topK).map(p => ({
                    ...p,
                    vectorScore: 0,
                    crossEncoderScore: 0,
                    finalScore: p.score
                })),
                totalPassages: passages.length,
                avgScore: 0
            };
        }
    }

    /**
     * Apply diversity boosting to avoid redundant passages
     */
    private applyDiversityBoosting(passages: PassageScore[]): PassageScore[] {
        // Sort by score first to prioritize best matches
        const sorted = [...passages].sort((a, b) => b.finalScore - a.finalScore);
        const selected: PassageScore[] = [];

        // Always pick the best one
        if (sorted.length > 0) {
            selected.push(sorted[0]);
        }

        // For the rest, penalize if too similar to already selected
        for (let i = 1; i < sorted.length; i++) {
            const candidate = sorted[i];
            let maxSimilarity = 0;

            for (const existing of selected) {
                const sim = this.calculateTextSimilarity(candidate.text, existing.text);
                if (sim > maxSimilarity) maxSimilarity = sim;
            }

            // Penalize score if too similar (MMR-like logic)
            // lambda = 0.5 (balance between relevance and diversity)
            if (maxSimilarity > 0.7) {
                candidate.finalScore *= 0.6; // Heavy penalty for very similar content
            } else if (maxSimilarity > 0.5) {
                candidate.finalScore *= 0.8; // Mild penalty
            }

            selected.push(candidate);
        }

        return selected;
    }

    /**
     * Calculate Cosine Similarity between two vectors
     */
    private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Calculate text similarity using Jaccard similarity (word overlap)
     */
    private calculateTextSimilarity(text1: string, text2: string): number {
        const words1 = new Set(this.tokenize(text1));
        const words2 = new Set(this.tokenize(text2));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        if (union.size === 0) return 0;

        return intersection.size / union.size;
    }

    /**
     * Simple tokenization
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 2);
    }
}

export const passageReranker = new PassageReranker();
