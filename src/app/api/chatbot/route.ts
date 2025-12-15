import { NextResponse } from 'next/server';
import { chatbotOrchestrator } from '@/lib/chatbot/orchestrator';
import { fetchWikipediaSummary } from '@/lib/chatbot/wikipedia-service';

export async function POST(req: Request) {
    try {
        const { message, history, sessionId, resourceUrl } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        console.log(`[Chatbot API] Received message: "${message}"`);

        // Use session ID or generate one
        const session = sessionId || `session-${Date.now()}`;

        // Process question and fetch Wikipedia summary in parallel for speed
        const [response, wikiResult] = await Promise.all([
            chatbotOrchestrator.processQuestion(message, session, resourceUrl),
            fetchWikipediaSummary(message)
        ]);

        // Return response in expected format
        return NextResponse.json({
            answer: response.answer,
            sources: response.sources || [],
            usedWeb: response.usedWeb || false,
            confidence: response.confidence || 0,
            generationMethod: response.generationMethod || 'retrieval',
            retrievalStats: response.retrievalStats || null,
            relatedQuestions: response.relatedQuestions || [],
            relatedUrl: response.relatedUrl, // Included for frontend usage
            webResult: wikiResult // Wikipedia summary
        });

    } catch (error: any) {
        console.error('[Chatbot API] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message,
                answer: "I apologize, but I encountered an error processing your question. Please try again.",
                sources: [],
                usedWeb: false,
                confidence: 0
            },
            { status: 500 }
        );
    }
}
