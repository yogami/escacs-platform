/**
 * Unit tests for BMPDefect entity
 */

import { describe, it, expect } from 'vitest';
import { BMPDefect } from '@/lib/photo-inspection';

describe('BMPDefect', () => {
    const createProps = () => ({
        id: 'defect-001',
        inspectionId: 'photo-001',
        defectClass: 'silt_fence_tear' as const,
        confidence: 0.92,
        severity: 'high' as const,
        boundingBox: { x: 100, y: 50, width: 200, height: 150 },
        detectedAt: new Date(),
    });

    describe('create', () => {
        it('should create a valid defect', () => {
            const defect = BMPDefect.create(createProps());

            expect(defect.id).toBe('defect-001');
            expect(defect.defectClass).toBe('silt_fence_tear');
            expect(defect.confidence).toBe(0.92);
        });

        it('should reject confidence below 0', () => {
            expect(() =>
                BMPDefect.create({ ...createProps(), confidence: -0.1 })
            ).toThrow('Confidence must be between 0 and 1');
        });

        it('should reject confidence above 1', () => {
            expect(() =>
                BMPDefect.create({ ...createProps(), confidence: 1.1 })
            ).toThrow('Confidence must be between 0 and 1');
        });
    });

    describe('meetsConfidenceThreshold', () => {
        it('should return true when confidence meets threshold', () => {
            const defect = BMPDefect.create({ ...createProps(), confidence: 0.90 });
            expect(defect.meetsConfidenceThreshold(0.85)).toBe(true);
        });

        it('should return false when confidence is below threshold', () => {
            const defect = BMPDefect.create({ ...createProps(), confidence: 0.80 });
            expect(defect.meetsConfidenceThreshold(0.85)).toBe(false);
        });
    });

    describe('requiresImmediateAction', () => {
        it('should return true for critical severity', () => {
            const defect = BMPDefect.create({ ...createProps(), severity: 'critical' });
            expect(defect.requiresImmediateAction()).toBe(true);
        });

        it('should return true for high severity', () => {
            const defect = BMPDefect.create({ ...createProps(), severity: 'high' });
            expect(defect.requiresImmediateAction()).toBe(true);
        });

        it('should return false for low severity', () => {
            const defect = BMPDefect.create({ ...createProps(), severity: 'low' });
            expect(defect.requiresImmediateAction()).toBe(false);
        });
    });

    describe('getDefaultAction', () => {
        it('should return appropriate action for silt_fence_tear', () => {
            const action = BMPDefect.getDefaultAction('silt_fence_tear');
            expect(action).toContain('Repair or replace');
        });

        it('should return appropriate action for sediment_tracking', () => {
            const action = BMPDefect.getDefaultAction('sediment_tracking');
            expect(action).toContain('wheel wash');
        });
    });
});
