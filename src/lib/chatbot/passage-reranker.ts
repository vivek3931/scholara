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

        // Use vector scores directly (already from MiniLM embeddings)
        // No need for cross-encoder - vector similarity is sufficient
        const scoredPassages: PassageScore[] = passages.map((passage) => {
            const vectorScore = passage.score;

            return {
                ...passage,
                vectorScore,
                crossEncoderScore: vectorScore, // Same as vector score
                finalScore: vectorScore,
            };
        });

        // Apply diversity boosting if enabled
        let rankedPassages = scoredPassages;
        if (diversityBoost) {
            rankedPassages = this.applyDiversityBoosting(scoredPassages);
        }

        // Sort by final score
        rankedPassages.sort((a, b) => b.finalScore - a.finalScore);

        // Take top K
        const final = rankedPassages.slice(0, topK);

        // Calculate average score
        const avgScore = final.reduce((sum, p) => sum + p.finalScore, 0) / final.length;

        console.log(`[Passage Re-Ranker] ✅ Re-ranked to top ${final.length} passages using vector similarity`);

        return {
            rankedPassages: final,
            totalPassages: passages.length,
            avgScore
        };
    }

    /**
     * Apply diversity boosting to avoid redundant passages
     */
    private applyDiversityBoosting(passages: PassageScore[]): PassageScore[] {
        const boosted = [...passages];
        const selected: Set<number> = new Set();

        // Iteratively select diverse passages
        for (let i = 0; i < boosted.length; i++) {
            if (selected.has(i)) continue;

            // For each unselected passage, check similarity to selected ones
            for (const selectedIdx of selected) {
                const similarity = this.calculateTextSimilarity(
                    boosted[i].text,
                    boosted[selectedIdx].text
                );

                // If very similar to already selected passage, reduce its score
                if (similarity > 0.85) {
                    boosted[i].finalScore *= 0.7;
                } else if (similarity > 0.7) {
                    boosted[i].finalScore *= 0.85;
                }
            }

            selected.add(i);
        }

        return boosted;
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
