/**
 * DefectDetectionService - Domain Service
 * 
 * Orchestrates photo analysis with confidence scoring.
 */

import { BMPDefect } from '../entities/BMPDefect';
import type { DefectClass, DefectSeverity } from '../entities/BMPDefect';
import type { InspectionPhoto } from '../entities/InspectionPhoto';
import type { IVisionModelPort, AnalysisOutput } from '../../ports/IVisionModelPort';

export interface AnalysisResult {
    photo: InspectionPhoto;
    defects: BMPDefect[];
    isCompliant: boolean;
    requiresManualReview: boolean;
    reviewReason?: string;
    processingTimeMs: number;
}

export interface AnalysisConfig {
    confidenceThreshold: number;
    flagLowConfidenceThreshold: number;
}

const DEFAULT_CONFIG: AnalysisConfig = {
    confidenceThreshold: 0.85,
    flagLowConfidenceThreshold: 0.70,
};

export class DefectDetectionService {
    private readonly visionModel: IVisionModelPort;
    private readonly config: AnalysisConfig;

    constructor(
        visionModel: IVisionModelPort,
        config: AnalysisConfig = DEFAULT_CONFIG
    ) {
        this.visionModel = visionModel;
        this.config = config;
    }

    /**
     * Analyze a photo for BMP defects
     */
    async analyzePhoto(
        photo: InspectionPhoto,
        imageData: Uint8Array
    ): Promise<AnalysisResult> {
        photo.startAnalysis();

        const output = await this.visionModel.analyzePhoto(imageData);

        const defects = this.createDefects(photo.id, output);
        const isCompliant = defects.length === 0;

        // Check for low confidence detections
        const hasLowConfidence = output.detections.some(
            d => d.confidence < this.config.flagLowConfidenceThreshold
        );

        if (hasLowConfidence) {
            photo.completeAnalysis();
            return {
                photo,
                defects,
                isCompliant,
                requiresManualReview: true,
                reviewReason: 'Low confidence detection',
                processingTimeMs: output.processingTimeMs,
            };
        }

        photo.completeAnalysis();
        return {
            photo,
            defects,
            isCompliant,
            requiresManualReview: output.requiresManualReview,
            reviewReason: output.reviewReason,
            processingTimeMs: output.processingTimeMs,
        };
    }

    /**
     * Get severity based on defect class and context
     */
    determineSeverity(
        defectClass: DefectClass,
        confidence: number
    ): DefectSeverity {
        // Critical defects
        if (['inlet_overflow', 'sediment_tracking'].includes(defectClass)) {
            return 'critical';
        }

        // High severity defects
        if (['silt_fence_tear', 'inlet_clogged', 'inlet_bypassed'].includes(defectClass)) {
            return 'high';
        }

        // Adjust by confidence
        if (confidence < 0.75) {
            return 'medium';
        }

        // Medium severity
        if (['silt_fence_gap', 'perimeter_gap', 'bare_soil'].includes(defectClass)) {
            return 'medium';
        }

        return 'low';
    }

    private createDefects(photoId: string, output: AnalysisOutput): BMPDefect[] {
        return output.detections
            .filter(d => d.confidence >= this.config.confidenceThreshold)
            .map(d => BMPDefect.create({
                id: crypto.randomUUID(),
                inspectionId: photoId,
                defectClass: d.defectClass,
                confidence: d.confidence,
                severity: d.severity,
                boundingBox: d.boundingBox,
                recommendedAction: BMPDefect.getDefaultAction(d.defectClass),
                detectedAt: new Date(),
            }));
    }
}
