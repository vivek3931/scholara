export interface CleanedContent {
    snippets: string[];
    topics: Record<string, string[]>;
    codeBlocks: string[];
    sequentialSteps: string[];
}

export class ContentCleaner {
    // Singleton instance
    private static instance: ContentCleaner;

    private constructor() { }

    public static getInstance(): ContentCleaner {
        if (!ContentCleaner.instance) {
            ContentCleaner.instance = new ContentCleaner();
        }
        return ContentCleaner.instance;
    }

    /**
     * Main pipeline to clean and organize passages
     */
    public process(passages: string[]): CleanedContent {
        const cleanedPassages = passages.map(p => this.cleanText(p));
        const uniquePassages = this.removeDuplicates(cleanedPassages);

        return {
            snippets: this.extractSnippets(uniquePassages),
            topics: this.organizeByTopic(uniquePassages),
            codeBlocks: this.extractCodeBlocks(uniquePassages),
            sequentialSteps: this.extractSteps(uniquePassages)
        };
    }

    private cleanText(text: string): string {
        let cleaned = text;
        // Remove page markers (e.g., "Page 2") but keep section numbers like "2.2.1"
        cleaned = cleaned.replace(/Page\s+\d+/gi, '');

        // Fix common PDF extraction artifacts
        cleaned = cleaned.replace(/\[\d+\]/g, ''); // Citation markers like [1]

        // Fix broken newlines (common in PDF extraction)
        cleaned = cleaned.replace(/([a-z,])\n([a-z])/g, '$1 $2');

        // ADVANCED WORD REPAIR: Fix split words like "compile d", "make s", "t he"
        // Pattern: Word + space + single letter (that should be part of the word)
        // We use a specific list of known suffixes to be safe
        cleaned = cleaned.replace(/\b([a-z]+)\s([ds])\b/g, (match, p1, p2) => {
            if (p1.length > 2) return p1 + p2; // compile d -> compiled
            return match;
        });

        // Fix "t he" -> "the", "w hat" -> "what"
        cleaned = cleaned.replace(/\b([twh])\s(he|hat|ere)\b/g, '$1$2');

        // Specific fixes for the user's reported issues
        const repairs = [
            { pattern: /\b(overvie)\s(w)\b/g, replacement: 'overview' },
            { pattern: /\b(ha)\s(rd)\b/g, replacement: 'hard' },
            { pattern: /\b(conflict)\s(s)\b/g, replacement: 'conflicts' },
            { pattern: /\b(make)\s(s)\b/g, replacement: 'makes' },
            { pattern: /\b(compile)\s(d)\b/g, replacement: 'compiled' },
            { pattern: /\b(interoper)\s(ate)\b/g, replacement: 'interoperate' },
            { pattern: /\b(u)\s(nique)\b/g, replacement: 'unique' },
            { pattern: /\b(comput)\s(er)\b/g, replacement: 'computer' },
            { pattern: /\b(toge)\s(ther)\b/g, replacement: 'together' },
            { pattern: /\b(wh)\s(at)\b/g, replacement: 'what' },
            { pattern: /\b(y)\s(ou)\b/g, replacement: 'you' },
            { pattern: /\b(inst)\s(ead)\b/g, replacement: 'instead' },
            { pattern: /\b(Microsof)\s(t)\b/g, replacement: 'Microsoft' }
        ];

        for (const repair of repairs) {
            cleaned = cleaned.replace(repair.pattern, repair.replacement);
        }

        // Normalize multiple spaces but PRESERVE newlines for structure
        cleaned = cleaned.replace(/[ \t]+/g, ' ');
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines

        return cleaned.trim();
    }

    private removeDuplicates(passages: string[]): string[] {
        const unique = new Set<string>();
        const result: string[] = [];

        for (const p of passages) {
            // Normalize for comparison
            const normalized = p.toLowerCase().replace(/\s+/g, '');
            if (!unique.has(normalized)) {
                unique.add(normalized);
                result.push(p);
            }
        }
        return result;
    }

    private extractSnippets(passages: string[]): string[] {
        const snippets: string[] = [];

        for (const p of passages) {
            // Split by double newlines (paragraphs)
            const blocks = p.split(/\n\n/);

            for (const block of blocks) {
                let trimmed = block.trim();
                if (trimmed.length < 10) continue;

                // 1. INLINE HEADER EXTRACTION
                // "Title: Content" -> Split into two
                const headerMatch = trimmed.match(/^([A-Z][A-Za-z\s]+):(\s+.*)/);
                if (headerMatch && headerMatch[1].length < 50 && headerMatch[1].length > 3) {
                    snippets.push(`### ${headerMatch[1]}`); // Add as header
                    trimmed = headerMatch[2].trim(); // Process rest as content
                }

                // 2. INLINE LIST DETECTION ("Listifier")
                // "Includes: A, B, and C." -> "Includes:\n- A\n- B\n- C"
                if (trimmed.includes(':') || trimmed.includes('include') || trimmed.includes('following')) {
                    const listMatch = trimmed.match(/(:|includes|following|such as)\s+((?:[^,]+,\s*)+[^,]+)/i);
                    if (listMatch) {
                        const prefix = trimmed.substring(0, trimmed.indexOf(listMatch[2]));
                        const itemsPart = listMatch[2];

                        // Split by comma or "and"
                        const items = itemsPart.split(/,\s*(?:and\s*)?|\s+and\s+/).map(i => i.trim()).filter(i => i.length > 2);

                        if (items.length > 2) {
                            snippets.push(prefix.trim());
                            items.forEach(item => snippets.push(`- ${item.replace(/\.$/, '')}`));
                            continue; // Skip adding the original block
                        }
                    }
                }

                snippets.push(trimmed);
            }
        }
        return snippets;
    }

    private organizeByTopic(passages: string[]): Record<string, string[]> {
        const topics: Record<string, string[]> = {};

        for (const p of passages) {
            // Split by double newlines to get paragraphs/sections
            const sections = p.split(/\n\n/);
            let currentTopic = 'General';

            for (const section of sections) {
                const lines = section.split('\n');
                const firstLine = lines[0].trim();

                // Header detection heuristic
                // 1. Starts with number (1.1, 2.3.1)
                // 2. All caps (min length 5)
                // 3. Ends with colon
                const isHeader =
                    /^\d+(\.\d+)+\s+[A-Z]/.test(firstLine) ||
                    (/^[A-Z\s\d.]{5,}$/.test(firstLine) && !firstLine.startsWith('- ')) ||
                    (firstLine.endsWith(':') && firstLine.length < 50);

                if (isHeader) {
                    currentTopic = firstLine.replace(/:$/, ''); // Remove trailing colon
                    // If there's content after the header in the same block, add it
                    const content = lines.slice(1).join('\n').trim();
                    if (content) {
                        if (!topics[currentTopic]) topics[currentTopic] = [];
                        topics[currentTopic].push(content);
                    }
                } else {
                    if (!topics[currentTopic]) topics[currentTopic] = [];
                    topics[currentTopic].push(section);
                }
            }
        }
        return topics;
    }

    private extractCodeBlocks(passages: string[]): string[] {
        const codeBlocks: string[] = [];
        for (const p of passages) {
            const matches = p.match(/```[\s\S]*?```/g);
            if (matches) {
                codeBlocks.push(...matches.map(m => m.replace(/```/g, '').trim()));
            }
        }
        return codeBlocks;
    }

    private extractSteps(passages: string[]): string[] {
        const steps: string[] = [];
        for (const p of passages) {
            // Look for numbered lists or "Step X"
            if (/^\d+\.|^Step\s+\d+/i.test(p)) {
                steps.push(p);
            }
        }
        return steps;
    }
    public fixGrammar(text: string): string {
        // Basic grammar fixes for source text
        let fixed = text;

        // Capitalize first letter of sentences
        fixed = fixed.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

        // Fix common spacing errors
        fixed = fixed.replace(/\s+,/g, ',');
        fixed = fixed.replace(/\s+\./g, '.');

        return fixed;
    }
}

export const contentCleaner = ContentCleaner.getInstance();
