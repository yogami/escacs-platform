/**
 * VisionEnsembleService Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisionEnsembleService } from '../../../src/lib/photo-inspection/domain/services/VisionEnsembleService';
import type { IVisionApiPort, VisionAnalysisResult } from '../../../src/lib/photo-inspection/ports/IVisionApiPort';

const createMockAdapter = (
    modelId: string,
    result: Partial<VisionAnalysisResult>,
    available = true
): IVisionApiPort => ({
    getModelId: () => modelId,
    isAvailable: vi.fn().mockResolvedValue(available),
    analyzeImage: vi.fn().mockResolvedValue({
        modelId,
        detections: [],
        isCompliant: true,
        confidence: 0.9,
        processingTimeMs: 100,
        ...result,
    }),
});

describe('VisionEnsembleService', () => {
    describe('analyzeWithEnsemble', () => {
        it('should return manual review when insufficient adapters available', async () => {
            const adapter = createMockAdapter('test', {}, false);
            const service = new VisionEnsembleService([adapter]);

            const result = await service.analyzeWithEnsemble('base64image');

            expect(result.requiresManualReview).toBe(true);
            expect(result.reviewReason).toContain('Insufficient');
        });

        it('should call all available adapters', async () => {
            const adapters = [
                createMockAdapter('gpt-4o', {}),
                createMockAdapter('claude', {}),
                createMockAdapter('gemini', {}),
            ];
            const service = new VisionEnsembleService(adapters);

            await service.analyzeWithEnsemble('base64image');

            for (const adapter of adapters) {
                expect(adapter.analyzeImage).toHaveBeenCalled();
            }
        });

        it('should mark as compliant when all models agree no defects', async () => {
            const adapters = [
                createMockAdapter('gpt-4o', { isCompliant: true, detections: [] }),
                createMockAdapter('claude', { isCompliant: true, detections: [] }),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            expect(result.isCompliant).toBe(true);
            expect(result.detections).toHaveLength(0);
        });

        it('should return high consensus when all models agree', async () => {
            const adapters = [
                createMockAdapter('gpt-4o', { isCompliant: true, confidence: 0.9 }),
                createMockAdapter('claude', { isCompliant: true, confidence: 0.9 }),
                createMockAdapter('gemini', { isCompliant: true, confidence: 0.9 }),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            expect(result.consensusLevel).toBe('high');
            expect(result.requiresManualReview).toBe(false);
        });

        it('should consolidate detections with majority voting', async () => {
            const siltFenceDetection = {
                defectClass: 'silt_fence_tear' as const,
                confidence: 0.85,
                severity: 'high' as const,
            };

            const adapters = [
                createMockAdapter('gpt-4o', {
                    isCompliant: false,
                    detections: [siltFenceDetection],
                }),
                createMockAdapter('claude', {
                    isCompliant: false,
                    detections: [siltFenceDetection],
                }),
                createMockAdapter('gemini', {
                    isCompliant: true,
                    detections: [],
                }),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            // 2/3 models detected silt_fence_tear, should be in result
            expect(result.detections.length).toBeGreaterThan(0);
            expect(result.detections[0].defectClass).toBe('silt_fence_tear');
        });

        it('should boost confidence for agreed detections', async () => {
            const detection = {
                defectClass: 'inlet_clogged' as const,
                confidence: 0.8,
                severity: 'high' as const,
            };

            const adapters = [
                createMockAdapter('gpt-4o', { detections: [detection] }),
                createMockAdapter('claude', { detections: [detection] }),
                createMockAdapter('gemini', { detections: [detection] }),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            // Confidence should be boosted
            expect(result.detections[0].confidence).toBeGreaterThan(0.8);
        });

        it('should handle adapter failures gracefully', async () => {
            const failingAdapter: IVisionApiPort = {
                getModelId: () => 'failing',
                isAvailable: vi.fn().mockResolvedValue(true),
                analyzeImage: vi.fn().mockRejectedValue(new Error('API Error')),
            };

            const adapters = [
                createMockAdapter('gpt-4o', {}),
                createMockAdapter('claude', {}),
                failingAdapter,
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            // Should still work with 2 successful adapters
            expect(result.modelResults).toHaveLength(2);
        });

        it('should require manual review when models disagree', async () => {
            const adapters = [
                createMockAdapter('gpt-4o', { isCompliant: true, confidence: 0.6 }),
                createMockAdapter('claude', { isCompliant: false, confidence: 0.6 }),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            expect(result.consensusLevel).toBe('low');
            expect(result.requiresManualReview).toBe(true);
        });

        it('should track processing time', async () => {
            const adapters = [
                createMockAdapter('gpt-4o', {}),
                createMockAdapter('claude', {}),
            ];
            const service = new VisionEnsembleService(adapters);

            const result = await service.analyzeWithEnsemble('base64image');

            expect(typeof result.processingTimeMs).toBe('number');
            expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
    });
});
