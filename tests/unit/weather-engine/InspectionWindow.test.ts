/**
 * InspectionWindow Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { InspectionWindow } from '../../../src/lib/weather-engine/domain/entities/InspectionWindow';

describe('InspectionWindow', () => {
    const baseTime = new Date('2026-01-10T12:00:00Z');

    describe('create', () => {
        it('should create inspection window with 24-hour jurisdiction', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 24,
                stormEndTime: baseTime,
            });

            expect(window.id).toBe('window-001');
            expect(window.jurisdictionHours).toBe(24);
        });

        it('should store site id', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 24,
                stormEndTime: baseTime,
            });

            expect(window.siteId).toBe('site-001');
        });

        it('should store rainfall event id', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 48,
                stormEndTime: baseTime,
            });

            expect(window.rainfallEventId).toBe('event-001');
        });

        it('should store storm end time', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 72,
                stormEndTime: baseTime,
            });

            expect(window.stormEndTime).toEqual(baseTime);
        });

        it('should accept 24-hour jurisdiction', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 24,
                stormEndTime: baseTime,
            });

            expect(window.jurisdictionHours).toBe(24);
        });

        it('should accept 48-hour jurisdiction', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 48,
                stormEndTime: baseTime,
            });

            expect(window.jurisdictionHours).toBe(48);
        });

        it('should accept 72-hour jurisdiction', () => {
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 72,
                stormEndTime: baseTime,
            });

            expect(window.jurisdictionHours).toBe(72);
        });
    });
});
