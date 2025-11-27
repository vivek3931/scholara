import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { HfInference } from '@huggingface/inference';

const prisma = new PrismaClient();

const LANGUAGE_MAP: Record<string, { name: string; code: string; model: string }> = {
    'hindi': { name: 'हिंदी', code: 'hi', model: 'Helsinki-NLP/opus-mt-en-hi' },
    'bengali': { name: 'বাংলা', code: 'bn', model: 'Helsinki-NLP/opus-mt-en-bn' },
    'tamil': { name: 'தமிழ்', code: 'ta', model: 'Helsinki-NLP/opus-mt-en-ta' },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resourceId, targetLanguage } = body;

        if (!resourceId || !targetLanguage) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
        if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { extractTextFromPDF } = await import('@/lib/pdfUtils');
        const pdfResponse = await fetch(resource.fileUrl);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const extractedText = await extractTextFromPDF(pdfBuffer);

        if (!extractedText) return NextResponse.json({ error: 'No text' }, { status: 400 });

        const langInfo = LANGUAGE_MAP[targetLanguage.toLowerCase()];
        if (!langInfo) return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });

        const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
        const result = await hf.translation({
            model: langInfo.model,
            inputs: extractedText.substring(0, 500),
        });

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        page.drawText(result.translation_text || 'Translation failed', { x: 50, y: 500, size: 12, font });

        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString('base64');

        return NextResponse.json({
            success: true,
            translatedPdf: `data:application/pdf;base64,${base64}`,
            language: langInfo.name,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
