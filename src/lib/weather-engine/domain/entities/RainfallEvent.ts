/**
 * RainfallEvent - Domain Entity
 * 
 * Represents a precipitation event with intensity, duration, and timestamp.
 */

export interface RainfallEventProps {
    id: string;
    siteId: string;
    startTime: Date;
    endTime?: Date;
    intensityInchesPerHour: number;
    totalAccumulationInches: number;
    source: 'noaa' | 'local_gauge' | 'estimated';
}

export class RainfallEvent {
    readonly id: string;
    readonly siteId: string;
    readonly startTime: Date;
    readonly endTime: Date | null;
    readonly intensityInchesPerHour: number;
    readonly totalAccumulationInches: number;
    readonly source: 'noaa' | 'local_gauge' | 'estimated';

    private constructor(props: RainfallEventProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.startTime = props.startTime;
        this.endTime = props.endTime ?? null;
        this.intensityInchesPerHour = props.intensityInchesPerHour;
        this.totalAccumulationInches = props.totalAccumulationInches;
        this.source = props.source;
    }

    static create(props: RainfallEventProps): RainfallEvent {
        if (props.intensityInchesPerHour < 0) {
            throw new Error('Intensity cannot be negative');
        }
        if (props.totalAccumulationInches < 0) {
            throw new Error('Accumulation cannot be negative');
        }
        return new RainfallEvent(props);
    }

    /**
     * Check if event exceeds a threshold
     */
    exceedsThreshold(thresholdInchesPerHour: number): boolean {
        return this.intensityInchesPerHour > thresholdInchesPerHour;
    }

    /**
     * Calculate duration in hours
     */
    getDurationHours(): number | null {
        if (!this.endTime) return null;
        return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
    }

    /**
     * Check if event is still ongoing
     */
    isOngoing(): boolean {
        return this.endTime === null;
    }
}
