import { ChromaClient, Collection } from 'chromadb';
import { aiEngine } from './engine';

const COLLECTION_NAME = 'scholara-knowledge';

class VectorStore {
    private client: ChromaClient;
    private collection: Collection | null = null;

    constructor() {
        this.client = new ChromaClient({
            path: 'http://localhost:8000', // Assumes Chroma is running locally
        });
    }

    async getCollection() {
        if (this.collection) return this.collection;

        try {
            this.collection = await this.client.getOrCreateCollection({
                name: COLLECTION_NAME,
            });
        } catch (error) {
            console.error('[VectorStore] Failed to get/create collection:', error);
            throw error;
        }
        return this.collection;
    }

    async addDocuments(
        documents: Array<{
            id: string;
            text: string;
            metadata: Record<string, any>;
        }>
    ) {
        const collection = await this.getCollection();

        if (documents.length === 0) return;

        console.log(`[VectorStore] Embedding ${documents.length} documents...`);

        // Generate embeddings for all documents
        const embeddings = await Promise.all(
            documents.map((doc) => aiEngine.generateEmbeddings(doc.text))
        );

        const ids = documents.map((doc) => doc.id);
        const metadatas = documents.map((doc) => doc.metadata);
        const contents = documents.map((doc) => doc.text);

        await collection.upsert({
            ids,
            embeddings,
            metadatas,
            documents: contents,
        });

        console.log(`[VectorStore] Successfully added ${documents.length} documents.`);
    }

    async search(query: string, limit: number = 5) {
        const collection = await this.getCollection();
        const queryEmbedding = await aiEngine.generateEmbeddings(query);

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit,
        });

        // Format results
        const formattedResults = [];
        if (results.ids.length > 0) {
            for (let i = 0; i < results.ids[0].length; i++) {
                formattedResults.push({
                    id: results.ids[0][i],
                    text: results.documents[0][i],
                    metadata: results.metadatas[0][i],
                    score: results.distances ? results.distances[0][i] : 0,
                });
            }
        }

        return formattedResults;
    }
}

export const vectorStore = new VectorStore();
