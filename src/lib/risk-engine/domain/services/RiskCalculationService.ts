/**
 * RiskCalculationService - Domain Service
 * 
 * Calculates violation risk scores from multiple factors.
 * Refactored for CC ≤3 per function (Gold Standards compliance).
 */

import { RiskScore } from '../entities/RiskScore';
import type { PreventiveAction, RiskFactor } from '../entities/RiskScore';
import { SiteCondition } from '../entities/SiteCondition';

export interface WeatherInput {
    precipitationInchesNext24h: number;
    precipitationInchesNext48h: number;
    precipitationInchesNext72h: number;
}

export interface RiskCalculationInput {
    siteCondition: SiteCondition;
    weather: WeatherInput;
}

export class RiskCalculationService {
    /**
     * Calculate risk score for a site
     */
    calculateRisk(
        input: RiskCalculationInput,
        horizonHours: 24 | 48 | 72 = 48
    ): RiskScore {
        const { factors, totalScore } = this.collectFactors(input, horizonHours);
        const actions = this.generateActions(input, factors);

        return RiskScore.create({
            id: crypto.randomUUID(),
            siteId: input.siteCondition.siteId,
            score: Math.min(100, totalScore),
            factors,
            actions,
            horizonHours,
            calculatedAt: new Date(),
        });
    }

    /**
     * Calculate multi-horizon forecast
     */
    calculateForecast(input: RiskCalculationInput): RiskScore[] {
        return [24, 48, 72].map(h =>
            this.calculateRisk(input, h as 24 | 48 | 72)
        );
    }

    /**
     * Collect all contributing risk factors and calculate base scores
     */
    private collectFactors(
        input: RiskCalculationInput,
        horizonHours: 24 | 48 | 72
    ): { factors: RiskFactor[]; totalScore: number } {
        const factors: RiskFactor[] = [];
        let totalScore = 0;

        // Slope always contributes to score
        const slopeScore = Math.min(20, input.siteCondition.slopePercent * 1.5);
        totalScore += slopeScore;
        const slopeFactor = this.calculateSlopeFactor(input.siteCondition, slopeScore);
        if (slopeFactor) factors.push(slopeFactor);

        // Soil erodibility
        const soilFactor = this.calculateSoilFactor(input.siteCondition);
        if (soilFactor) {
            factors.push(soilFactor);
            totalScore += soilFactor.contribution;
        }

        // Construction phase
        const phaseFactor = this.calculatePhaseFactor(input.siteCondition);
        if (phaseFactor) {
            factors.push(phaseFactor);
            totalScore += phaseFactor.contribution;
        }

        // Inspection recency always contributes
        const inspectionScore = Math.min(15, input.siteCondition.daysSinceLastInspection * 2);
        totalScore += inspectionScore;
        const inspectionFactor = this.calculateInspectionFactor(input.siteCondition, inspectionScore);
        if (inspectionFactor) factors.push(inspectionFactor);

        // Weather forecast always contributes
        const precipitation = this.getPrecipitationForHorizon(input.weather, horizonHours);
        const weatherScore = Math.min(30, precipitation * 25);
        totalScore += weatherScore;
        const weatherFactor = this.calculateWeatherFactor(precipitation, weatherScore);
        if (weatherFactor) factors.push(weatherFactor);

        // Historical violations
        const violationFactor = this.calculateViolationFactor(input.siteCondition);
        if (violationFactor) {
            factors.push(violationFactor);
            totalScore += violationFactor.contribution;
        }

        return { factors, totalScore };
    }

    /**
     * Slope factor: Only creates factor if score > 10
     */
    private calculateSlopeFactor(site: SiteCondition, score: number): RiskFactor | null {
        if (score <= 10) return null;

        return {
            name: 'steep_slope',
            contribution: score,
            description: `Slope of ${site.slopePercent}% increases erosion risk`,
        };
    }

    /**
     * Soil erodibility factor: 15 points for sandy soil
     */
    private calculateSoilFactor(site: SiteCondition): RiskFactor | null {
        if (!site.hasErodibleSoil()) return null;

        return {
            name: 'erodible_soil',
            contribution: 15,
            description: 'Sandy soil is highly susceptible to erosion',
        };
    }

    /**
     * Construction phase factor: 15 points for high-risk phases
     */
    private calculatePhaseFactor(site: SiteCondition): RiskFactor | null {
        if (!site.isHighRiskPhase()) return null;

        return {
            name: 'high_risk_phase',
            contribution: 15,
            description: `${site.phase} phase has increased disturbance`,
        };
    }

    /**
     * Inspection recency factor: Only creates factor if score > 7
     */
    private calculateInspectionFactor(site: SiteCondition, score: number): RiskFactor | null {
        if (score <= 7) return null;

        return {
            name: 'inspection_overdue',
            contribution: score,
            description: `${site.daysSinceLastInspection} days since last inspection`,
        };
    }

    /**
     * Weather forecast factor: Only creates factor if score > 10
     */
    private calculateWeatherFactor(
        precipitation: number,
        score: number
    ): RiskFactor | null {
        if (score <= 10) return null;

        const name = precipitation > 1.0 ? 'heavy_rain_forecast' : 'rain_forecast';
        return {
            name,
            contribution: score,
            description: `${precipitation.toFixed(2)}" precipitation forecast`,
        };
    }

    /**
     * Historical violations factor: 0-15 points based on NOV count
     */
    private calculateViolationFactor(site: SiteCondition): RiskFactor | null {
        if (site.historicalNOVCount === 0) return null;

        const score = Math.min(15, site.historicalNOVCount * 5);
        return {
            name: 'historical_violations',
            contribution: score,
            description: `${site.historicalNOVCount} NOVs in past 12 months`,
        };
    }

    /**
     * Get precipitation for specific time horizon
     */
    private getPrecipitationForHorizon(
        weather: WeatherInput,
        horizonHours: 24 | 48 | 72
    ): number {
        const precipMap: Record<24 | 48 | 72, number> = {
            24: weather.precipitationInchesNext24h,
            48: weather.precipitationInchesNext48h,
            72: weather.precipitationInchesNext72h,
        };
        return precipMap[horizonHours];
    }

    /**
     * Generate preventive actions based on risk factors
     */
    private generateActions(
        input: RiskCalculationInput,
        factors: RiskFactor[]
    ): PreventiveAction[] {
        const actions: PreventiveAction[] = [];
        let priority = 1;

        if (this.hasRainFactor(factors)) {
            actions.push(this.createAction('Deploy additional inlet protection', priority++, 2));
        }

        if (input.siteCondition.isHighRiskPhase()) {
            actions.push(this.createAction('Reinforce silt fence perimeter', priority++, 4));
        }

        if (this.hasInspectionFactor(factors)) {
            actions.push(this.createAction('Schedule immediate inspection', priority++, 1));
        }

        return this.ensureMinimumActions(actions, priority);
    }

    private hasRainFactor(factors: RiskFactor[]): boolean {
        return factors.some(f => f.name.includes('rain'));
    }

    private hasInspectionFactor(factors: RiskFactor[]): boolean {
        return factors.some(f => f.name === 'inspection_overdue');
    }

    private createAction(action: string, priority: number, hours: number): PreventiveAction {
        return { action, priority, estimatedTimeHours: hours };
    }

    /**
     * Ensure at least 3 actions are returned
     */
    private ensureMinimumActions(
        actions: PreventiveAction[],
        startPriority: number
    ): PreventiveAction[] {
        let priority = startPriority;
        const result = [...actions];

        if (result.length < 3) {
            result.push(this.createAction('Review BMP maintenance schedule', priority++, 0.5));
        }
        if (result.length < 3) {
            result.push(this.createAction('Inspect perimeter for secondary disturbance', priority++, 1));
        }

        return result.slice(0, 3);
    }
}
