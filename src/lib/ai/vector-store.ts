import { aiEngine } from "./engine";

const COLLECTION_NAME = "scholara-knowledge";

let chromaClient: any = null;
let collection: any = null;

async function getChromaClient() {
  if (!chromaClient) {
    const { ChromaClient } = await import("chromadb");

    chromaClient = new ChromaClient({
      path: process.env.CHROMA_URL!, // 👈 REQUIRED
    });
  }
  return chromaClient;
}

async function getCollection() {
  if (collection) return collection;

  const client = await getChromaClient();
  collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
  });

  return collection;
}

export const vectorStore = {
  async addDocuments(
    documents: Array<{
      id: string;
      text: string;
      metadata: Record<string, any>;
    }>
  ) {
    if (documents.length === 0) return;

    const collection = await getCollection();

    const embeddings = await Promise.all(
      documents.map((doc) => aiEngine.generateEmbeddings(doc.text))
    );

    await collection.upsert({
      ids: documents.map((d) => d.id),
      embeddings,
      metadatas: documents.map((d) => d.metadata),
      documents: documents.map((d) => d.text),
    });
  },

  async search(query: string, limit = 5) {
    const collection = await getCollection();
    const queryEmbedding = await aiEngine.generateEmbeddings(query);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
    });

    if (!results.ids?.length) return [];

    return results.ids[0].map((id: string, i: number) => ({
      id,
      text: results.documents[0][i],
      metadata: results.metadatas[0][i],
      score: results.distances?.[0]?.[i] ?? 0,
    }));
  },
};
