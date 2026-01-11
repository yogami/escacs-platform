/**
 * DefectDetectionService Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DefectDetectionService } from '../../../src/lib/photo-inspection/domain/services/DefectDetectionService';
import { InspectionPhoto } from '../../../src/lib/photo-inspection/domain/entities/InspectionPhoto';
import { MockVisionAdapter } from '../../../src/lib/photo-inspection/infrastructure/MockVisionAdapter';

describe('DefectDetectionService', () => {
    let service: DefectDetectionService;
    let mockAdapter: MockVisionAdapter;

    beforeEach(() => {
        mockAdapter = new MockVisionAdapter();
        service = new DefectDetectionService(mockAdapter);
    });

    const createPhoto = (overrides = {}) => {
        return InspectionPhoto.create({
            id: 'photo-001',
            siteId: 'site-001',
            inspectorId: 'inspector-001',
            capturedAt: new Date(),
            imageUrl: 'https://example.com/photo.jpg',
            analysisStatus: 'pending',
            ...overrides,
        });
    };

    describe('analyzePhoto', () => {
        it('should return analysis result with defects array', async () => {
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.photo).toBeDefined();
            expect(result.defects).toBeInstanceOf(Array);
            expect(result.processingTimeMs).toBeGreaterThan(0);
        });

        it('should determine compliance status', async () => {
            mockAdapter.setMockPhotoType('compliant');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(typeof result.isCompliant).toBe('boolean');
        });

        it('should detect silt fence tear', async () => {
            mockAdapter.setMockPhotoType('silt_fence_tear');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.defects.length).toBeGreaterThan(0);
            expect(result.isCompliant).toBe(false);
        });

        it('should detect inlet clogged', async () => {
            mockAdapter.setMockPhotoType('inlet_clogged');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.defects.length).toBeGreaterThan(0);
        });

        it('should detect sediment tracking', async () => {
            mockAdapter.setMockPhotoType('sediment_tracking');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.defects.length).toBeGreaterThan(0);
        });

        it('should detect multiple defects', async () => {
            mockAdapter.setMockPhotoType('multiple_defects');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.defects.length).toBeGreaterThan(1);
        });

        it('should flag low quality images for manual review', async () => {
            mockAdapter.setMockPhotoType('low_quality');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            expect(result.requiresManualReview).toBe(true);
        });

        it('should include bounding boxes when detected', async () => {
            mockAdapter.setMockPhotoType('silt_fence_tear');
            const photo = createPhoto();
            const imageData = new Uint8Array([1, 2, 3, 4]);

            const result = await service.analyzePhoto(photo, imageData);

            const defectWithBox = result.defects.find(d => d.boundingBox !== null);
            if (defectWithBox) {
                expect(defectWithBox.boundingBox).toHaveProperty('x');
                expect(defectWithBox.boundingBox).toHaveProperty('y');
                expect(defectWithBox.boundingBox).toHaveProperty('width');
                expect(defectWithBox.boundingBox).toHaveProperty('height');
            }
        });
    });
});
