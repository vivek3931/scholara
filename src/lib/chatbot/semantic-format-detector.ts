import { PassageScore } from './passage-reranker';
import { vocabularyBuilder } from './vocabulary-builder';

export interface FormatDetectionResult {
    format: string;
    confidence: number;
    scores: Record<string, number>;
    reasoning: string;
}

interface QuestionFeatures {
    entityCount: number;
    relationshipType: string;
    complexityScore: number;
    hasLanguageNames: boolean;
    intentSignals: {
        isComparative: number;
        isProcedural: number;
        isListingRequest: number;
        isExplanatory: number;
    };
}

interface ContentFeatures {
    structuralMetrics: {
        parallelismScore: number;
        uniformityScore: number;
        keyValueRatio: number;
    };
    semanticMetrics: {
        topicCoherence: number;
        redundancyScore: number;
        diversityScore: number;
    };
    procedureMetrics: {
        temporalDensity: number;
        actionVerbDensity: number;
        sequenceMarkerScore: number;
    };
    languageMetrics: {
        explanatoryDensity: number;
        technicalTermDensity: number;
        codePresenceScore: number;
    };
    snippetCount: number;
    lengthVariance: number;
}

export class SemanticFormatDetector {

    async detectFormat(
        question: string,
        passages: PassageScore[]
    ): Promise<FormatDetectionResult> {
        // 1. Extract features
        const qFeatures = this.extractQuestionFeatures(question);
        const cFeatures = this.extractContentFeatures(passages.map(p => p.text));

        // 2. Score all formats
        const scores = {
            table: this.scoreTableFormat(qFeatures, cFeatures),
            bullet_points: this.scoreBulletFormat(qFeatures, cFeatures),
            step_by_step: this.scoreStepFormat(qFeatures, cFeatures),
            code: this.scoreCodeFormat(qFeatures, cFeatures),
            narrative: this.scoreNarrativeFormat(qFeatures, cFeatures)
        };

        // 3. Select best format
        let bestFormat = 'narrative';
        let maxScore = -1;

        for (const [format, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestFormat = format;
            }
        }

        // 4. Calculate confidence
        const sortedScores = Object.values(scores).sort((a, b) => b - a);
        const gap = sortedScores.length > 1 ? sortedScores[0] - sortedScores[1] : 1.0;
        const confidence = Math.min(maxScore * (0.5 + gap), 1.0);

        // 5. Generate reasoning
        const reasoning = this.generateReasoning(bestFormat, qFeatures, cFeatures, scores);

        return {
            format: bestFormat,
            confidence,
            scores,
            reasoning
        };
    }

    // --- Feature Extraction ---

    private extractQuestionFeatures(question: string): QuestionFeatures {
        const lowerQ = question.toLowerCase();

        // Entity counting (heuristic)
        const entities = this.extractEntities(question);

        // Intent signals
        const isComparative = this.calculateComparativeScore(lowerQ);
        const isProcedural = this.calculateProceduralScore(lowerQ);
        const isListingRequest = this.calculateListingScore(lowerQ);
        const isExplanatory = this.calculateExplanatoryScore(lowerQ);

        // Language detection using VocabularyBuilder
        const words = lowerQ.split(/\W+/);
        const hasLanguageNames = words.some(w => vocabularyBuilder.isLanguage(w));

        // Relationship type
        let relationshipType = 'explanation';
        if (isComparative > 0.6) relationshipType = 'comparison';
        else if (isProcedural > 0.6) relationshipType = 'procedural';
        else if (isListingRequest > 0.6) relationshipType = 'listing';
        else if (isExplanatory > 0.6) relationshipType = 'definition';

        return {
            entityCount: entities.length,
            relationshipType,
            complexityScore: Math.min(question.split(' ').length / 20, 1.0),
            hasLanguageNames,
            intentSignals: {
                isComparative,
                isProcedural,
                isListingRequest,
                isExplanatory
            }
        };
    }

    private extractContentFeatures(passages: string[]): ContentFeatures {
        if (passages.length === 0) {
            return this.getEmptyContentFeatures();
        }

        // Structural
        const lengths = passages.map(p => p.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const lengthVariance = lengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / lengths.length;
        const normalizedVariance = Math.min(lengthVariance / 10000, 1.0); // Normalize

        // Metrics
        return {
            structuralMetrics: {
                parallelismScore: this.analyzeParallelism(passages),
                uniformityScore: 1 - normalizedVariance,
                keyValueRatio: this.calculateKeyValueRatio(passages)
            },
            semanticMetrics: {
                topicCoherence: 0.7, // Placeholder for embedding sim
                redundancyScore: 0.3, // Placeholder
                diversityScore: 0.7 // Placeholder
            },
            procedureMetrics: {
                temporalDensity: this.countTemporalReferences(passages),
                actionVerbDensity: this.countActionVerbs(passages),
                sequenceMarkerScore: this.countSequenceMarkers(passages)
            },
            languageMetrics: {
                explanatoryDensity: this.countExplanatoryTerms(passages),
                technicalTermDensity: this.countTechnicalTerms(passages),
                codePresenceScore: this.hasCodeBlocks(passages)
            },
            snippetCount: passages.length,
            lengthVariance: normalizedVariance
        };
    }

    // --- Scoring Functions ---

    private scoreTableFormat(q: QuestionFeatures, c: ContentFeatures): number {
        let score = (
            0.25 * c.structuralMetrics.parallelismScore +
            0.25 * c.structuralMetrics.keyValueRatio +
            0.15 * q.intentSignals.isComparative +
            0.15 * (1 - c.procedureMetrics.temporalDensity) +
            0.1 * c.semanticMetrics.topicCoherence +
            0.1 * (q.entityCount > 1 ? 1 : 0)
        );

        if (q.entityCount === 2) score += 0.1;
        if (c.snippetCount < 5) score += 0.05;

        return Math.min(score, 1.0);
    }

    private scoreBulletFormat(q: QuestionFeatures, c: ContentFeatures): number {
        let score = (
            0.25 * c.semanticMetrics.topicCoherence +
            0.2 * (1 - c.procedureMetrics.temporalDensity) +
            0.2 * c.structuralMetrics.uniformityScore +
            0.15 * q.intentSignals.isListingRequest +
            0.1 * c.semanticMetrics.diversityScore +
            0.1 * (c.snippetCount >= 5 && c.snippetCount <= 15 ? 1 : 0)
        );
        return Math.min(score, 1.0);
    }

    private scoreStepFormat(q: QuestionFeatures, c: ContentFeatures): number {
        let score = (
            0.35 * c.procedureMetrics.temporalDensity +
            0.25 * c.procedureMetrics.actionVerbDensity +
            0.2 * c.procedureMetrics.sequenceMarkerScore +
            0.1 * q.intentSignals.isProcedural +
            0.1 * (c.snippetCount >= 3 && c.snippetCount <= 12 ? 1 : 0)
        );

        if (q.intentSignals.isProcedural > 0.8) score += 0.1;
        if (c.procedureMetrics.temporalDensity < 0.3) score -= 0.2;

        return Math.min(Math.max(score, 0), 1.0);
    }

    private scoreCodeFormat(q: QuestionFeatures, c: ContentFeatures): number {
        let score = (
            0.4 * c.languageMetrics.codePresenceScore +
            0.25 * c.languageMetrics.technicalTermDensity +
            0.2 * (q.hasLanguageNames ? 0.9 : 0.3) +
            0.15 * (c.languageMetrics.codePresenceScore > 0 ? 1 : 0)
        );

        if (c.languageMetrics.codePresenceScore > 0.8) score += 0.2;

        return Math.min(score, 1.0);
    }

    private scoreNarrativeFormat(q: QuestionFeatures, c: ContentFeatures): number {
        let score = (
            0.25 * c.languageMetrics.explanatoryDensity +
            0.2 * (1 - c.structuralMetrics.parallelismScore) +
            0.2 * c.lengthVariance +
            0.15 * q.intentSignals.isExplanatory +
            0.1 * (c.snippetCount >= 10 ? 1 : 0.5) +
            0.1 * (1 - c.procedureMetrics.temporalDensity)
        );

        return Math.min(Math.max(score, 0.2), 1.0);
    }

    // --- Helpers ---

    private extractEntities(text: string): string[] {
        // Use vocabulary builder to find known subjects
        const words = text.split(/\W+/);
        return words.filter(w => vocabularyBuilder.isSubject(w));
    }

    private calculateComparativeScore(text: string): number {
        // Dynamic check: does it contain "vs" or comparative terms?
        if (/compare|difference|vs|versus|better|worse/.test(text)) return 0.9;
        return 0.1;
    }

    private calculateProceduralScore(text: string): number {
        // Use vocabulary to check for action verbs
        const words = text.split(/\W+/);
        const actionVerbCount = words.filter(w => vocabularyBuilder.isActionVerb(w)).length;
        if (actionVerbCount > 2 || /how to|steps|guide/.test(text)) return 0.9;
        return 0.1;
    }

    private calculateListingScore(text: string): number {
        if (/list|types|examples|features|benefits/.test(text)) return 0.9;
        return 0.1;
    }

    private calculateExplanatoryScore(text: string): number {
        if (/explain|define|what is|meaning/.test(text)) return 0.9;
        return 0.3;
    }

    private analyzeParallelism(passages: string[]): number {
        if (passages.length < 2) return 0;

        let similarity = 0;
        for (let i = 1; i < passages.length; i++) {
            // Simple: count common words
            const p1Words = new Set(passages[i - 1].toLowerCase().split(/\W+/).filter(w => w.length > 3));
            const p2Words = new Set(passages[i].toLowerCase().split(/\W+/).filter(w => w.length > 3));

            if (p1Words.size === 0 || p2Words.size === 0) continue;

            const intersection = [...p1Words].filter(w => p2Words.has(w)).length;
            const union = new Set([...p1Words, ...p2Words]).size;

            similarity += intersection / union;
        }

        return similarity / (passages.length - 1);
    }

    private calculateKeyValueRatio(passages: string[]): number {
        const matches = passages.filter(p => /^[^:]+:\s/.test(p)).length;
        return matches / passages.length;
    }

    private countTemporalReferences(passages: string[]): number {
        let count = 0;
        for (const passage of passages) {
            const words = passage.split(/\W+/);
            count += words.filter(w => vocabularyBuilder.isTemporal(w)).length;
        }
        return Math.min(count / (passages.length * 2), 1.0);
    }

    private countActionVerbs(passages: string[]): number {
        let count = 0;
        for (const passage of passages) {
            const words = passage.split(/\W+/);
            count += words.filter(w => vocabularyBuilder.isActionVerb(w)).length;
        }
        return Math.min(count / (passages.length * 3), 1.0);
    }

    private countSequenceMarkers(passages: string[]): number {
        const markers = passages.filter(p => /^\d+\.|^Step\s\d+|^-\s/.test(p)).length;
        return markers / passages.length;
    }

    private countExplanatoryTerms(passages: string[]): number {
        // Heuristic: check for "is a", "means"
        const terms = ['is', 'means', 'refers', 'defines'];
        let count = 0;
        for (const passage of passages) {
            for (const term of terms) {
                if (passage.includes(term)) count++;
            }
        }
        return Math.min(count / passages.length, 1.0);
    }

    private countTechnicalTerms(passages: string[]): number {
        let count = 0;
        for (const passage of passages) {
            const words = passage.split(/\W+/);
            count += words.filter(w => vocabularyBuilder.isTechnicalTerm(w)).length;
        }
        return Math.min(count / passages.length, 1.0);
    }

    private hasCodeBlocks(passages: string[]): number {
        const hasBackticks = passages.filter(p => p.includes('```') || p.includes('`')).length;
        return Math.min(hasBackticks / Math.max(passages.length / 2, 1), 1.0);
    }

    private getEmptyContentFeatures(): ContentFeatures {
        return {
            structuralMetrics: { parallelismScore: 0, uniformityScore: 0, keyValueRatio: 0 },
            semanticMetrics: { topicCoherence: 0, redundancyScore: 0, diversityScore: 0 },
            procedureMetrics: { temporalDensity: 0, actionVerbDensity: 0, sequenceMarkerScore: 0 },
            languageMetrics: { explanatoryDensity: 0, technicalTermDensity: 0, codePresenceScore: 0 },
            snippetCount: 0,
            lengthVariance: 0
        };
    }

    private generateReasoning(
        format: string,
        q: QuestionFeatures,
        c: ContentFeatures,
        scores: Record<string, number>
    ): string {
        return `Selected ${format} (score: ${scores[format].toFixed(2)}) based on intent signals and content structure.`;
    }
}

export const semanticFormatDetector = new SemanticFormatDetector();
