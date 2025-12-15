import { vectorStore, SearchResult } from './vector-store';
import { RankedQuery } from './query-reranker';

export interface RetrievalResult {
    results: SearchResult[];
    sourceDistribution: Record<string, number>;
    totalResults: number;
}

export class MultiSourceRetriever {
    /**
     * Retrieve from multiple sources using multi-query approach
     */
    async retrieveMultiSource(
        query: string,
        rankedQueries: RankedQuery[],
        intent: string,
        limit: number = 10
    ): Promise<RetrievalResult> {

        const results: SearchResult[] = [];

        // 1️⃣ Retrieve from user resources
        console.log('[MultiSource] Retrieving from user resources...');
        const userResourceQueries = rankedQueries.map(q => ({
            query: q.query,
            score: q.score
        }));

        const userResults = await vectorStore.multiQuerySearch(
            userResourceQueries,
            'user-resources',
            limit * 2
        );

        results.push(...userResults);

        // 2️⃣ Retrieve from scholara docs
        try {
            console.log('[MultiSource] Retrieving from scholara docs...');
            const docsResults = await vectorStore.multiQuerySearch(
                userResourceQueries,
                'scholara-docs',
                Math.floor(limit / 2)
            );
            results.push(...docsResults);
        } catch (error) {
            console.warn('[MultiSource] Scholara docs not available:', error);
        }

        // 3️⃣ Normalize metadata (CRITICAL FIX)
        this.normalizeMetadata(results);

        // 4️⃣ Force Web Retrieval Removed (User changed requirement to dynamic Google Link)

        // 4️⃣ Deduplicate (URL-safe)
        const uniqueResults = this.deduplicateResults(results);

        // 5️⃣ Source distribution
        const distribution: Record<string, number> = {};
        uniqueResults.forEach(r => {
            distribution[r.source] = (distribution[r.source] || 0) + 1;
        });

        console.log(
            `[MultiSource] Retrieved ${uniqueResults.length} unique results`,
            distribution
        );

        return {
            results: uniqueResults,
            sourceDistribution: distribution,
            totalResults: uniqueResults.length
        };
    }

    /**
     * Normalize metadata so answer-generator always sees sourceUrl
     */
    private normalizeMetadata(results: SearchResult[]) {
        for (const r of results) {
            if (!r.metadata) r.metadata = {};

            // Backward compatibility: url → sourceUrl
            if (r.metadata.url && !r.metadata.sourceUrl) {
                r.metadata.sourceUrl = r.metadata.url;
            }

            // Infer sourceType if URL exists
            if (r.metadata.sourceUrl && !r.metadata.sourceType) {
                r.metadata.sourceType = 'web';
            }
        }
    }

    /**
     * Deduplicate results but ALWAYS keep URL-bearing entries
     */
    private deduplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Map<string, SearchResult>();

        for (const result of results) {
            const hash = result.text
                .substring(0, 100)
                .toLowerCase()
                .trim();

            const existing = seen.get(hash);

            // If not seen, add directly
            if (!existing) {
                seen.set(hash, result);
                continue;
            }

            // Prefer result WITH sourceUrl
            const existingHasUrl = !!existing.metadata?.sourceUrl;
            const currentHasUrl = !!result.metadata?.sourceUrl;

            if (!existingHasUrl && currentHasUrl) {
                seen.set(hash, result);
            }
        }

        return Array.from(seen.values());
    }
}

export const multiSourceRetriever = new MultiSourceRetriever();
