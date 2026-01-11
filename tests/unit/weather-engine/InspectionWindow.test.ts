/**
 * InspectionWindow Entity Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { InspectionWindow } from '../../../src/lib/weather-engine/domain/entities/InspectionWindow';

describe('InspectionWindow', () => {
    const createWindow = (hoursAgo: number, jurisdictionHours: 24 | 48 | 72 = 24) => {
        const stormEndTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
        return InspectionWindow.create({
            id: 'window-001',
            siteId: 'site-001',
            rainfallEventId: 'event-001',
            jurisdictionHours,
            stormEndTime,
        });
    };

    describe('create', () => {
        it('should create valid inspection window', () => {
            const window = createWindow(0);
            expect(window.id).toBe('window-001');
            expect(window.siteId).toBe('site-001');
        });

        it('should calculate deadline from stormEndTime + jurisdictionHours', () => {
            const stormEndTime = new Date('2026-01-10T12:00:00Z');
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 24,
                stormEndTime,
            });

            const expectedDeadline = new Date('2026-01-11T12:00:00Z');
            expect(window.deadline.getTime()).toBe(expectedDeadline.getTime());
        });

        it('should handle 48-hour jurisdiction', () => {
            const stormEndTime = new Date('2026-01-10T12:00:00Z');
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 48,
                stormEndTime,
            });

            const expectedDeadline = new Date('2026-01-12T12:00:00Z');
            expect(window.deadline.getTime()).toBe(expectedDeadline.getTime());
        });

        it('should handle 72-hour jurisdiction', () => {
            const stormEndTime = new Date('2026-01-10T12:00:00Z');
            const window = InspectionWindow.create({
                id: 'window-001',
                siteId: 'site-001',
                rainfallEventId: 'event-001',
                jurisdictionHours: 72,
                stormEndTime,
            });

            const expectedDeadline = new Date('2026-01-13T12:00:00Z');
            expect(window.deadline.getTime()).toBe(expectedDeadline.getTime());
        });
    });

    describe('isExpired', () => {
        it('should return false for future deadline', () => {
            const window = createWindow(0, 24); // Storm just ended, deadline is 24h away
            expect(window.isExpired()).toBe(false);
        });

        it('should return true for past deadline', () => {
            const window = createWindow(48, 24); // Storm ended 48h ago, 24h deadline passed
            expect(window.isExpired()).toBe(true);
        });
    });

    describe('isOverdue', () => {
        it('should return false when not expired', () => {
            const window = createWindow(0, 24);
            expect(window.isOverdue()).toBe(false);
        });

        it('should return true when expired and not completed', () => {
            const window = createWindow(48, 24);
            expect(window.isOverdue()).toBe(true);
        });

        it('should return false when expired but completed', () => {
            const window = createWindow(48, 24);
            window.completeInspection('inspection-001');
            expect(window.isOverdue()).toBe(false);
        });
    });

    describe('getRemainingHours', () => {
        it('should return positive hours for future deadline', () => {
            const window = createWindow(0, 24);
            expect(window.getRemainingHours()).toBeGreaterThan(20);
            expect(window.getRemainingHours()).toBeLessThanOrEqual(24);
        });

        it('should return 0 for past deadline', () => {
            const window = createWindow(48, 24);
            expect(window.getRemainingHours()).toBe(0);
        });

        it('should alias getHoursRemaining', () => {
            const window = createWindow(0, 24);
            expect(window.getHoursRemaining()).toBe(window.getRemainingHours());
        });
    });

    describe('completeInspection', () => {
        it('should mark as completed', () => {
            const window = createWindow(0);
            window.completeInspection('inspection-001');
            expect(window.isCompleted()).toBe(true);
        });

        it('should store inspection id', () => {
            const window = createWindow(0);
            window.completeInspection('inspection-001');
            expect(window.inspectionId).toBe('inspection-001');
        });

        it('should set completedAt timestamp', () => {
            const window = createWindow(0);
            window.completeInspection('inspection-001');
            expect(window.inspectionCompletedAt).toBeInstanceOf(Date);
        });
    });
});
