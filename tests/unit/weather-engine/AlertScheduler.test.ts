/**
 * AlertScheduler Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { AlertScheduler } from '../../../src/lib/weather-engine/domain/services/AlertScheduler';
import { WeatherAlert } from '../../../src/lib/weather-engine/domain/entities/WeatherAlert';

describe('AlertScheduler', () => {
    const createAlert = (priority: 'low' | 'medium' | 'high' | 'critical') => {
        return WeatherAlert.create({
            id: crypto.randomUUID(),
            siteId: 'site-001',
            channel: 'sms',
            recipient: '+15551234567',
            recipientType: 'superintendent',
            message: 'Test alert',
            priority,
            triggerEventId: 'event-001',
            createdAt: new Date(),
        });
    };

    describe('getHighPriorityAlerts', () => {
        it('should filter high priority alerts', () => {
            const scheduler = new AlertScheduler([]);
            const alerts = [
                createAlert('low'),
                createAlert('high'),
                createAlert('medium'),
            ];

            const result = scheduler.getHighPriorityAlerts(alerts);

            expect(result).toHaveLength(1);
            expect(result[0].priority).toBe('high');
        });

        it('should filter critical priority alerts', () => {
            const scheduler = new AlertScheduler([]);
            const alerts = [
                createAlert('low'),
                createAlert('critical'),
                createAlert('medium'),
            ];

            const result = scheduler.getHighPriorityAlerts(alerts);

            expect(result).toHaveLength(1);
            expect(result[0].priority).toBe('critical');
        });

        it('should return both high and critical alerts', () => {
            const scheduler = new AlertScheduler([]);
            const alerts = [
                createAlert('low'),
                createAlert('high'),
                createAlert('critical'),
                createAlert('medium'),
            ];

            const result = scheduler.getHighPriorityAlerts(alerts);

            expect(result).toHaveLength(2);
        });

        it('should return empty array when no high priority alerts', () => {
            const scheduler = new AlertScheduler([]);
            const alerts = [
                createAlert('low'),
                createAlert('medium'),
            ];

            const result = scheduler.getHighPriorityAlerts(alerts);

            expect(result).toHaveLength(0);
        });

        it('should handle empty alert array', () => {
            const scheduler = new AlertScheduler([]);
            const result = scheduler.getHighPriorityAlerts([]);

            expect(result).toHaveLength(0);
        });
    });
});
