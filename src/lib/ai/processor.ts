import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pdf from 'pdf-parse';
import { vectorStore } from './vector-store';

class DocumentProcessor {
    async ingest(resource: {
        id: string;
        fileUrl: string;
        title: string;
        authorId: string;
        subject: string;
    }) {
        try {
            console.log(`[Processor] Starting ingestion for ${resource.title}...`);

            // 1. Download PDF
            const response = await fetch(resource.fileUrl);
            if (!response.ok) throw new Error('Failed to fetch PDF');
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Extract Text
            const data = await pdf(buffer);
            const text = data.text;

            if (!text || text.trim().length === 0) {
                console.warn(`[Processor] No text found in ${resource.title}`);
                return;
            }

            // 3. Chunk Text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await splitter.createDocuments([text]);

            // 4. Prepare for Vector Store
            const documents = chunks.map((chunk, index) => ({
                id: `${resource.id}-${index}`,
                text: chunk.pageContent,
                metadata: {
                    resourceId: resource.id,
                    title: resource.title,
                    subject: resource.subject,
                    authorId: resource.authorId,
                    chunkIndex: index,
                },
            }));

            // 5. Store in ChromaDB
            await vectorStore.addDocuments(documents);

            console.log(`[Processor] Ingestion complete for ${resource.title}`);
        } catch (error) {
            console.error(`[Processor] Error ingesting ${resource.title}:`, error);
            // Don't throw, just log. We don't want to break the upload flow if AI fails.
        }
    }
}

export const documentProcessor = new DocumentProcessor();
