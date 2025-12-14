import { vectorStore, SearchResult } from './vector-store';
import { searchWeb } from '../ai/web-search';
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

        // 1. Retrieve from user resources using multi-query search
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

        // 2. Retrieve from scholara-docs collection if exists
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

        // 3. Web search fallback if not enough results or for certain intents
        if (results.length < 3 || intent === 'current-events') {
            console.log('[MultiSource] Performing web search fallback...');
            const webResults = await this.performWebSearch(query);
            results.push(...webResults);
        }

        // 4. De-duplicate
        const uniqueResults = this.deduplicateResults(results);

        // 5. Calculate distribution
        const distribution: Record<string, number> = {};
        uniqueResults.forEach(r => {
            distribution[r.source] = (distribution[r.source] || 0) + 1;
        });

        console.log(`[MultiSource] Retrieved ${uniqueResults.length} unique results from ${Object.keys(distribution).length} sources`);

        return {
            results: uniqueResults,
            sourceDistribution: distribution,
            totalResults: uniqueResults.length
        };
    }

    /**
     * Perform web search as fallback
     */
    private async performWebSearch(query: string): Promise<SearchResult[]> {
        try {
            const webData = await searchWeb(query);
            if (!webData.sources || webData.sources.length === 0) return [];

            return [{
                id: `web-${Date.now()}`,
                text: webData.summary,
                source: 'web',
                score: 0.6, // Lower base score for web results
                metadata: { url: webData.sources[0] }
            }];
        } catch (error) {
            console.warn('[MultiSource] Web search failed:', error);
            return [];
        }
    }

    /**
     * Remove duplicate results based on content similarity
     */
    private deduplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Set<string>();
        const unique: SearchResult[] = [];

        for (const result of results) {
            // Create a simple hash based on first 100 chars
            const hash = result.text.substring(0, 100).toLowerCase().trim();

            if (!seen.has(hash)) {
                seen.add(hash);
                unique.push(result);
            }
        }

        return unique;
    }
}

export const multiSourceRetriever = new MultiSourceRetriever();
