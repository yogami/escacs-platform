/**
 * WeatherTriggerService Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherTriggerService } from '../../../src/lib/weather-engine/domain/services/WeatherTriggerService';
import type { SitePermit } from '../../../src/lib/weather-engine/domain/services/WeatherTriggerService';
import { MockNoaaAdapter } from '../../../src/lib/weather-engine/infrastructure/MockNoaaAdapter';

describe('WeatherTriggerService', () => {
    let service: WeatherTriggerService;
    let mockAdapter: MockNoaaAdapter;

    const defaultPermit: SitePermit = {
        siteId: 'site-001',
        thresholdInchesPerHour: 0.5,
        jurisdictionInspectionHours: 24,
        superintendentPhone: '+15551234567',
        inspectorEmails: ['inspector1@example.com', 'inspector2@example.com'],
        ownerEmail: 'owner@example.com',
    };

    beforeEach(() => {
        mockAdapter = new MockNoaaAdapter();
        service = new WeatherTriggerService(mockAdapter);
    });

    describe('evaluateTriggers', () => {
        it('should return no alerts when below threshold', async () => {
            mockAdapter.setMockScenario('clear');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            expect(result.shouldAlert).toBe(false);
            expect(result.alerts).toHaveLength(0);
        });

        it('should return alerts when threshold exceeded', async () => {
            mockAdapter.setMockScenario('heavy_rain');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            expect(result.shouldAlert).toBe(true);
            expect(result.alerts.length).toBeGreaterThan(0);
            expect(result.triggerReason).toContain('Rain forecast');
        });

        it('should create alerts for all channels', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            const channels = result.alerts.map(a => a.channel);
            expect(channels).toContain('sms');
            expect(channels).toContain('push');
            expect(channels).toContain('email');
        });

        it('should create correct number of alerts based on contacts', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            // 1 SMS + 2 Push (2 inspectors) + 1 Email = 4 total
            expect(result.alerts).toHaveLength(4);
        });
    });

    describe('determinePriority', () => {
        it('should return critical for intensity > 1.0', () => {
            expect(service.determinePriority(1.5, 10)).toBe('critical');
        });

        it('should return critical for hoursAhead <= 2', () => {
            expect(service.determinePriority(0.3, 1)).toBe('critical');
        });

        it('should return high for intensity > 0.5', () => {
            expect(service.determinePriority(0.7, 10)).toBe('high');
        });

        it('should return high for hoursAhead <= 4', () => {
            expect(service.determinePriority(0.3, 3)).toBe('high');
        });

        it('should return medium for hoursAhead <= 12', () => {
            expect(service.determinePriority(0.3, 8)).toBe('medium');
        });

        it('should return low for distant low-intensity forecast', () => {
            expect(service.determinePriority(0.2, 24)).toBe('low');
        });
    });

    describe('alert message format', () => {
        it('should include deployment instructions', async () => {
            mockAdapter.setMockScenario('heavy_rain');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            expect(result.alerts[0].message).toContain('Deploy controls');
        });

        it('should include intensity in message', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            expect(result.alerts[0].message).toMatch(/\d+\.\d+ in\/hr/);
        });
    });

    describe('recipient routing', () => {
        it('should route SMS to superintendent phone', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            const smsAlert = result.alerts.find(a => a.channel === 'sms');
            expect(smsAlert?.recipient).toBe(defaultPermit.superintendentPhone);
            expect(smsAlert?.recipientType).toBe('superintendent');
        });

        it('should route push to inspector emails', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            const pushAlerts = result.alerts.filter(a => a.channel === 'push');
            expect(pushAlerts).toHaveLength(2);
            expect(pushAlerts[0].recipientType).toBe('inspector');
        });

        it('should route email to owner', async () => {
            mockAdapter.setMockScenario('storm');
            const result = await service.evaluateTriggers(defaultPermit, 37.5, -77.4);

            const emailAlert = result.alerts.find(a => a.channel === 'email');
            expect(emailAlert?.recipient).toBe(defaultPermit.ownerEmail);
            expect(emailAlert?.recipientType).toBe('owner');
        });
    });
});
