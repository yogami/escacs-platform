/**
 * MockVisionAdapter - Infrastructure Adapter
 * 
 * Mock implementation of vision model for development/testing.
 */

import type { DefectClass } from '../domain/entities/BMPDefect';
import type { IVisionModelPort, AnalysisOutput, DetectionResult } from '../ports/IVisionModelPort';

export type MockPhotoType =
    | 'silt_fence_tear'
    | 'inlet_clogged'
    | 'sediment_tracking'
    | 'multiple_defects'
    | 'compliant'
    | 'low_quality';

export class MockVisionAdapter implements IVisionModelPort {
    private mockPhotoType: MockPhotoType = 'compliant';

    setMockPhotoType(type: MockPhotoType): void {
        this.mockPhotoType = type;
    }

    async analyzePhoto(_imageData: Uint8Array): Promise<AnalysisOutput> {
        const startTime = Date.now();

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50));

        const detections = this.getMockDetections();
        const isCompliant = detections.length === 0;
        const requiresManualReview = this.mockPhotoType === 'low_quality';

        return {
            photoId: crypto.randomUUID(),
            detections,
            isCompliant,
            processingTimeMs: Date.now() - startTime,
            modelVersion: 'mock-v1.0.0',
            requiresManualReview,
            reviewReason: requiresManualReview ? 'Low confidence detection' : undefined,
        };
    }

    getModelVersion(): string {
        return 'mock-v1.0.0';
    }

    async isReady(): Promise<boolean> {
        return true;
    }

    getSupportedClasses(): DefectClass[] {
        return [
            'silt_fence_tear',
            'silt_fence_overtopping',
            'silt_fence_gap',
            'inlet_clogged',
            'inlet_bypassed',
            'inlet_overflow',
            'sediment_tracking',
            'bare_soil',
            'perimeter_gap',
            'construction_entrance_rutting',
        ];
    }

    private getMockDetections(): DetectionResult[] {
        switch (this.mockPhotoType) {
            case 'silt_fence_tear':
                return [{
                    defectClass: 'silt_fence_tear',
                    confidence: 0.92,
                    severity: 'high',
                    boundingBox: { x: 100, y: 50, width: 200, height: 150 },
                }];

            case 'inlet_clogged':
                return [{
                    defectClass: 'inlet_clogged',
                    confidence: 0.88,
                    severity: 'high',
                    boundingBox: { x: 150, y: 100, width: 120, height: 120 },
                }];

            case 'sediment_tracking':
                return [{
                    defectClass: 'sediment_tracking',
                    confidence: 0.90,
                    severity: 'critical',
                    boundingBox: { x: 0, y: 200, width: 400, height: 100 },
                }];

            case 'multiple_defects':
                return [
                    {
                        defectClass: 'silt_fence_tear',
                        confidence: 0.89,
                        severity: 'high',
                        boundingBox: { x: 50, y: 30, width: 150, height: 100 },
                    },
                    {
                        defectClass: 'perimeter_gap',
                        confidence: 0.86,
                        severity: 'medium',
                        boundingBox: { x: 250, y: 40, width: 100, height: 80 },
                    },
                ];

            case 'low_quality':
                return [{
                    defectClass: 'unknown',
                    confidence: 0.55,
                    severity: 'medium',
                    boundingBox: { x: 100, y: 100, width: 200, height: 200 },
                }];

            case 'compliant':
            default:
                return [];
        }
    }
}
