import { NLPAnalysis } from './nlp-processor';

export interface RankedQuery {
    query: string;
    score: number;
    type: 'original' | 'expanded' | 'decomposed' | 'synonym';
}

export interface QueryRerankerResult {
    rankedQueries: RankedQuery[];
    originalQuery: string;
    totalQueries: number;
}

export class QueryReranker {
    /**
     * Generate and rank multiple query variations for improved retrieval coverage
     */
    async rerankQueries(
        originalQuery: string,
        nlpAnalysis: NLPAnalysis
    ): Promise<QueryRerankerResult> {
        const queries: RankedQuery[] = [];

        // 1. Add original query with highest initial score
        queries.push({
            query: originalQuery,
            score: 1.0,
            type: 'original'
        });

        // 2. Add expanded queries from NLP
        for (const expandedQuery of nlpAnalysis.expandedQueries) {
            if (expandedQuery !== originalQuery) {
                queries.push({
                    query: expandedQuery,
                    score: 0.85,
                    type: 'expanded'
                });
            }
        }

        // 3. Decompose complex queries into sub-queries
        const decomposedQueries = this.decomposeQuery(originalQuery, nlpAnalysis);
        for (const subQuery of decomposedQueries) {
            queries.push({
                query: subQuery,
                score: 0.75,
                type: 'decomposed'
            });
        }

        // 4. Generate entity-focused queries
        const entityQueries = this.generateEntityQueries(originalQuery, nlpAnalysis);
        for (const entityQuery of entityQueries) {
            queries.push({
                query: entityQuery,
                score: 0.70,
                type: 'synonym'
            });
        }

        // 5. Generate topic-focused queries
        const topicQueries = this.generateTopicQueries(originalQuery, nlpAnalysis);
        for (const topicQuery of topicQueries) {
            queries.push({
                query: topicQuery,
                score: 0.65,
                type: 'synonym'
            });
        }

        // 6. Adjust scores based on query characteristics
        const scoredQueries = this.scoreQueries(queries, nlpAnalysis);

        // 7. Remove duplicates and low-scoring queries
        const uniqueQueries = this.deduplicateQueries(scoredQueries);
        const filteredQueries = uniqueQueries.filter(q => q.score > 0.4);

        // 8. Sort by score (descending)
        const rankedQueries = filteredQueries.sort((a, b) => b.score - a.score);

        // 9. Limit to top 10 queries
        const topQueries = rankedQueries.slice(0, 10);

        return {
            rankedQueries: topQueries,
            originalQuery,
            totalQueries: topQueries.length
        };
    }

    /**
     * Decompose complex queries into simpler sub-queries
     */
    private decomposeQuery(query: string, nlpAnalysis: NLPAnalysis): string[] {
        const subQueries: string[] = [];
        const lower = query.toLowerCase();

        // Handle comparison queries
        if (nlpAnalysis.characteristics.isComparison) {
            // Extract compared items
            const vsMatch = query.match(/(.+?)\s+(?:vs|versus|compared to)\s+(.+)/i);
            if (vsMatch) {
                subQueries.push(vsMatch[1].trim());
                subQueries.push(vsMatch[2].trim());
            }

            const diffMatch = query.match(/(?:difference between|compare)\s+(.+?)\s+and\s+(.+)/i);
            if (diffMatch) {
                subQueries.push(diffMatch[1].trim());
                subQueries.push(diffMatch[2].trim());
            }
        }

        // Handle multi-part questions (containing "and")
        if (lower.includes(' and ') && !nlpAnalysis.characteristics.isComparison) {
            const parts = query.split(/\s+and\s+/i);
            if (parts.length === 2) {
                // Extract question word if present
                const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
                const questionWord = questionWords.find(w => lower.startsWith(w));

                if (questionWord) {
                    subQueries.push(`${questionWord} ${parts[1].trim()}`);
                }
            }
        }

        // Handle procedural questions - break into steps
        if (nlpAnalysis.characteristics.isProcedural) {
            const procedureMatch = query.match(/how to (.+)/i);
            if (procedureMatch) {
                const action = procedureMatch[1].trim();
                subQueries.push(`steps to ${action}`);
                subQueries.push(`${action} tutorial`);
                subQueries.push(`${action} guide`);
            }
        }

        return subQueries;
    }

    /**
     * Generate queries focused on identified entities
     */
    private generateEntityQueries(query: string, nlpAnalysis: NLPAnalysis): string[] {
        const queries: string[] = [];

        // Focus on topics
        for (const topic of nlpAnalysis.topics.slice(0, 3)) {
            queries.push(`${topic} ${query}`);
            queries.push(`${query} ${topic}`);
        }

        // Focus on subjects
        for (const subject of nlpAnalysis.subjects.slice(0, 2)) {
            queries.push(`${subject} ${query}`);
        }

        return queries;
    }

    /**
     * Generate queries focused on topics
     */
    private generateTopicQueries(query: string, nlpAnalysis: NLPAnalysis): string[] {
        const queries: string[] = [];
        const topics = nlpAnalysis.topics.slice(0, 3);

        // Combine topics with question type
        const questionType = nlpAnalysis.characteristics.questionType;
        for (const topic of topics) {
            if (questionType && questionType !== 'unknown') {
                queries.push(`${questionType} is ${topic}`);
            }
        }

        return queries;
    }

    /**
     * Score queries based on various characteristics
     */
    private scoreQueries(queries: RankedQuery[], nlpAnalysis: NLPAnalysis): RankedQuery[] {
        return queries.map(q => {
            let score = q.score;

            // Boost queries with important entities
            for (const topic of nlpAnalysis.topics) {
                if (q.query.toLowerCase().includes(topic.toLowerCase())) {
                    score += 0.05;
                }
            }

            for (const subject of nlpAnalysis.subjects) {
                if (q.query.toLowerCase().includes(subject.toLowerCase())) {
                    score += 0.08;
                }
            }

            // Boost queries with question words
            const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
            const hasQuestionWord = questionWords.some(w => q.query.toLowerCase().startsWith(w));
            if (hasQuestionWord) {
                score += 0.05;
            }

            // Penalize very short queries (likely incomplete)
            if (q.query.split(' ').length < 3) {
                score -= 0.15;
            }

            // Boost queries of medium length (5-15 words optimal)
            const wordCount = q.query.split(' ').length;
            if (wordCount >= 5 && wordCount <= 15) {
                score += 0.1;
            }

            // Cap score at 1.0
            score = Math.min(score, 1.0);

            return { ...q, score };
        });
    }

    /**
     * Remove duplicate queries (case-insensitive)
     */
    private deduplicateQueries(queries: RankedQuery[]): RankedQuery[] {
        const seen = new Set<string>();
        const unique: RankedQuery[] = [];

        for (const query of queries) {
            const normalized = query.query.toLowerCase().trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(query);
            } else {
                // If we've seen it, keep the one with higher score
                const existingIndex = unique.findIndex(
                    q => q.query.toLowerCase().trim() === normalized
                );
                if (existingIndex !== -1 && query.score > unique[existingIndex].score) {
                    unique[existingIndex] = query;
                }
            }
        }

        return unique;
    }
}

export const queryReranker = new QueryReranker();
