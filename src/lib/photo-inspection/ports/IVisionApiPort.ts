/**
 * IVisionApiPort - Port Interface
 * 
 * Unified interface for vision model APIs (OpenAI, Anthropic, Google).
 */

import type { DefectClass } from '../domain/entities/BMPDefect';

export interface VisionDetection {
    defectClass: DefectClass | 'unknown';
    confidence: number; // 0-1
    severity: 'low' | 'medium' | 'high' | 'critical';
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    description?: string;
}

export interface VisionAnalysisResult {
    modelId: string;
    detections: VisionDetection[];
    isCompliant: boolean;
    confidence: number;
    rawResponse?: string;
    processingTimeMs: number;
}

export interface IVisionApiPort {
    /**
     * Analyze an image for BMP defects
     */
    analyzeImage(imageBase64: string, prompt: string): Promise<VisionAnalysisResult>;

    /**
     * Get the model identifier
     */
    getModelId(): string;

    /**
     * Check if the API is available
     */
    isAvailable(): Promise<boolean>;
}
