import { aiEngine } from '../ai/engine';

export interface QualityScore {
    relevanceScore: number; // 0-100
    confidenceScore: number; // 0-100
    hallucinationRisk: number; // 0-100
    overallRating: 'high' | 'medium' | 'low';
    shouldFlag: boolean;
    flagReason?: string;
}

export class QualityScorer {
    async scoreAnswer(
        question: string,
        context: string,
        answer: string
    ): Promise<QualityScore> {
        // 1. Calculate Relevance (Similarity between Question and Answer)
        // Ideally we want the answer to be semantically related to the question
        const relevanceScore = await this.calculateSimilarity(question, answer);

        // 2. Calculate Confidence (Groundedness in Context)
        // We check if the answer's key terms appear in the context
        // This is a heuristic approximation of groundedness
        const confidenceScore = this.calculateGroundedness(answer, context);

        // 3. Hallucination Risk
        // Inverse of confidence, plus penalty for very short or vague answers
        let hallucinationRisk = 100 - confidenceScore;
        if (answer.length < 20) hallucinationRisk += 20; // Too short might be hallucination or refusal
        hallucinationRisk = Math.min(100, Math.max(0, hallucinationRisk));

        // 4. Overall Rating
        let overallRating: 'high' | 'medium' | 'low' = 'low';
        if (relevanceScore > 70 && confidenceScore > 70 && hallucinationRisk < 30) {
            overallRating = 'high';
        } else if (relevanceScore > 50 && confidenceScore > 50) {
            overallRating = 'medium';
        }

        // 5. Flagging
        let shouldFlag = false;
        let flagReason = undefined;

        if (confidenceScore < 40) {
            shouldFlag = true;
            flagReason = "Low confidence/groundedness";
        } else if (hallucinationRisk > 60) {
            shouldFlag = true;
            flagReason = "High hallucination risk";
        }

        return {
            relevanceScore,
            confidenceScore,
            hallucinationRisk,
            overallRating,
            shouldFlag,
            flagReason
        };
    }

    private async calculateSimilarity(text1: string, text2: string): Promise<number> {
        try {
            const emb1 = await aiEngine.generateEmbeddings(text1);
            const emb2 = await aiEngine.generateEmbeddings(text2);
            return this.cosineSimilarity(emb1, emb2) * 100;
        } catch (e) {
            console.error("Error calculating similarity:", e);
            return 50; // Default
        }
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private calculateGroundedness(answer: string, context: string): number {
        // Simple heuristic: overlap of significant words
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were']);

        const answerWords = answer.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
        const contextWords = new Set(context.toLowerCase().split(/\W+/));

        if (answerWords.length === 0) return 50;

        let matchCount = 0;
        for (const word of answerWords) {
            if (contextWords.has(word)) {
                matchCount++;
            }
        }

        return Math.min(100, (matchCount / answerWords.length) * 100);
    }
}

export const qualityScorer = new QualityScorer();
