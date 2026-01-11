/**
 * WeatherTriggerService - Domain Service
 * 
 * Core logic for weather-triggered compliance automation.
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
            72 // 72-hour forecast
        );

        const exceedingForecasts = forecast.forecasts.filter(
            f => f.precipitationInchesPerHour > permit.thresholdInchesPerHour
        );

        if (exceedingForecasts.length === 0) {
            return { shouldAlert: false, alerts: [] };
        }

        const firstExceeding = exceedingForecasts[0];
        const maxIntensity = Math.max(
            ...exceedingForecasts.map(f => f.precipitationInchesPerHour)
        );
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
     * Determine alert priority based on intensity and timing
     */
    private determinePriority(
        intensityInchesPerHour: number,
        hoursAhead: number
    ): AlertPriority {
        if (intensityInchesPerHour > 1.0 || hoursAhead <= 2) {
            return 'critical';
        }
        if (intensityInchesPerHour > 0.5 || hoursAhead <= 4) {
            return 'high';
        }
        if (hoursAhead <= 12) {
            return 'medium';
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
        const alerts: WeatherAlert[] = [];

        // SMS to superintendent
        alerts.push(
            WeatherAlert.create({
                id: crypto.randomUUID(),
                siteId: permit.siteId,
                channel: 'sms',
                recipient: permit.superintendentPhone,
                recipientType: 'superintendent',
                message,
                priority,
                triggerEventId: eventId,
                createdAt: now,
            })
        );

        // Push to inspectors
        for (const email of permit.inspectorEmails) {
            alerts.push(
                WeatherAlert.create({
                    id: crypto.randomUUID(),
                    siteId: permit.siteId,
                    channel: 'push',
                    recipient: email,
                    recipientType: 'inspector',
                    message,
                    priority,
                    triggerEventId: eventId,
                    createdAt: now,
                })
            );
        }

        // Email to owner
        alerts.push(
            WeatherAlert.create({
                id: crypto.randomUUID(),
                siteId: permit.siteId,
                channel: 'email',
                recipient: permit.ownerEmail,
                recipientType: 'owner',
                message,
                priority,
                triggerEventId: eventId,
                createdAt: now,
            })
        );

        return alerts;
    }

    private getHoursUntil(targetTime: Date): number {
        const now = new Date();
        return Math.max(0, (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    }
}
