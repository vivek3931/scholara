export class ResponseFormatter {
    async formatResponse(
        answer: string,
        format: string,
        quality: any,
        sources: any[],
        conversationHistory: any[],
        reasoning?: string,
        relatedUrl?: string
    ) {
        // Format sources for display
        const formattedSources = sources.map(s => ({
            title: s.metadata?.title || s.id || 'Unknown Source',
            id: s.id,
            relevance: s.score || s.relevanceScore || 0,
            url: s.source || s.url
        }));

        // Determine confidence level
        let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
        const confidence = quality.confidenceScore || quality.confidence || 0;

        if (confidence > 0.8) confidenceLevel = 'high';
        else if (confidence < 0.4) confidenceLevel = 'low';

        // Generate related questions (Heuristic based on format)
        let relatedQuestions = [
            "Tell me more about this topic.",
            "Can you give an example?",
            "What are the alternatives?"
        ];

        if (format === 'table') {
            relatedQuestions = [
                "Explain the differences in more detail.",
                "Which option is better?",
                "Can you add more comparison points?"
            ];
        } else if (format === 'step_by_step') {
            relatedQuestions = [
                "What happens if I skip a step?",
                "Show me an example of this process.",
                "Troubleshoot common issues."
            ];
        } else if (format === 'code') {
            relatedQuestions = [
                "Explain how this code works.",
                "Can you optimize this?",
                "Convert this to another language."
            ];
        }

        return {
            answer,
            format,
            sources: formattedSources,
            confidence,
            confidenceLevel,
            reasoning,
            relatedQuestions,
            relatedUrl,
            suggestUpload: confidence < 0.3,
            feedbackEnabled: true,
            metadata: {
                generationTime: new Date().toISOString(),
                qualityRating: quality.overallRating
            }
        };
    }
}

export const responseFormatter = new ResponseFormatter();
