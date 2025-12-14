import { NextRequest, NextResponse } from 'next/server';
import { chatbotOrchestrator } from '@/lib/chatbot/orchestrator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questionId, answerId, rating, reason, comment } = body;

        if (!questionId || !answerId || !rating) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await chatbotOrchestrator.submitFeedback(
            questionId,
            answerId,
            rating,
            reason,
            comment
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Feedback error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
