/**
 * WeatherAlert Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { WeatherAlert } from '../../../src/lib/weather-engine/domain/entities/WeatherAlert';

describe('WeatherAlert', () => {
    const validProps = {
        id: 'alert-001',
        siteId: 'site-001',
        channel: 'sms' as const,
        recipient: '+15551234567',
        recipientType: 'superintendent' as const,
        message: 'Test alert message',
        priority: 'high' as const,
        triggerEventId: 'event-001',
        createdAt: new Date(),
    };

    describe('create', () => {
        it('should create a valid alert', () => {
            const alert = WeatherAlert.create(validProps);

            expect(alert.id).toBe(validProps.id);
            expect(alert.siteId).toBe(validProps.siteId);
            expect(alert.channel).toBe(validProps.channel);
            expect(alert.recipient).toBe(validProps.recipient);
        });

        it('should accept sms channel', () => {
            const alert = WeatherAlert.create({ ...validProps, channel: 'sms' });
            expect(alert.channel).toBe('sms');
        });

        it('should accept email channel', () => {
            const alert = WeatherAlert.create({ ...validProps, channel: 'email' });
            expect(alert.channel).toBe('email');
        });

        it('should accept push channel', () => {
            const alert = WeatherAlert.create({ ...validProps, channel: 'push' });
            expect(alert.channel).toBe('push');
        });

        it('should accept low priority', () => {
            const alert = WeatherAlert.create({ ...validProps, priority: 'low' });
            expect(alert.priority).toBe('low');
        });

        it('should accept medium priority', () => {
            const alert = WeatherAlert.create({ ...validProps, priority: 'medium' });
            expect(alert.priority).toBe('medium');
        });

        it('should accept high priority', () => {
            const alert = WeatherAlert.create({ ...validProps, priority: 'high' });
            expect(alert.priority).toBe('high');
        });

        it('should accept critical priority', () => {
            const alert = WeatherAlert.create({ ...validProps, priority: 'critical' });
            expect(alert.priority).toBe('critical');
        });

        it('should store recipient type', () => {
            const alert = WeatherAlert.create({ ...validProps, recipientType: 'inspector' });
            expect(alert.recipientType).toBe('inspector');
        });

        it('should store trigger event id', () => {
            const alert = WeatherAlert.create(validProps);
            expect(alert.triggerEventId).toBe(validProps.triggerEventId);
        });
    });
});
