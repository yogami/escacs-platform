/**
 * Unit tests for RainfallEvent entity
 */

import { describe, it, expect } from 'vitest';
import { RainfallEvent } from '@/lib/weather-engine';

describe('RainfallEvent', () => {
    const createProps = () => ({
        id: 'event-001',
        siteId: 'site-001',
        startTime: new Date('2024-01-15T10:00:00Z'),
        intensityInchesPerHour: 0.5,
        totalAccumulationInches: 1.2,
        source: 'noaa' as const,
    });

    describe('create', () => {
        it('should create a valid rainfall event', () => {
            const event = RainfallEvent.create(createProps());

            expect(event.id).toBe('event-001');
            expect(event.siteId).toBe('site-001');
            expect(event.intensityInchesPerHour).toBe(0.5);
        });

        it('should reject negative intensity', () => {
            expect(() =>
                RainfallEvent.create({ ...createProps(), intensityInchesPerHour: -1 })
            ).toThrow('Intensity cannot be negative');
        });

        it('should reject negative accumulation', () => {
            expect(() =>
                RainfallEvent.create({ ...createProps(), totalAccumulationInches: -0.5 })
            ).toThrow('Accumulation cannot be negative');
        });
    });

    describe('exceedsThreshold', () => {
        it('should return true when intensity exceeds threshold', () => {
            const event = RainfallEvent.create({ ...createProps(), intensityInchesPerHour: 0.6 });
            expect(event.exceedsThreshold(0.5)).toBe(true);
        });

        it('should return false when intensity is below threshold', () => {
            const event = RainfallEvent.create({ ...createProps(), intensityInchesPerHour: 0.4 });
            expect(event.exceedsThreshold(0.5)).toBe(false);
        });
    });

    describe('isOngoing', () => {
        it('should return true when endTime is not set', () => {
            const event = RainfallEvent.create(createProps());
            expect(event.isOngoing()).toBe(true);
        });

        it('should return false when endTime is set', () => {
            const event = RainfallEvent.create({
                ...createProps(),
                endTime: new Date('2024-01-15T12:00:00Z'),
            });
            expect(event.isOngoing()).toBe(false);
        });
    });

    describe('getDurationHours', () => {
        it('should return duration in hours when event is complete', () => {
            const event = RainfallEvent.create({
                ...createProps(),
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T12:00:00Z'),
            });
            expect(event.getDurationHours()).toBe(2);
        });

        it('should return null for ongoing events', () => {
            const event = RainfallEvent.create(createProps());
            expect(event.getDurationHours()).toBeNull();
        });
    });
});
