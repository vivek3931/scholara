import { NextResponse } from 'next/server';
import { vectorStore } from '@/lib/ai/vector-store';
import { aiEngine } from '@/lib/ai/engine';
import { searchWeb } from '@/lib/ai/web-search';

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        console.log(`[Chatbot] Received message: "${message}"`);

        // 1. Search Local Knowledge Base
        let context = '';
        let sources: string[] = [];
        let usedWeb = false;

        try {
            const results = await vectorStore.search(message, 3);

            // Filter results with a minimum score threshold (lower distance is better in Chroma)
            // Note: Chroma distances are usually L2 or Cosine distance.
            // We'll assume if we get results, they are somewhat relevant, but we can check distance.
            // For now, just take them.

            if (results.length > 0) {
                context = results.map((r) => r.text).join('\n\n');
                sources = results.map((r) => r.metadata.title || 'Unknown Document');
                // Deduplicate sources
                sources = [...new Set(sources)];
                console.log(`[Chatbot] Found ${results.length} local documents.`);
            }
        } catch (error) {
            console.error('[Chatbot] Vector search failed:', error);
        }

        // 2. Web Search Fallback
        // If no context found or context is very short, try web search
        if (!context || context.length < 50) {
            console.log('[Chatbot] Low local context, attempting web search...');
            const webResults = await searchWeb(message);
            if (webResults.summary) {
                context = `Web Search Results:\n${webResults.summary}`;
                sources = webResults.sources;
                usedWeb = true;
            }
        }

        // 3. Generate Answer
        const answer = await aiEngine.generateResponse(message, context);

        return NextResponse.json({
            answer,
            sources,
            usedWeb,
        });

    } catch (error: any) {
        console.error('[Chatbot] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
