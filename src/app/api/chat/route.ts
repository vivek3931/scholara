import { NextRequest, NextResponse } from 'next/server';
import { chatbotOrchestrator } from '@/lib/chatbot/orchestrator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, sessionId } = body;

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        const effectiveSessionId = sessionId || `session-${Date.now()}`;

        const response = await chatbotOrchestrator.processQuestion(question, effectiveSessionId);

        return NextResponse.json(response);
    } catch (error) {
        console.error('[API] Chat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
