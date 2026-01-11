/**
 * SiteCondition Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { SiteCondition } from '../../../src/lib/risk-engine/domain/entities/SiteCondition';

describe('SiteCondition', () => {
    const validProps = {
        siteId: 'site-001',
        phase: 'grading' as const,
        slopePercent: 12,
        soilType: 'sandy' as const,
        acreage: 5.5,
        daysSinceLastInspection: 3,
        bmpInventory: [],
        historicalNOVCount: 1,
        observedAt: new Date(),
    };

    describe('create', () => {
        it('should create a valid site condition', () => {
            const condition = SiteCondition.create(validProps);

            expect(condition.siteId).toBe(validProps.siteId);
            expect(condition.phase).toBe(validProps.phase);
            expect(condition.slopePercent).toBe(validProps.slopePercent);
        });

        it('should reject negative slope', () => {
            expect(() => SiteCondition.create({ ...validProps, slopePercent: -5 })).toThrow();
        });

        it('should accept all valid phases', () => {
            const phases = ['clearing', 'grading', 'paving', 'stabilization', 'completed'] as const;

            for (const phase of phases) {
                const condition = SiteCondition.create({ ...validProps, phase });
                expect(condition.phase).toBe(phase);
            }
        });

        it('should accept all valid soil types', () => {
            const soilTypes = ['sandy', 'loam', 'clay', 'rocky'] as const;

            for (const soilType of soilTypes) {
                const condition = SiteCondition.create({ ...validProps, soilType });
                expect(condition.soilType).toBe(soilType);
            }
        });
    });

    describe('isHighRiskPhase', () => {
        it('should return true for clearing phase', () => {
            const condition = SiteCondition.create({ ...validProps, phase: 'clearing' });
            expect(condition.isHighRiskPhase()).toBe(true);
        });

        it('should return true for grading phase', () => {
            const condition = SiteCondition.create({ ...validProps, phase: 'grading' });
            expect(condition.isHighRiskPhase()).toBe(true);
        });

        it('should return false for paving phase', () => {
            const condition = SiteCondition.create({ ...validProps, phase: 'paving' });
            expect(condition.isHighRiskPhase()).toBe(false);
        });

        it('should return false for stabilization phase', () => {
            const condition = SiteCondition.create({ ...validProps, phase: 'stabilization' });
            expect(condition.isHighRiskPhase()).toBe(false);
        });

        it('should return false for completed phase', () => {
            const condition = SiteCondition.create({ ...validProps, phase: 'completed' });
            expect(condition.isHighRiskPhase()).toBe(false);
        });
    });

    describe('hasErodibleSoil', () => {
        it('should return true for sandy soil', () => {
            const condition = SiteCondition.create({ ...validProps, soilType: 'sandy' });
            expect(condition.hasErodibleSoil()).toBe(true);
        });

        it('should return false for loam soil', () => {
            const condition = SiteCondition.create({ ...validProps, soilType: 'loam' });
            expect(condition.hasErodibleSoil()).toBe(false);
        });

        it('should return false for clay soil', () => {
            const condition = SiteCondition.create({ ...validProps, soilType: 'clay' });
            expect(condition.hasErodibleSoil()).toBe(false);
        });

        it('should return false for rocky soil', () => {
            const condition = SiteCondition.create({ ...validProps, soilType: 'rocky' });
            expect(condition.hasErodibleSoil()).toBe(false);
        });
    });

    describe('isInspectionOverdue', () => {
        it('should return true when days exceed threshold', () => {
            const condition = SiteCondition.create({ ...validProps, daysSinceLastInspection: 10 });
            expect(condition.isInspectionOverdue(7)).toBe(true);
        });

        it('should return false when days within threshold', () => {
            const condition = SiteCondition.create({ ...validProps, daysSinceLastInspection: 5 });
            expect(condition.isInspectionOverdue(7)).toBe(false);
        });

        it('should use default threshold of 7 days', () => {
            const condition = SiteCondition.create({ ...validProps, daysSinceLastInspection: 8 });
            expect(condition.isInspectionOverdue()).toBe(true);
        });

        it('should return false when exactly at threshold', () => {
            const condition = SiteCondition.create({ ...validProps, daysSinceLastInspection: 7 });
            expect(condition.isInspectionOverdue(7)).toBe(false);
        });
    });

    describe('getPoorConditionBMPCount', () => {
        it('should return 0 when no BMPs', () => {
            const condition = SiteCondition.create(validProps);
            expect(condition.getPoorConditionBMPCount()).toBe(0);
        });

        it('should count only poor condition BMPs', () => {
            const condition = SiteCondition.create({
                ...validProps,
                bmpInventory: [
                    { type: 'silt_fence', count: 10, lastInspectionDate: new Date(), conditionRating: 'good' },
                    { type: 'inlet_protection', count: 5, lastInspectionDate: new Date(), conditionRating: 'poor' },
                    { type: 'stabilization_mat', count: 3, lastInspectionDate: new Date(), conditionRating: 'fair' },
                    { type: 'check_dam', count: 2, lastInspectionDate: new Date(), conditionRating: 'poor' },
                ],
            });
            expect(condition.getPoorConditionBMPCount()).toBe(2);
        });

        it('should return 0 when all BMPs in good condition', () => {
            const condition = SiteCondition.create({
                ...validProps,
                bmpInventory: [
                    { type: 'silt_fence', count: 10, lastInspectionDate: new Date(), conditionRating: 'good' },
                    { type: 'inlet_protection', count: 5, lastInspectionDate: new Date(), conditionRating: 'good' },
                ],
            });
            expect(condition.getPoorConditionBMPCount()).toBe(0);
        });
    });
});
