import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdfUtils';
import { aiService } from '@/lib/aiService';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { resourceId, pages } = body;

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.isPro) {
            return NextResponse.json({
                error: 'This feature is available only for Pro users.',
                requiresPro: true
            }, { status: 403 });
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

        // Extract text (for now, extracting whole text, ideally we extract specific pages)
        // Note: pdfUtils currently extracts everything. 
        // TODO: Enhance pdfUtils to support page ranges if needed for performance.
        const text = await extractTextFromPDF(pdfBuffer);

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
        }

        // Generate Summary using Local AI
        const summary = await aiService.generateSummary(text);

        return NextResponse.json({
            summary,
            resourceTitle: resource.title
        });

    } catch (error: any) {
        console.error('AI summarize error:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary', details: error.message },
            { status: 500 }
        );
    }
}