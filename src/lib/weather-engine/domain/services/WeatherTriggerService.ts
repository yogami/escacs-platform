/**
 * WeatherTriggerService - Domain Service
 * 
 * Core logic for weather-triggered compliance automation.
 * Refactored for CC ≤3 per function (Gold Standards compliance).
 */

import type { RainfallEvent } from '../entities/RainfallEvent';
import { WeatherAlert } from '../entities/WeatherAlert';
import type { AlertPriority } from '../entities/WeatherAlert';
import { InspectionWindow } from '../entities/InspectionWindow';
import type { IWeatherDataPort } from '../../ports/IWeatherDataPort';

export interface SitePermit {
    siteId: string;
    thresholdInchesPerHour: number;
    jurisdictionInspectionHours: 24 | 48 | 72;
    superintendentPhone: string;
    inspectorEmails: string[];
    ownerEmail: string;
}

export interface TriggerEvaluation {
    shouldAlert: boolean;
    alerts: WeatherAlert[];
    inspectionWindow?: InspectionWindow;
    triggerReason?: string;
}

// Priority lookup table for CC reduction
const PRIORITY_THRESHOLDS: Array<{
    intensityMin: number;
    hoursMax: number;
    priority: AlertPriority;
}> = [
        { intensityMin: 1.0, hoursMax: Infinity, priority: 'critical' },
        { intensityMin: 0, hoursMax: 2, priority: 'critical' },
        { intensityMin: 0.5, hoursMax: Infinity, priority: 'high' },
        { intensityMin: 0, hoursMax: 4, priority: 'high' },
        { intensityMin: 0, hoursMax: 12, priority: 'medium' },
    ];

export class WeatherTriggerService {
    private readonly weatherDataPort: IWeatherDataPort;

    constructor(weatherDataPort: IWeatherDataPort) {
        this.weatherDataPort = weatherDataPort;
    }

    /**
     * Evaluate weather conditions against site permit thresholds
     */
    async evaluateTriggers(
        permit: SitePermit,
        latitude: number,
        longitude: number
    ): Promise<TriggerEvaluation> {
        const forecast = await this.weatherDataPort.getHourlyForecast(
            latitude,
            longitude,
            72
        );

        const exceedingForecasts = forecast.forecasts.filter(
            f => f.precipitationInchesPerHour > permit.thresholdInchesPerHour
        );

        if (exceedingForecasts.length === 0) {
            return { shouldAlert: false, alerts: [] };
        }

        return this.buildTriggerEvaluation(permit, exceedingForecasts);
    }

    /**
     * Build evaluation result from exceeding forecasts
     */
    private buildTriggerEvaluation(
        permit: SitePermit,
        exceedingForecasts: Array<{ timestamp: Date; precipitationInchesPerHour: number }>
    ): TriggerEvaluation {
        const firstExceeding = exceedingForecasts[0];
        const maxIntensity = Math.max(...exceedingForecasts.map(f => f.precipitationInchesPerHour));
        const hoursAhead = this.getHoursUntil(firstExceeding.timestamp);

        const priority = this.determinePriority(maxIntensity, hoursAhead);
        const alerts = this.createAlerts(permit, priority, maxIntensity, hoursAhead);

        return {
            shouldAlert: true,
            alerts,
            triggerReason: `Rain forecast: ${maxIntensity.toFixed(2)} in/hr in ${hoursAhead}h`,
        };
    }

    /**
     * Calculate post-storm inspection window
     */
    calculateInspectionWindow(
        rainfallEvent: RainfallEvent,
        permit: SitePermit
    ): InspectionWindow {
        if (!rainfallEvent.endTime) {
            throw new Error('Cannot calculate inspection window for ongoing event');
        }

        return InspectionWindow.create({
            id: crypto.randomUUID(),
            siteId: permit.siteId,
            rainfallEventId: rainfallEvent.id,
            jurisdictionHours: permit.jurisdictionInspectionHours,
            stormEndTime: rainfallEvent.endTime,
        });
    }

    /**
     * Determine alert priority using lookup table (CC = 2)
     */
    determinePriority(intensityInchesPerHour: number, hoursAhead: number): AlertPriority {
        for (const threshold of PRIORITY_THRESHOLDS) {
            if (intensityInchesPerHour > threshold.intensityMin && hoursAhead <= threshold.hoursMax) {
                return threshold.priority;
            }
        }
        return 'low';
    }

    /**
     * Create multi-channel alerts for permit contacts
     */
    private createAlerts(
        permit: SitePermit,
        priority: AlertPriority,
        intensity: number,
        hoursAhead: number
    ): WeatherAlert[] {
        const eventId = crypto.randomUUID();
        const message = `Rain alert: Deploy controls. ${intensity.toFixed(2)} in/hr expected in ${hoursAhead}h`;
        const now = new Date();

        return [
            this.createSmsAlert(permit, priority, message, eventId, now),
            ...this.createPushAlerts(permit, priority, message, eventId, now),
            this.createEmailAlert(permit, priority, message, eventId, now),
        ];
    }

    /**
     * Create SMS alert for superintendent
     */
    private createSmsAlert(
        permit: SitePermit,
        priority: AlertPriority,
        message: string,
        eventId: string,
        createdAt: Date
    ): WeatherAlert {
        return WeatherAlert.create({
            id: crypto.randomUUID(),
            siteId: permit.siteId,
            channel: 'sms',
            recipient: permit.superintendentPhone,
            recipientType: 'superintendent',
            message,
            priority,
            triggerEventId: eventId,
            createdAt,
        });
    }

    /**
     * Create push alerts for inspectors
     */
    private createPushAlerts(
        permit: SitePermit,
        priority: AlertPriority,
        message: string,
        eventId: string,
        createdAt: Date
    ): WeatherAlert[] {
        return permit.inspectorEmails.map(email =>
            WeatherAlert.create({
                id: crypto.randomUUID(),
                siteId: permit.siteId,
                channel: 'push',
                recipient: email,
                recipientType: 'inspector',
                message,
                priority,
                triggerEventId: eventId,
                createdAt,
            })
        );
    }

    /**
     * Create email alert for owner
     */
    private createEmailAlert(
        permit: SitePermit,
        priority: AlertPriority,
        message: string,
        eventId: string,
        createdAt: Date
    ): WeatherAlert {
        return WeatherAlert.create({
            id: crypto.randomUUID(),
            siteId: permit.siteId,
            channel: 'email',
            recipient: permit.ownerEmail,
            recipientType: 'owner',
            message,
            priority,
            triggerEventId: eventId,
            createdAt,
        });
    }

    private getHoursUntil(targetTime: Date): number {
        const now = new Date();
        return Math.max(0, (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    }
}
