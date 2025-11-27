import fs from 'fs';
import path from 'path';

// ------------------------------------------------------------------
// PDF TEXT EXTRACTION UTILITIES
// ------------------------------------------------------------------

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Method 1: Try pdf2json with improved parsing
    try {
        console.log('Trying pdf2json extraction...');
        const text = await extractWithPDF2JSON(buffer);
        if (text && text.trim().length > 50) {
            console.log('pdf2json succeeded with text length:', text.length);
            return text;
        }
    } catch (error: any) {
        console.log('pdf2json failed:', error.message);
    }

    // Method 2: Try pdf-parse as fallback
    try {
        console.log('Trying pdf-parse extraction...');
        const text = await extractWithPDFParse(buffer);
        if (text && text.trim().length > 50) {
            console.log('pdf-parse succeeded with text length:', text.length);
            return text;
        }
    } catch (error: any) {
        console.log('pdf-parse failed:', error.message);
    }

    throw new Error('All extraction methods failed - PDF may be scanned or protected');
}

async function extractWithPDF2JSON(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        // Validate buffer
        if (!buffer || buffer.length === 0) {
            reject(new Error('Invalid PDF buffer'));
            return;
        }

        if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
            reject(new Error('PDF file too large (>50MB)'));
            return;
        }

        import('pdf2json').then((PDFParserModule) => {
            const PDFParser = PDFParserModule.default || PDFParserModule;
            const parser = new (PDFParser as any)();

            let extractedText = '';
            let errorOccurred = false;

            parser.on("pdfParser_dataError", (errData: any) => {
                if (!errorOccurred) {
                    errorOccurred = true;
                    reject(new Error(errData.parserError || 'PDF parsing error'));
                }
            });

            parser.on("pdfParser_dataReady", (pdfData: any) => {
                if (errorOccurred) return;

                try {
                    if (parser.getRawTextContent) {
                        const rawText = parser.getRawTextContent();
                        if (rawText && rawText.trim()) {
                            extractedText = rawText;
                        }
                    }

                    if ((!extractedText || extractedText.length < 50) && pdfData.formImage?.Pages) {
                        const pages = pdfData.formImage.Pages;
                        let pageText = '';

                        for (const page of pages) {
                            if (page.Texts && Array.isArray(page.Texts)) {
                                for (const textObj of page.Texts) {
                                    if (textObj.R && Array.isArray(textObj.R)) {
                                        for (const r of textObj.R) {
                                            if (r.T) {
                                                const decodedText = decodePDFText(r.T);
                                                pageText += decodedText + ' ';
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (pageText.trim().length > extractedText.length) {
                            extractedText = pageText;
                        }
                    }

                    if (!extractedText || extractedText.trim().length === 0) {
                        reject(new Error('No text content found in PDF structure'));
                    } else {
                        resolve(extractedText);
                    }
                } catch (error) {
                    if (!errorOccurred) {
                        errorOccurred = true;
                        reject(error);
                    }
                }
            });

            try {
                parser.parseBuffer(buffer);
            } catch (error) {
                if (!errorOccurred) {
                    errorOccurred = true;
                    reject(error);
                }
            }
        }).catch((error) => {
            if (!errorOccurred) {
                reject(error);
            }
        });
    });
}

async function extractWithPDFParse(buffer: Buffer): Promise<string> {
    try {
        // pdf-parse is a CommonJS module, use require
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text || '';
    } catch (error: any) {
        throw new Error(`pdf-parse failed: ${error.message}`);
    }
}

function decodePDFText(encodedText: string): string {
    try {
        let decoded = encodedText
            .replace(/%20/g, ' ')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%2C/g, ',')
            .replace(/%2E/g, '.')
            .replace(/%3A/g, ':')
            .replace(/%3B/g, ';')
            .replace(/%3F/g, '?')
            .replace(/%21/g, '!')
            .replace(/%27/g, "'")
            .replace(/%22/g, '"')
            .replace(/%2D/g, '-')
            .replace(/%2F/g, '/');

        try {
            decoded = decodeURIComponent(decoded);
        } catch (e) {
            // Continue with partially decoded text
        }

        return decoded;
    } catch (error) {
        return encodedText;
    }
}

export function cleanExtractedText(text: string): string {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .replace(/-\s+/g, '')
        .replace(/\s*\.\s*/g, '. ')
        .replace(/\s*,\s*/g, ', ')
        .trim();
}
