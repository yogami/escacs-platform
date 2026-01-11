/**
 * InspectionPhoto Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { InspectionPhoto } from '../../../src/lib/photo-inspection/domain/entities/InspectionPhoto';

describe('InspectionPhoto', () => {
    const validProps = {
        id: 'photo-001',
        siteId: 'site-001',
        inspectorId: 'inspector-001',
        capturedAt: new Date(),
        imageUrl: 'https://example.com/photo.jpg',
        analysisStatus: 'pending' as const,
    };

    describe('create', () => {
        it('should create a valid photo', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.id).toBe(validProps.id);
            expect(photo.siteId).toBe(validProps.siteId);
        });

        it('should throw on missing imageUrl', () => {
            expect(() => InspectionPhoto.create({ ...validProps, imageUrl: '' })).toThrow();
        });

        it('should default gpsCoordinates to null', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.gpsCoordinates).toBeNull();
        });
    });

    describe('hasGpsCoordinates', () => {
        it('should return false when no GPS', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.hasGpsCoordinates()).toBe(false);
        });

        it('should return true when GPS present', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: { latitude: 37.5, longitude: -77.4, accuracy: 5 },
            });
            expect(photo.hasGpsCoordinates()).toBe(true);
        });
    });

    describe('isGpsAccurate', () => {
        it('should return false when no GPS', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.isGpsAccurate(10)).toBe(false);
        });

        it('should return true when accuracy within threshold', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: { latitude: 37.5, longitude: -77.4, accuracy: 3 },
            });
            expect(photo.isGpsAccurate(5)).toBe(true);
        });

        it('should return false when accuracy exceeds threshold', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: { latitude: 37.5, longitude: -77.4, accuracy: 15 },
            });
            expect(photo.isGpsAccurate(10)).toBe(false);
        });

        it('should use default threshold of 5', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: { latitude: 37.5, longitude: -77.4, accuracy: 3 },
            });
            expect(photo.isGpsAccurate()).toBe(true);
        });
    });

    describe('updateAnalysisStatus', () => {
        it('should update to analyzing', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.updateAnalysisStatus('analyzing');
            expect(photo.analysisStatus).toBe('analyzing');
        });

        it('should update to completed and set analyzedAt', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.updateAnalysisStatus('completed');
            expect(photo.analysisStatus).toBe('completed');
            expect(photo.analyzedAt).toBeInstanceOf(Date);
        });

        it('should update to failed', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.updateAnalysisStatus('failed');
            expect(photo.analysisStatus).toBe('failed');
        });
    });

    describe('analysis lifecycle methods', () => {
        it('should transition through startAnalysis', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.startAnalysis();
            expect(photo.analysisStatus).toBe('analyzing');
        });

        it('should transition through completeAnalysis', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.completeAnalysis();
            expect(photo.analysisStatus).toBe('completed');
            expect(photo.analyzedAt).toBeInstanceOf(Date);
        });

        it('should transition through failAnalysis', () => {
            const photo = InspectionPhoto.create(validProps);
            photo.failAnalysis();
            expect(photo.analysisStatus).toBe('failed');
        });
    });
});
