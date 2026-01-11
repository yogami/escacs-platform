/**
 * IVisionModelPort - Port Interface
 * 
 * Interface for computer vision model inference.
 */

import type { DefectClass, DefectSeverity, BoundingBox } from '../domain/entities/BMPDefect';

export interface DetectionResult {
    defectClass: DefectClass;
    confidence: number;
    severity: DefectSeverity;
    boundingBox: BoundingBox;
}

export interface AnalysisOutput {
    photoId: string;
    detections: DetectionResult[];
    isCompliant: boolean;
    processingTimeMs: number;
    modelVersion: string;
    requiresManualReview: boolean;
    reviewReason?: string;
}

export interface IVisionModelPort {
    /**
     * Analyze a photo for BMP defects
     */
    analyzePhoto(imageData: Uint8Array): Promise<AnalysisOutput>;

    /**
     * Get model version info
     */
    getModelVersion(): string;

    /**
     * Check if model is ready for inference
     */
    isReady(): Promise<boolean>;

    /**
     * Get supported defect classes
     */
    getSupportedClasses(): DefectClass[];
}
