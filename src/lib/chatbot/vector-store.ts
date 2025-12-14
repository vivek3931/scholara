import { ChromaClient, Collection } from 'chromadb';
import { aiEngine } from '../ai/engine';

export interface SearchResult {
    id: string;
    text: string;
    metadata: Record<string, any>;
    score: number;
    source: string;
}

class VectorStore {
    private client: ChromaClient;
    private collections: Map<string, Collection> = new Map();

    constructor() {
        if (typeof window !== "undefined") {
            throw new Error("ChromaDB client initialized in browser. Must run on server only.");
        }

        this.client = new ChromaClient({
            path: process.env.CHROMA_DB_URL || 'http://localhost:8000',
        });

    }

    async getOrCreateCollection(name: string): Promise<Collection | null> {
        if (this.collections.has(name)) {
            return this.collections.get(name)!;
        }

        try {
            const collection = await this.client.getOrCreateCollection({
                name: name,
            });
            this.collections.set(name, collection);
            return collection;
        } catch (error) {
            console.warn(`[VectorStore] ChromaDB not available for collection ${name}. System will work with limited functionality.`);
            console.warn('[VectorStore] To enable full retrieval: start ChromaDB server on localhost:8000');
            return null;
        }
    }

    async addDocuments(
        collectionName: string,
        documents: Array<{
            id: string;
            text: string;
            metadata: Record<string, any>;
        }>
    ) {
        const collection = await this.getOrCreateCollection(collectionName);

        if (!collection) {
            console.warn('[VectorStore] Cannot add documents - ChromaDB not available');
            return;
        }

        if (documents.length === 0) return;

        console.log(`[VectorStore] Embedding ${documents.length} documents into ${collectionName}...`);

        const texts = documents.map(doc => doc.text);
        const embeddings = await aiEngine.generateBatchEmbeddings(texts);

        const ids = documents.map((doc) => doc.id);
        const metadatas = documents.map((doc) => doc.metadata);
        const contents = documents.map((doc) => doc.text);

        await collection.upsert({
            ids,
            embeddings,
            metadatas,
            documents: contents,
        });

        console.log(`[VectorStore] Successfully added documents to ${collectionName}.`);
    }

    async search(
        query: string,
        collectionName: string = 'user-resources',
        limit: number = 5,
        filter?: Record<string, any>
    ): Promise<SearchResult[]> {
        const collection = await this.getOrCreateCollection(collectionName);

        if (!collection) {
            console.log('[VectorStore] No collection available, returning empty results');
            return [];
        }

        const queryEmbedding = await aiEngine.generateEmbeddings(query);

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit,
            where: filter,
        });

        return this.formatResults(results, collectionName);
    }

    async multiQuerySearch(
        queries: Array<{ query: string; score: number }>,
        collectionName: string = 'user-resources',
        limit: number = 10,
        filter?: Record<string, any>
    ): Promise<SearchResult[]> {
        if (queries.length === 0) return [];

        console.log(`[VectorStore] Multi-query search with ${queries.length} queries...`);

        const collection = await this.getOrCreateCollection(collectionName);

        if (!collection) {
            console.log('[VectorStore] No collection available, returning empty results');
            return [];
        }

        const queryTexts = queries.map(q => q.query);
        const queryEmbeddings = await aiEngine.generateBatchEmbeddings(queryTexts);

        const allResults: Array<{
            results: any;
            queryScore: number;
        }> = [];

        for (let i = 0; i < queryEmbeddings.length; i++) {
            const results = await collection.query({
                queryEmbeddings: [queryEmbeddings[i]],
                nResults: limit * 2,
                where: filter,
            });

            allResults.push({
                results,
                queryScore: queries[i].score
            });
        }

        const fusedResults = this.reciprocalRankFusion(allResults, collectionName);

        return fusedResults.slice(0, limit);
    }

    private reciprocalRankFusion(
        queryResults: Array<{
            results: any;
            queryScore: number;
        }>,
        collectionName: string,
        k: number = 60
    ): SearchResult[] {
        const scoreMap = new Map<string, {
            fusedScore: number;
            text: string;
            metadata: Record<string, any>;
            originalScore: number;
        }>();

        for (const { results, queryScore } of queryResults) {
            const formatted = this.formatResults(results, collectionName);

            for (let rank = 0; rank < formatted.length; rank++) {
                const doc = formatted[rank];
                const id = doc.id;

                // RRF formula: score = sum(query_weight / (k + rank))
                const rrf = queryScore / (k + rank + 1);

                if (scoreMap.has(id)) {
                    const existing = scoreMap.get(id)!;
                    existing.fusedScore += rrf;
                    // Keep the higher original score
                    existing.originalScore = Math.max(existing.originalScore, doc.score);
                } else {
                    scoreMap.set(id, {
                        fusedScore: rrf,
                        text: doc.text,
                        metadata: doc.metadata,
                        originalScore: doc.score
                    });
                }
            }
        }

        // Convert to array
        const results = Array.from(scoreMap.entries()).map(([id, data]) => ({
            id,
            text: data.text,
            metadata: data.metadata,
            fusedScore: data.fusedScore,
            originalScore: data.originalScore,
            source: collectionName
        }));

        // Sort by fused score (RRF ranking) to get the best documents according to fusion
        results.sort((a, b) => b.fusedScore - a.fusedScore);

        // Map to SearchResult, using originalScore as the primary score
        // This ensures downstream components see the actual vector similarity (0-1)
        // instead of the small RRF score, preventing them from being filtered out
        const fusedResults: SearchResult[] = results.map(r => ({
            id: r.id,
            text: r.text,
            metadata: { ...r.metadata, rrfScore: r.fusedScore },
            score: r.originalScore,
            source: r.source
        }));

        console.log(`[VectorStore] RRF fused ${fusedResults.length} unique results`);

        return fusedResults;
    }

    /**
     * Format ChromaDB query results into SearchResult format
     * IMPORTANT: ChromaDB returns distances (lower is better), convert to similarity scores (higher is better)
     */
    private formatResults(results: any, source: string): SearchResult[] {
        const formatted: SearchResult[] = [];

        if (results.ids && results.ids.length > 0) {
            for (let i = 0; i < results.ids[0].length; i++) {
                const distance = results.distances?.[0]?.[i] || 1.0;

                // Convert distance to similarity score
                // For L2 distance: similarity = 1 / (1 + distance)
                // This converts (0-∞, lower better) to (0-1, higher better)
                const similarity = 1 / (1 + distance);

                formatted.push({
                    id: results.ids[0][i],
                    text: results.documents[0][i] || '',
                    metadata: results.metadatas?.[0]?.[i] || {},
                    score: similarity,
                    source: source
                });
            }
        }

        return formatted;
    }

    async hybridSearch(
        query: string,
        keywords: string[],
        collectionName: string = 'user-resources',
        limit: number = 5
    ): Promise<SearchResult[]> {
        const vectorResults = await this.search(query, collectionName, limit * 2);

        const boosted = vectorResults.map(result => {
            let boost = 1.0;
            const lowerText = result.text.toLowerCase();

            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    boost += 0.15;
                }
            }

            return {
                ...result,
                score: result.score * boost
            };
        });

        boosted.sort((a, b) => b.score - a.score);
        return boosted.slice(0, limit);
    }
}

export const vectorStore = new VectorStore();
