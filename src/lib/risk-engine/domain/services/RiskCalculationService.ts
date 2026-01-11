/**
 * RiskCalculationService - Domain Service
 * 
 * Calculates violation risk scores from multiple factors.
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
        const { factors, totalScore } = this.calculateFactors(input, horizonHours);
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

    private calculateFactors(
        input: RiskCalculationInput,
        horizonHours: 24 | 48 | 72
    ): { factors: RiskFactor[]; totalScore: number } {
        const factors: RiskFactor[] = [];
        let totalScore = 0;

        // Slope factor (0-20 points)
        const slopeScore = Math.min(20, input.siteCondition.slopePercent * 1.5);
        if (slopeScore > 10) {
            factors.push({
                name: 'steep_slope',
                contribution: slopeScore,
                description: `Slope of ${input.siteCondition.slopePercent}% increases erosion risk`,
            });
        }
        totalScore += slopeScore;

        // Soil erodibility (0-15 points)
        if (input.siteCondition.hasErodibleSoil()) {
            factors.push({
                name: 'erodible_soil',
                contribution: 15,
                description: 'Sandy soil is highly susceptible to erosion',
            });
            totalScore += 15;
        }

        // Construction phase (0-15 points)
        if (input.siteCondition.isHighRiskPhase()) {
            factors.push({
                name: 'high_risk_phase',
                contribution: 15,
                description: `${input.siteCondition.phase} phase has increased disturbance`,
            });
            totalScore += 15;
        }

        // Inspection recency (0-15 points)
        const inspectionScore = Math.min(15, input.siteCondition.daysSinceLastInspection * 2);
        if (inspectionScore > 7) {
            factors.push({
                name: 'inspection_overdue',
                contribution: inspectionScore,
                description: `${input.siteCondition.daysSinceLastInspection} days since last inspection`,
            });
        }
        totalScore += inspectionScore;

        // Weather forecast (0-30 points)
        const precipitation = this.getPrecipitationForHorizon(input.weather, horizonHours);
        const weatherScore = Math.min(30, precipitation * 25);
        if (weatherScore > 10) {
            factors.push({
                name: precipitation > 1.0 ? 'heavy_rain_forecast' : 'rain_forecast',
                contribution: weatherScore,
                description: `${precipitation.toFixed(2)}" precipitation forecast`,
            });
        }
        totalScore += weatherScore;

        // Historical violations (0-15 points)
        if (input.siteCondition.historicalNOVCount > 0) {
            const novScore = Math.min(15, input.siteCondition.historicalNOVCount * 5);
            factors.push({
                name: 'historical_violations',
                contribution: novScore,
                description: `${input.siteCondition.historicalNOVCount} NOVs in past 12 months`,
            });
            totalScore += novScore;
        }

        return { factors, totalScore };
    }

    private getPrecipitationForHorizon(
        weather: WeatherInput,
        horizonHours: 24 | 48 | 72
    ): number {
        switch (horizonHours) {
            case 24: return weather.precipitationInchesNext24h;
            case 48: return weather.precipitationInchesNext48h;
            case 72: return weather.precipitationInchesNext72h;
        }
    }

    private generateActions(
        input: RiskCalculationInput,
        factors: RiskFactor[]
    ): PreventiveAction[] {
        const actions: PreventiveAction[] = [];
        let priority = 1;

        // Weather-based actions
        if (factors.some(f => f.name.includes('rain'))) {
            actions.push({
                action: 'Deploy additional inlet protection',
                priority: priority++,
                estimatedTimeHours: 2,
            });
        }

        // Phase-based actions
        if (input.siteCondition.isHighRiskPhase()) {
            actions.push({
                action: 'Reinforce silt fence perimeter',
                priority: priority++,
                estimatedTimeHours: 4,
            });
        }

        // Inspection actions
        if (factors.some(f => f.name === 'inspection_overdue')) {
            actions.push({
                action: 'Schedule immediate inspection',
                priority: priority++,
                estimatedTimeHours: 1,
            });
        }

        // Default action
        if (actions.length < 3) {
            actions.push({
                action: 'Review BMP maintenance schedule',
                priority: priority++,
                estimatedTimeHours: 0.5,
            });
        }

        return actions.slice(0, 3); // Return top 3
    }
}
