export type ResponseFormat = 'table' | 'bullet_points' | 'step_by_step' | 'narrative' | 'code' | 'mixed';

export interface FormatSelection {
    format: ResponseFormat;
    confidence: number;
    formatScores: Record<string, number>;
    generationPrompt: string;
    parameters: {
        maxTokens: number;
        temperature: number;
        doSample: boolean;
    };
}

export class FormatSelector {
    async selectFormat(
        userInput: string,
        characteristics: any
    ): Promise<FormatSelection> {
        const scores: Record<ResponseFormat, number> = {
            table: 0,
            bullet_points: 0,
            step_by_step: 0,
            narrative: 0,
            code: 0,
            mixed: 0
        };

        const lowerInput = userInput.toLowerCase();

        // --- Scoring Logic ---

        // TABLE - Strong signals for comparison
        if (lowerInput.includes('compare') || lowerInput.includes('difference') || lowerInput.includes(' vs ') || lowerInput.includes('versus')) scores.table += 50;
        if (lowerInput.includes('table') || lowerInput.includes('chart') || lowerInput.includes('matrix')) scores.table += 60;
        if (lowerInput.includes('pros') && lowerInput.includes('cons')) scores.table += 40;
        if (lowerInput.includes('advantages') && lowerInput.includes('disadvantages')) scores.table += 40;
        if (characteristics.isComparison) scores.table += 30;

        // STEP_BY_STEP - Strong signals for procedures
        if (lowerInput.includes('how to') || lowerInput.includes('steps') || lowerInput.includes('instructions') || lowerInput.includes('guide')) scores.step_by_step += 50;
        if (lowerInput.includes('process') || lowerInput.includes('procedure') || lowerInput.includes('tutorial') || lowerInput.includes('workflow')) scores.step_by_step += 40;
        if (lowerInput.startsWith('how do i') || lowerInput.startsWith('how can i')) scores.step_by_step += 30;
        if (characteristics.isProcedural) scores.step_by_step += 30;

        // BULLET_POINTS - Strong signals for lists
        if (lowerInput.includes('list') || lowerInput.includes('what are') || lowerInput.includes('types') || lowerInput.includes('kinds') || lowerInput.includes('examples of')) scores.bullet_points += 45;
        if (lowerInput.includes('features') || lowerInput.includes('benefits') || lowerInput.includes('characteristics') || lowerInput.includes('key points')) scores.bullet_points += 35;
        if (lowerInput.includes('factors') || lowerInput.includes('reasons') || lowerInput.includes('ways')) scores.bullet_points += 30;
        if (characteristics.isList) scores.bullet_points += 30;

        // CODE - Strong signals for programming
        if (lowerInput.includes('code') || lowerInput.includes('function') || lowerInput.includes('script') || lowerInput.includes('snippet')) scores.code += 60;
        if (lowerInput.includes('implementation') || lowerInput.includes('syntax') || lowerInput.includes('api') || lowerInput.includes('method')) scores.code += 40;
        if (lowerInput.includes('how to write') || lowerInput.includes('how to implement')) scores.code += 30;
        // Language detection
        const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'html', 'css', 'sql', 'react', 'node'];
        if (languages.some(lang => lowerInput.includes(lang))) scores.code += 20;

        // NARRATIVE - Default for explanations
        if (lowerInput.includes('explain') || lowerInput.includes('define') || lowerInput.includes('what is') || lowerInput.includes('meaning of')) scores.narrative += 40;
        if (lowerInput.includes('why') || lowerInput.includes('describe') || lowerInput.includes('history') || lowerInput.includes('background')) scores.narrative += 35;
        if (lowerInput.includes('summary') || lowerInput.includes('summarize')) scores.narrative += 30;
        if (characteristics.complexity === 'complex') scores.narrative += 15;
        scores.narrative += 10; // Base score

        // MIXED - For complex requests
        if (characteristics.complexity === 'complex' && scores.narrative > 20 && scores.bullet_points > 20) scores.mixed += 30;
        if (lowerInput.includes('comprehensive') || lowerInput.includes('detailed') || lowerInput.includes('overview') || lowerInput.includes('complete')) scores.mixed += 35;

        // Select best format
        let bestFormat: ResponseFormat = 'narrative';
        let maxScore = -1;

        for (const [format, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestFormat = format as ResponseFormat;
            }
        }

        // Confidence normalization (simple)
        const confidence = Math.min(maxScore / 50, 1.0);

        return {
            format: bestFormat,
            confidence,
            formatScores: scores,
            generationPrompt: this.getPromptForFormat(bestFormat),
            parameters: this.getParametersForFormat(bestFormat, characteristics.complexity)
        };
    }

    private getPromptForFormat(format: ResponseFormat): string {
        switch (format) {
            case 'table':
                return "Create a clear comparison table. Include relevant aspects and key differences. Format as markdown table.";
            case 'step_by_step':
                return "Provide step-by-step instructions. Number each step clearly. Include action, explanation, and result for each step.";
            case 'bullet_points':
                return "List items with brief descriptions. Use bullet format. Be concise and structured.";
            case 'code':
                return "Provide a code example with comments and explanation. Include usage context.";
            case 'mixed':
                return "Provide a comprehensive answer. Use headings, bullet points, and text as appropriate to structure the information.";
            case 'narrative':
            default:
                return "Provide a comprehensive explanation. Write in clear, accessible prose. Define key concepts.";
        }
    }

    private getParametersForFormat(format: ResponseFormat, complexity: string) {
        const base = {
            maxTokens: 500,
            temperature: 0.7,
            doSample: true
        };

        if (format === 'code') {
            base.temperature = 0.2; // More deterministic for code
        } else if (format === 'narrative') {
            base.temperature = 0.8; // More creative for writing
            base.maxTokens = 800;
        }

        if (complexity === 'complex') {
            base.maxTokens = 1000;
        }

        return base;
    }
}

export const formatSelector = new FormatSelector();
