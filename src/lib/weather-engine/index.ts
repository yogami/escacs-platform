/**
 * Weather Engine Module
 * 
 * Domain-agnostic library for weather-triggered compliance automation:
 * - Rainfall threshold detection
 * - Multi-channel alert generation
 * - Post-storm inspection window calculation
 * 
 * @example
 * ```typescript
 * import { WeatherTriggerService, MockNoaaAdapter } from '@/lib/weather-engine';
 * 
 * const adapter = new MockNoaaAdapter();
 * const service = new WeatherTriggerService(adapter);
 * 
 * const result = await service.evaluateTriggers(permit, 37.54, -77.43);
 * if (result.shouldAlert) {
 *   console.log('Alerts to send:', result.alerts);
 * }
 * ```
 */

// Domain Layer - Entities
export { RainfallEvent } from './domain/entities/RainfallEvent';
export type { RainfallEventProps } from './domain/entities/RainfallEvent';

export { WeatherAlert } from './domain/entities/WeatherAlert';
export type {
    WeatherAlertProps,
    AlertChannel,
    AlertPriority,
    AlertStatus
} from './domain/entities/WeatherAlert';

export { InspectionWindow } from './domain/entities/InspectionWindow';
export type { InspectionWindowProps } from './domain/entities/InspectionWindow';

// Domain Layer - Services
export { WeatherTriggerService } from './domain/services/WeatherTriggerService';
export type {
    SitePermit,
    TriggerEvaluation
} from './domain/services/WeatherTriggerService';

// Ports
export type {
    IWeatherDataPort,
    WeatherForecast,
    HourlyForecast
} from './ports/IWeatherDataPort';

export type {
    IAlertChannelPort,
    AlertDeliveryResult
} from './ports/IAlertChannelPort';

// Infrastructure - Adapters
export { MockNoaaAdapter } from './infrastructure/MockNoaaAdapter';

// ============================================================================
// Factory Functions
// ============================================================================

import { WeatherTriggerService } from './domain/services/WeatherTriggerService';
import { MockNoaaAdapter } from './infrastructure/MockNoaaAdapter';

/**
 * Create a weather trigger service with mock adapter
 */
export function createWeatherTriggerService(): WeatherTriggerService {
    const adapter = new MockNoaaAdapter();
    return new WeatherTriggerService(adapter);
}
