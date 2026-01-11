/**
 * Unit tests for RiskCalculationService
 */

import { describe, it, expect } from 'vitest';
import {
    RiskCalculationService,
    SiteCondition,
    type WeatherInput
} from '@/lib/risk-engine';

describe('RiskCalculationService', () => {
    const service = new RiskCalculationService();

    const createSiteCondition = (overrides = {}) => SiteCondition.create({
        siteId: 'site-001',
        phase: 'grading',
        slopePercent: 10,
        soilType: 'clay',
        acreage: 5,
        daysSinceLastInspection: 2,
        bmpInventory: [],
        historicalNOVCount: 0,
        observedAt: new Date(),
        ...overrides,
    });

    const createWeather = (overrides: Partial<WeatherInput> = {}): WeatherInput => ({
        precipitationInchesNext24h: 0,
        precipitationInchesNext48h: 0,
        precipitationInchesNext72h: 0,
        ...overrides,
    });

    describe('calculateRisk', () => {
        it('should return low risk for favorable conditions', () => {
            const siteCondition = createSiteCondition({
                slopePercent: 2,
                phase: 'paving',
                daysSinceLastInspection: 0,
            });
            const weather = createWeather();

            const result = service.calculateRisk({ siteCondition, weather });

            expect(result.level).toBe('low');
            expect(result.score).toBeLessThan(30);
        });

        it('should return high risk for steep slope with heavy rain', () => {
            const siteCondition = createSiteCondition({
                slopePercent: 15,
                soilType: 'sandy',
            });
            const weather = createWeather({
                precipitationInchesNext48h: 1.2,
            });

            const result = service.calculateRisk({ siteCondition, weather });

            expect(['high', 'critical']).toContain(result.level);
            expect(result.score).toBeGreaterThan(60);
        });

        it('should increase score for historical violations', () => {
            const siteCondition = createSiteCondition({ historicalNOVCount: 3 });
            const weather = createWeather();

            const result = service.calculateRisk({ siteCondition, weather });

            expect(result.factors).toContainEqual(
                expect.objectContaining({ name: 'historical_violations' })
            );
        });

        it('should return exactly 3 preventive actions', () => {
            const siteCondition = createSiteCondition();
            const weather = createWeather({ precipitationInchesNext48h: 0.5 });

            const result = service.calculateRisk({ siteCondition, weather });

            expect(result.actions).toHaveLength(3);
            expect(result.actions[0].priority).toBe(1);
        });
    });

    describe('calculateForecast', () => {
        it('should return scores for 24, 48, and 72 hour horizons', () => {
            const siteCondition = createSiteCondition();
            const weather = createWeather();

            const forecasts = service.calculateForecast({ siteCondition, weather });

            expect(forecasts).toHaveLength(3);
            expect(forecasts.map(f => f.horizonHours)).toEqual([24, 48, 72]);
        });
    });
});
