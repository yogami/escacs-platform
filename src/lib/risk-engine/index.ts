/**
 * Risk Engine Module
 * 
 * Violation risk scoring for construction sites:
 * - Multi-factor risk analysis
 * - Weather-integrated forecasting
 * - Actionable recommendations
 * 
 * @example
 * ```typescript
 * import { RiskCalculationService, SiteCondition } from '@/lib/risk-engine';
 * 
 * const service = new RiskCalculationService();
 * 
 * const siteCondition = SiteCondition.create({
 *   siteId: 'site-001',
 *   phase: 'grading',
 *   slopePercent: 15,
 *   soilType: 'sandy',
 *   // ...
 * });
 * 
 * const riskScore = service.calculateRisk({
 *   siteCondition,
 *   weather: { precipitationInchesNext24h: 1.2, ... }
 * });
 * 
 * console.log('Risk level:', riskScore.level);
 * console.log('Top actions:', riskScore.getTopActions());
 * ```
 */

// Domain Layer - Entities
export { RiskScore } from './domain/entities/RiskScore';
export type {
    RiskScoreProps,
    RiskLevel,
    PreventiveAction,
    RiskFactor
} from './domain/entities/RiskScore';

export { SiteCondition } from './domain/entities/SiteCondition';
export type {
    SiteConditionProps,
    ConstructionPhase,
    SoilType,
    BMPInventoryItem
} from './domain/entities/SiteCondition';

// Domain Layer - Services
export { RiskCalculationService } from './domain/services/RiskCalculationService';
export type {
    WeatherInput,
    RiskCalculationInput
} from './domain/services/RiskCalculationService';

// ============================================================================
// Factory Functions
// ============================================================================

import { RiskCalculationService } from './domain/services/RiskCalculationService';

/**
 * Create a risk calculation service
 */
export function createRiskCalculationService(): RiskCalculationService {
    return new RiskCalculationService();
}
