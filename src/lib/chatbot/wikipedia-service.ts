export interface WikipediaResult {
    title: string;
    extract: string;
    url: string;
    thumbnail?: string;
}

export async function fetchWikipediaSummary(query: string): Promise<WikipediaResult | null> {
    try {
        // Step 1: Search for the best matching title
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        // opensearch returns [query, [titles], [descriptions], [urls]]
        if (!searchData[1] || searchData[1].length === 0) {
            return null;
        }

        const title = searchData[1][0];

        // Step 2: Fetch the summary for that title
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryRes = await fetch(summaryUrl);

        if (!summaryRes.ok) {
            return null;
        }

        const summaryData = await summaryRes.json();

        if (summaryData.type === 'disambiguation') {
            return null; // Skip disambiguation pages
        }

        return {
            title: summaryData.title,
            extract: summaryData.extract,
            url: summaryData.content_urls.desktop.page,
            thumbnail: summaryData.thumbnail?.source
        };

    } catch (error) {
        console.error("Wikipedia API Error:", error);
        return null;
    }
}
