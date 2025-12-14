// In a real app, this would write to a DB

export interface Feedback {
    id: string;
    questionId: string;
    answerId: string;
    rating: number;
    reason?: string;
    comment?: string;
    timestamp: number;
}

export class FeedbackCollector {
    private feedbacks: Feedback[] = [];

    async collectFeedback(
        questionId: string,
        answerId: string,
        rating: number,
        reason?: string,
        comment?: string
    ): Promise<{ stored: boolean; feedbackId: string }> {
        const feedback: Feedback = {
            id: `fb-${Date.now()}`,
            questionId,
            answerId,
            rating,
            reason,
            comment,
            timestamp: Date.now()
        };

        this.feedbacks.push(feedback);
        console.log('[FeedbackCollector] Received feedback:', feedback);

        return { stored: true, feedbackId: feedback.id };
    }

    async analyzeFeedback() {
        if (this.feedbacks.length === 0) return null;

        const avgRating = this.feedbacks.reduce((acc, f) => acc + f.rating, 0) / this.feedbacks.length;

        return {
            total: this.feedbacks.length,
            averageRating: avgRating
        };
    }
}

export const feedbackCollector = new FeedbackCollector();
