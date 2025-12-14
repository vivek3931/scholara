import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { vectorStore } from '../chatbot/vector-store';
import { extractTextFromPDF } from '../pdfUtils';

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

            // 2. Extract Text using pdfUtils (handles pdf-parse correctly)
            console.log('[Processor] Extracting text from PDF...');
            const text = await extractTextFromPDF(buffer);

            if (!text || text.trim().length === 0) {
                console.warn(`[Processor] No text found in ${resource.title}`);
                return;
            }

            console.log(`[Processor] ✅ Extracted ${text.length} characters from ${resource.title}`);

            // 3. Chunk Text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await splitter.createDocuments([text]);
            console.log(`[Processor] Created ${chunks.length} chunks`);

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

            // 5. Store in ChromaDB (using new chatbot vector store)
            console.log(`[Processor] Storing ${documents.length} chunks in ChromaDB...`);
            await vectorStore.addDocuments('user-resources', documents);

            console.log(`[Processor] ✅ Ingestion complete for ${resource.title}: ${chunks.length} chunks stored in ChromaDB`);
        } catch (error: any) {
            console.error(`[Processor] ❌ Error ingesting ${resource.title}:`, error.message);
            throw error; // Throw so the caller knows ingestion failed
        }
    }
}

export const documentProcessor = new DocumentProcessor();
