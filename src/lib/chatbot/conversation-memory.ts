// In a real app, this would use a database (Redis/Mongo/Postgres)
// For now, we'll use an in-memory store for demonstration

interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
    timestamp: number;
}

interface Session {
    id: string;
    messages: Message[];
}

export class ConversationMemory {
    private sessions: Map<string, Session> = new Map();

    async storeMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        metadata: any = {}
    ): Promise<{ stored: boolean; messageId: string }> {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, { id: sessionId, messages: [] });
        }

        const session = this.sessions.get(sessionId)!;
        const message: Message = {
            role,
            content,
            metadata,
            timestamp: Date.now()
        };

        session.messages.push(message);

        // Limit history to last 50 messages
        if (session.messages.length > 50) {
            session.messages.shift();
        }

        return { stored: true, messageId: `${sessionId}-${session.messages.length}` };
    }

    async getConversationContext(
        sessionId: string,
        limit: number = 5
    ): Promise<Array<Message>> {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        return session.messages.slice(-limit);
    }

    async resolveReferences(
        currentQuestion: string,
        conversationHistory: Message[]
    ): Promise<string> {
        // Simple heuristic: if question is very short and history exists, append context
        // In a real system, this would use an LLM to rewrite the query
        if (conversationHistory.length > 0 && currentQuestion.length < 10) {
            const lastMessage = conversationHistory[conversationHistory.length - 1];
            if (lastMessage.role === 'assistant') {
                return `${currentQuestion} (Context: ${lastMessage.content.substring(0, 50)}...)`;
            }
        }
        return currentQuestion;
    }
}

export const conversationMemory = new ConversationMemory();
