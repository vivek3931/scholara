import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdfUtils';
import { aiService } from '@/lib/chatbot/aiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { resourceId, question } = body;

        if (!resourceId || !question) {
            return NextResponse.json({ error: 'Resource ID and question are required' }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({
            where: { id: resourceId }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // Fetch PDF
        const pdfResponse = await fetch(resource.fileUrl);
        if (!pdfResponse.ok) {
            throw new Error('Failed to fetch PDF');
        }
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        // Extract text
        const text = await extractTextFromPDF(pdfBuffer);

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
        }

        // Generate Answer using Local AI (RAG)
        // For now, we pass the whole text as context (truncated by the service if needed)
        // In a full RAG, we would chunk and retrieve relevant parts here.
        const answer = await aiService.generateAnswer(text, question);

        return NextResponse.json({
            answer
        });

    } catch (error: any) {
        console.error('AI ask error:', error);
        return NextResponse.json(
            { error: 'Failed to generate answer', details: error.message },
            { status: 500 }
        );
    }
}
