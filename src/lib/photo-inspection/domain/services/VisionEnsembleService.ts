/**
 * VisionEnsembleService - Domain Service
 * 
 * Orchestrates multi-model vision analysis with consensus voting for 90%+ accuracy.
 * Uses GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro in an ensemble.
 */

import type { IVisionApiPort, VisionAnalysisResult, VisionDetection } from '../../ports/IVisionApiPort';
import type { DefectClass } from '../entities/BMPDefect';

export interface EnsembleResult {
    detections: VisionDetection[];
    isCompliant: boolean;
    confidence: number;
    consensusLevel: 'high' | 'medium' | 'low';
    requiresManualReview: boolean;
    reviewReason?: string;
    modelResults: VisionAnalysisResult[];
    processingTimeMs: number;
}

const BMP_ANALYSIS_PROMPT = `Analyze this construction site photo for Best Management Practice (BMP) defects.

Look for these specific defect types:
- Silt fence tears, gaps, or overtopping
- Clogged, bypassed, or overflowing inlet protection
- Sediment tracking on roads
- Bare soil without stabilization
- Perimeter control gaps
- Construction entrance issues

For each defect found, provide:
1. Defect class (e.g., silt_fence_tear, inlet_clogged)
2. Severity (low/medium/high/critical)
3. Confidence level (0-1)
4. Location in image (approximate bounding box)

If no defects are visible, mark as compliant.
Respond in JSON format.`;

export class VisionEnsembleService {
    private readonly adapters: IVisionApiPort[];
    private readonly minModelsRequired = 2;

    constructor(adapters: IVisionApiPort[]) {
        this.adapters = adapters;
    }

    /**
     * Analyze image using all available vision models
     */
    async analyzeWithEnsemble(imageBase64: string): Promise<EnsembleResult> {
        const startTime = Date.now();

        // Get available adapters
        const availableAdapters = await this.getAvailableAdapters();

        if (availableAdapters.length < this.minModelsRequired) {
            return this.createManualReviewResult(
                'Insufficient models available for ensemble',
                Date.now() - startTime
            );
        }

        // Run all models in parallel
        const results = await Promise.allSettled(
            availableAdapters.map(adapter =>
                adapter.analyzeImage(imageBase64, BMP_ANALYSIS_PROMPT)
            )
        );

        const successfulResults = results
            .filter((r): r is PromiseFulfilledResult<VisionAnalysisResult> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successfulResults.length < this.minModelsRequired) {
            return this.createManualReviewResult(
                'Too many model failures',
                Date.now() - startTime
            );
        }

        // Consolidate results with consensus voting
        return this.consolidateResults(successfulResults, Date.now() - startTime);
    }

    /**
     * Get adapters that are currently available
     */
    private async getAvailableAdapters(): Promise<IVisionApiPort[]> {
        const availability = await Promise.all(
            this.adapters.map(async adapter => ({
                adapter,
                available: await adapter.isAvailable(),
            }))
        );
        return availability.filter(a => a.available).map(a => a.adapter);
    }

    /**
     * Consolidate multiple model results using consensus voting
     */
    private consolidateResults(
        results: VisionAnalysisResult[],
        processingTimeMs: number
    ): EnsembleResult {
        const allDetections = results.flatMap(r => r.detections);
        const consolidatedDetections = this.voteOnDetections(allDetections, results.length);
        const consensusLevel = this.determineConsensusLevel(results);
        const isCompliant = consolidatedDetections.length === 0;

        // Calculate overall confidence
        const avgConfidence = results.length > 0
            ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
            : 0;

        return {
            detections: consolidatedDetections,
            isCompliant,
            confidence: avgConfidence,
            consensusLevel,
            requiresManualReview: consensusLevel === 'low',
            reviewReason: consensusLevel === 'low' ? 'Models disagree on classification' : undefined,
            modelResults: results,
            processingTimeMs,
        };
    }

    /**
     * Vote on detections across models
     */
    private voteOnDetections(
        detections: VisionDetection[],
        modelCount: number
    ): VisionDetection[] {
        // Group detections by class
        const byClass = new Map<DefectClass | 'unknown', VisionDetection[]>();
        for (const d of detections) {
            const existing = byClass.get(d.defectClass) ?? [];
            existing.push(d);
            byClass.set(d.defectClass, existing);
        }

        // Keep detections with majority vote
        const consolidated: VisionDetection[] = [];
        for (const [, classDetections] of byClass) {
            const voteCount = classDetections.length;
            const voteRatio = voteCount / modelCount;

            if (voteRatio >= 0.5) { // Majority or tie
                // Take highest confidence detection
                const best = classDetections.reduce((a, b) =>
                    a.confidence > b.confidence ? a : b
                );
                consolidated.push({
                    ...best,
                    // Boost confidence based on agreement
                    confidence: Math.min(1, best.confidence * (1 + voteRatio * 0.2)),
                });
            }
        }

        return consolidated;
    }

    /**
     * Determine consensus level from model agreement
     */
    private determineConsensusLevel(results: VisionAnalysisResult[]): 'high' | 'medium' | 'low' {
        if (results.length < 2) return 'low';

        const complianceAgreement = results.every(r => r.isCompliant === results[0].isCompliant);
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

        if (complianceAgreement && avgConfidence >= 0.85) return 'high';
        if (complianceAgreement && avgConfidence >= 0.65) return 'medium';
        return 'low';
    }

    /**
     * Create result indicating manual review needed
     */
    private createManualReviewResult(reason: string, processingTimeMs: number): EnsembleResult {
        return {
            detections: [],
            isCompliant: false,
            confidence: 0,
            consensusLevel: 'low',
            requiresManualReview: true,
            reviewReason: reason,
            modelResults: [],
            processingTimeMs,
        };
    }
}
