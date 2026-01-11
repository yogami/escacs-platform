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
        });

        it('should default status to pending', () => {
            const alert = WeatherAlert.create(validProps);
            expect(alert.status).toBe('pending');
        });

        it('should throw on missing recipient', () => {
            expect(() => WeatherAlert.create({ ...validProps, recipient: '' })).toThrow();
        });

        it('should throw on missing message', () => {
            expect(() => WeatherAlert.create({ ...validProps, message: '' })).toThrow();
        });
    });

    describe('isPending', () => {
        it('should return true when status is pending', () => {
            const alert = WeatherAlert.create(validProps);
            expect(alert.isPending()).toBe(true);
        });

        it('should return false after markSent', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markSent();
            expect(alert.isPending()).toBe(false);
        });
    });

    describe('markSent', () => {
        it('should update status to sent', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markSent();
            expect(alert.status).toBe('sent');
        });

        it('should set sentAt timestamp', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markSent();
            expect(alert.sentAt).toBeInstanceOf(Date);
        });
    });

    describe('markDelivered', () => {
        it('should update status to delivered', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markDelivered();
            expect(alert.status).toBe('delivered');
        });

        it('should set deliveredAt timestamp', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markDelivered();
            expect(alert.deliveredAt).toBeInstanceOf(Date);
        });
    });

    describe('markFailed', () => {
        it('should update status to failed', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markFailed();
            expect(alert.status).toBe('failed');
        });

        it('should store failure reason when provided', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markFailed('Network timeout');
            expect(alert.failureReason).toBe('Network timeout');
        });

        it('should have null failure reason when not provided', () => {
            const alert = WeatherAlert.create(validProps);
            alert.markFailed();
            expect(alert.failureReason).toBeNull();
        });
    });

    describe('channels and priorities', () => {
        it('should accept all channels', () => {
            for (const channel of ['sms', 'email', 'push'] as const) {
                const alert = WeatherAlert.create({ ...validProps, channel });
                expect(alert.channel).toBe(channel);
            }
        });

        it('should accept all priorities', () => {
            for (const priority of ['low', 'medium', 'high', 'critical'] as const) {
                const alert = WeatherAlert.create({ ...validProps, priority });
                expect(alert.priority).toBe(priority);
            }
        });
    });
});
