/**
 * RiskScore Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { RiskScore } from '../../../src/lib/risk-engine/domain/entities/RiskScore';

describe('RiskScore', () => {
    const validProps = {
        id: 'risk-001',
        siteId: 'site-001',
        score: 65,
        factors: [
            { name: 'steep_slope', contribution: 20, description: 'High slope' },
            { name: 'rain_forecast', contribution: 25, description: 'Rain expected' },
        ],
        actions: [
            { action: 'Deploy inlet protection', priority: 1, estimatedTimeHours: 2 },
            { action: 'Reinforce perimeter', priority: 2, estimatedTimeHours: 4 },
            { action: 'Schedule inspection', priority: 3, estimatedTimeHours: 1 },
        ],
        horizonHours: 48 as const,
        calculatedAt: new Date(),
    };

    describe('create', () => {
        it('should create a valid risk score', () => {
            const riskScore = RiskScore.create(validProps);

            expect(riskScore.id).toBe(validProps.id);
            expect(riskScore.siteId).toBe(validProps.siteId);
            expect(riskScore.score).toBe(validProps.score);
        });

        it('should automatically determine level from score', () => {
            const riskScore = RiskScore.create(validProps);
            expect(riskScore.level).toBe('high'); // 65 = high
        });

        it('should calculate expiration time', () => {
            const riskScore = RiskScore.create(validProps);
            expect(riskScore.expiresAt).toBeInstanceOf(Date);
            expect(riskScore.expiresAt.getTime()).toBeGreaterThan(riskScore.calculatedAt.getTime());
        });

        it('should reject score below 0', () => {
            expect(() => RiskScore.create({ ...validProps, score: -5 })).toThrow();
        });

        it('should reject score above 100', () => {
            expect(() => RiskScore.create({ ...validProps, score: 105 })).toThrow();
        });
    });

    describe('determineLevel', () => {
        it('should return critical for score >= 90', () => {
            expect(RiskScore.determineLevel(95)).toBe('critical');
            expect(RiskScore.determineLevel(90)).toBe('critical');
        });

        it('should return high for score >= 60', () => {
            expect(RiskScore.determineLevel(75)).toBe('high');
            expect(RiskScore.determineLevel(60)).toBe('high');
        });

        it('should return moderate for score >= 30', () => {
            expect(RiskScore.determineLevel(45)).toBe('moderate');
            expect(RiskScore.determineLevel(30)).toBe('moderate');
        });

        it('should return low for score < 30', () => {
            expect(RiskScore.determineLevel(25)).toBe('low');
            expect(RiskScore.determineLevel(0)).toBe('low');
        });

        it('should handle boundary conditions', () => {
            expect(RiskScore.determineLevel(89)).toBe('high');
            expect(RiskScore.determineLevel(59)).toBe('moderate');
            expect(RiskScore.determineLevel(29)).toBe('low');
        });
    });

    describe('isExpired', () => {
        it('should return false for fresh score', () => {
            const riskScore = RiskScore.create(validProps);
            expect(riskScore.isExpired()).toBe(false);
        });
    });

    describe('getTopActions', () => {
        it('should return top 3 actions by default', () => {
            const riskScore = RiskScore.create(validProps);
            const topActions = riskScore.getTopActions();

            expect(topActions).toHaveLength(3);
            expect(topActions[0].priority).toBe(1);
        });

        it('should return specified number of actions', () => {
            const riskScore = RiskScore.create(validProps);
            const topActions = riskScore.getTopActions(2);

            expect(topActions).toHaveLength(2);
        });

        it('should sort by priority', () => {
            const riskScore = RiskScore.create(validProps);
            const topActions = riskScore.getTopActions();

            expect(topActions[0].priority).toBeLessThan(topActions[1].priority);
        });
    });

    describe('requiresImmediateAction', () => {
        it('should return true for critical level', () => {
            const riskScore = RiskScore.create({ ...validProps, score: 95 });
            expect(riskScore.requiresImmediateAction()).toBe(true);
        });

        it('should return true for high level', () => {
            const riskScore = RiskScore.create({ ...validProps, score: 70 });
            expect(riskScore.requiresImmediateAction()).toBe(true);
        });

        it('should return false for moderate level', () => {
            const riskScore = RiskScore.create({ ...validProps, score: 45 });
            expect(riskScore.requiresImmediateAction()).toBe(false);
        });

        it('should return false for low level', () => {
            const riskScore = RiskScore.create({ ...validProps, score: 20 });
            expect(riskScore.requiresImmediateAction()).toBe(false);
        });
    });
});
