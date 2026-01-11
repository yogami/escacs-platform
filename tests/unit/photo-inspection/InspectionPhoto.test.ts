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
            expect(photo.inspectorId).toBe(validProps.inspectorId);
        });

        it('should set analysis status to pending', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.analysisStatus).toBe('pending');
        });

        it('should accept analyzing status', () => {
            const photo = InspectionPhoto.create({ ...validProps, analysisStatus: 'analyzing' });
            expect(photo.analysisStatus).toBe('analyzing');
        });

        it('should accept complete status', () => {
            const photo = InspectionPhoto.create({ ...validProps, analysisStatus: 'complete' });
            expect(photo.analysisStatus).toBe('complete');
        });

        it('should accept failed status', () => {
            const photo = InspectionPhoto.create({ ...validProps, analysisStatus: 'failed' });
            expect(photo.analysisStatus).toBe('failed');
        });

        it('should accept GPS coordinates', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: {
                    latitude: 37.5407,
                    longitude: -77.4360,
                    accuracy: 5,
                },
            });

            expect(photo.gpsCoordinates).toBeDefined();
            expect(photo.gpsCoordinates?.latitude).toBe(37.5407);
            expect(photo.gpsCoordinates?.longitude).toBe(-77.4360);
            expect(photo.gpsCoordinates?.accuracy).toBe(5);
        });

        it('should handle missing GPS coordinates', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.gpsCoordinates).toBeNull();
        });

        it('should store captured timestamp', () => {
            const capturedAt = new Date('2026-01-10T12:00:00Z');
            const photo = InspectionPhoto.create({ ...validProps, capturedAt });
            expect(photo.capturedAt).toEqual(capturedAt);
        });

        it('should store image URL', () => {
            const photo = InspectionPhoto.create(validProps);
            expect(photo.imageUrl).toBe(validProps.imageUrl);
        });
    });

    describe('GPS coordinates', () => {
        it('should allow accuracy of 0', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: {
                    latitude: 37.5407,
                    longitude: -77.4360,
                    accuracy: 0,
                },
            });

            expect(photo.gpsCoordinates?.accuracy).toBe(0);
        });

        it('should handle high accuracy values', () => {
            const photo = InspectionPhoto.create({
                ...validProps,
                gpsCoordinates: {
                    latitude: 37.5407,
                    longitude: -77.4360,
                    accuracy: 100,
                },
            });

            expect(photo.gpsCoordinates?.accuracy).toBe(100);
        });
    });
});
