import { search } from 'duck-duck-scrape';

export async function searchWeb(query: string) {
    try {
        console.log(`[WebSearch] Searching for: "${query}"`);

        const results = await search(query, {
            safeSearch: 0, // Moderate safe search
        });

        if (!results.results || results.results.length === 0) {
            return { summary: '', sources: [] };
        }

        // Take top 3 results
        const topResults = results.results.slice(0, 3);

        const summary = topResults
            .map((r) => `Title: ${r.title}\nSnippet: ${r.description}\nSource: ${r.url}`)
            .join('\n\n');

        const sources = topResults.map((r) => r.url);

        return { summary, sources };
    } catch (error) {
        console.error('[WebSearch] Error:', error);
        return { summary: '', sources: [] };
    }
}
