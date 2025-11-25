import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const body = await req.json(); // Read once
        const { resourceId, page = 1 } = body;

        if (!resourceId) {
            return NextResponse.json({ 
                error: 'Resource ID is required' 
            }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({ 
            where: { id: resourceId } 
        });
        
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // Validate file URL
        if (!resource.fileUrl.startsWith('https://res.cloudinary.com/')) {
            return NextResponse.json({ 
                error: 'Invalid file URL' 
            }, { status: 400 });
        }

        // Create a simple prompt with the document context
        const prompt = `You are a helpful academic assistant. Please summarize the following study material concisely.

Title: ${resource.title}
Subject: ${resource.subject}
Description: ${resource.description}

Document URL: ${resource.fileUrl}

Please provide a clear, student-friendly summary of the key concepts and main ideas from this resource. 
Focus on important details that would help a student understand and study this material effectively.
Keep the summary between 150-300 words.`;

        // Call Groq with simple text-based message
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert academic summarizer. Create clear, concise summaries that help students understand study materials."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 1024,
            temperature: 0.7
        });

        const summary = chatCompletion.choices[0]?.message?.content || "Could not generate summary.";

        return NextResponse.json({ 
            summary,
            resourceTitle: resource.title,
            subject: resource.subject
        });

    } catch (error: any) {
        console.error('AI summarize error:', error);
        
        // More specific error handling
        if (error.status === 400) {
            return NextResponse.json(
                { error: 'Invalid request - check resource data' }, 
                { status: 400 }
            );
        }
        
        if (error.status === 401) {
            return NextResponse.json(
                { error: 'AI service authentication failed. Check GROQ_API_KEY.' }, 
                { status: 401 }
            );
        }

        if (error.status === 429) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' }, 
                { status: 429 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Failed to generate summary',
                message: error.message 
            }, 
            { status: 500 }
        );
    }
}