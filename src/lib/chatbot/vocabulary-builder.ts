export class VocabularyBuilder {
    private subjects: Set<string> = new Set();
    private technicalTerms: Set<string> = new Set();
    private actionVerbs: Set<string> = new Set();
    private temporalIndicators: Set<string> = new Set();
    private languageNames: Set<string> = new Set();
    private domainTerms: Set<string> = new Set();

    // Singleton instance
    private static instance: VocabularyBuilder;

    private constructor() { }

    public static getInstance(): VocabularyBuilder {
        if (!VocabularyBuilder.instance) {
            VocabularyBuilder.instance = new VocabularyBuilder();
        }
        return VocabularyBuilder.instance;
    }

    /**
     * Learn vocabulary from a set of documents
     */
    public learnFromDocuments(documents: string[]) {
        for (const doc of documents) {
            this.analyzeDocument(doc);
        }
        console.log(`[VocabularyBuilder] Learned: ${this.subjects.size} subjects, ${this.technicalTerms.size} technical terms, ${this.actionVerbs.size} verbs.`);
    }

    private analyzeDocument(text: string) {
        const words = text.split(/\s+/);

        // Simple heuristics to categorize words (in a real system, this would use a POS tagger)
        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^\w]/g, '').toLowerCase();
            if (word.length < 2) continue;

            // Heuristic: Words following "is a", "defined as" are likely subjects/concepts
            if (i > 1 && words[i - 1].toLowerCase() === 'a' && words[i - 2].toLowerCase() === 'is') {
                this.subjects.add(word);
            }

            // Heuristic: Words ending in "ing" or "ed" might be verbs (very rough)
            // Better: Contextual clues like "to [verb]"
            if (i > 0 && words[i - 1].toLowerCase() === 'to') {
                this.actionVerbs.add(word);
            }

            // Heuristic: Temporal indicators often start sentences or clauses
            // "Then", "Next", "After"
            // We can also look for time units: seconds, minutes, years
            if (['seconds', 'minutes', 'hours', 'days', 'years', 'later', 'ago'].includes(word)) {
                this.temporalIndicators.add(word);
            }

            // Heuristic: Technical terms often appear in specific patterns or are capitalized in mid-sentence (if we preserved case)
            // For now, we'll assume anything in a "code" block context or following "function", "class" is technical
            if (i > 0 && ['function', 'class', 'const', 'let', 'var', 'import'].includes(words[i - 1].toLowerCase())) {
                this.technicalTerms.add(word);
            }

            // Heuristic: Language names often appear near "written in", "using", "language"
            if (i < words.length - 1 && words[i + 1].toLowerCase() === 'language') {
                this.languageNames.add(word);
            }
        }
    }

    public isSubject(word: string): boolean {
        return this.subjects.has(word.toLowerCase());
    }

    public isTechnicalTerm(word: string): boolean {
        return this.technicalTerms.has(word.toLowerCase());
    }

    public isActionVerb(word: string): boolean {
        return this.actionVerbs.has(word.toLowerCase());
    }

    public isTemporal(word: string): boolean {
        return this.temporalIndicators.has(word.toLowerCase());
    }

    public isLanguage(word: string): boolean {
        return this.languageNames.has(word.toLowerCase());
    }

    public getSubjects(): string[] {
        return Array.from(this.subjects);
    }
}

export const vocabularyBuilder = VocabularyBuilder.getInstance();
