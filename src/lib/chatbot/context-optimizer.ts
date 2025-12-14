import { PassageScore } from './passage-reranker';

export interface ContextChunk {
    text: string;
    source: string;
    score: number;
}

export interface ContextOptimizationResult {
    optimizedPassages: PassageScore[];
    coverage: 'high' | 'medium' | 'low';
    estimatedQuality: number;
    diversityScore: number;
}

export class ContextOptimizer {
    /**
     * Optimize passages for answer extraction (not LLM consumption)
     */
    async optimizeContext(
        passages: PassageScore[],
        question: string,
        maxPassages: number = 10
    ): Promise<ContextOptimizationResult> {
        console.log(`[Context Optimizer] Optimizing ${passages.length} passages for answer extraction...`);

        // Debug: Log score range
        if (passages.length > 0) {
            const scores = passages.map(p => p.finalScore);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);
            console.log(`[Context Optimizer] Score range: ${minScore.toFixed(3)} - ${maxScore.toFixed(3)}`);
        }

        // 1. Filter low quality passages (lowered threshold for better recall)
        const validPassages = passages.filter(p => p.finalScore > 0.15);

        if (validPassages.length === 0) {
            console.warn('[Context Optimizer] All passages filtered out - scores too low');
            return {
                optimizedPassages: [],
                coverage: 'low',
                estimatedQuality: 0,
                diversityScore: 0
            };
        }

        console.log(`[Context Optimizer] ${validPassages.length} passages passed score threshold (>0.15)`);

        // 2. Remove highly redundant passages (keep diversity)
        const deduped = this.removeRedundantPassages(validPassages);

        // 3. Ensure topic coverage
        const balanced = this.ensureTopicCoverage(deduped, maxPassages);

        // 4. Sort by final score
        balanced.sort((a, b) => b.finalScore - a.finalScore);

        // 5. Take top passages
        const optimized = balanced.slice(0, maxPassages);

        // 6. Calculate metrics
        const avgScore = optimized.reduce((sum, p) => sum + p.finalScore, 0) / optimized.length;
        const diversity = this.calculateDiversity(optimized);

        let coverage: 'high' | 'medium' | 'low' = 'low';
        if (optimized.length >= 5 && avgScore > 0.7) coverage = 'high';
        else if (optimized.length >= 3 && avgScore > 0.5) coverage = 'medium';

        console.log(`[Context Optimizer] Optimized to ${optimized.length} passages. Coverage: ${coverage}, Diversity: ${diversity.toFixed(2)}`);

        return {
            optimizedPassages: optimized,
            coverage,
            estimatedQuality: avgScore,
            diversityScore: diversity
        };
    }

    /**
     * Remove highly redundant passages
     */
    private removeRedundantPassages(passages: PassageScore[]): PassageScore[] {
        const kept: PassageScore[] = [];
        const threshold = 0.8; // High similarity threshold

        for (const passage of passages) {
            let isRedundant = false;

            for (const keptPassage of kept) {
                const similarity = this.calculateTextSimilarity(passage.text, keptPassage.text);
                if (similarity > threshold) {
                    isRedundant = true;
                    break;
                }
            }

            if (!isRedundant) {
                kept.push(passage);
            }
        }

        return kept;
    }

    /**
     * Ensure topic coverage by keeping diverse passages
     */
    private ensureTopicCoverage(passages: PassageScore[], maxPassages: number): PassageScore[] {
        if (passages.length <= maxPassages) {
            return passages;
        }

        // Use a greedy approach to maximize diversity
        const selected: PassageScore[] = [passages[0]]; // Start with top passage
        const remaining = passages.slice(1);

        while (selected.length < maxPassages && remaining.length > 0) {
            let maxDiversity = -1;
            let bestIndex = 0;

            // Find passage that maximizes diversity
            for (let i = 0; i < remaining.length; i++) {
                const avgDissimilarity = selected.reduce((sum, s) => {
                    return sum + (1 - this.calculateTextSimilarity(remaining[i].text, s.text));
                }, 0) / selected.length;

                // Balance diversity with score
                const diversityScore = (avgDissimilarity * 0.6) + (remaining[i].finalScore * 0.4);

                if (diversityScore > maxDiversity) {
                    maxDiversity = diversityScore;
                    bestIndex = i;
                }
            }

            selected.push(remaining[bestIndex]);
            remaining.splice(bestIndex, 1);
        }

        return selected;
    }

    /**
     * Calculate diversity of passages
     */
    private calculateDiversity(passages: PassageScore[]): number {
        if (passages.length <= 1) return 1.0;

        let totalSimilarity = 0;
        let comparisons = 0;

        for (let i = 0; i < passages.length; i++) {
            for (let j = i + 1; j < passages.length; j++) {
                totalSimilarity += this.calculateTextSimilarity(passages[i].text, passages[j].text);
                comparisons++;
            }
        }

        const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
        return 1.0 - avgSimilarity; // Diversity is inverse of similarity
    }

    /**
     * Calculate text similarity using Jaccard similarity
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

export const contextOptimizer = new ContextOptimizer();
