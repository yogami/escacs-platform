/**
 * InspectionWindow - Domain Entity
 * 
 * Represents post-storm inspection deadline requirements.
 */

export interface InspectionWindowProps {
    id: string;
    siteId: string;
    rainfallEventId: string;
    jurisdictionHours: 24 | 48 | 72;
    stormEndTime: Date;
    deadlineTime: Date;
    inspectionCompletedAt?: Date;
    inspectionId?: string;
}

export class InspectionWindow {
    readonly id: string;
    readonly siteId: string;
    readonly rainfallEventId: string;
    readonly jurisdictionHours: 24 | 48 | 72;
    readonly stormEndTime: Date;
    readonly deadlineTime: Date;
    private _inspectionCompletedAt: Date | null;
    private _inspectionId: string | null;

    private constructor(props: InspectionWindowProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.rainfallEventId = props.rainfallEventId;
        this.jurisdictionHours = props.jurisdictionHours;
        this.stormEndTime = props.stormEndTime;
        this.deadlineTime = props.deadlineTime;
        this._inspectionCompletedAt = props.inspectionCompletedAt ?? null;
        this._inspectionId = props.inspectionId ?? null;
    }

    static create(props: Omit<InspectionWindowProps, 'deadlineTime'>): InspectionWindow {
        const deadlineTime = new Date(props.stormEndTime);
        deadlineTime.setHours(deadlineTime.getHours() + props.jurisdictionHours);

        return new InspectionWindow({
            ...props,
            deadlineTime,
        });
    }

    get inspectionCompletedAt(): Date | null {
        return this._inspectionCompletedAt;
    }

    get inspectionId(): string | null {
        return this._inspectionId;
    }

    /**
     * Check if deadline has passed
     */
    isOverdue(): boolean {
        return new Date() > this.deadlineTime && !this._inspectionCompletedAt;
    }

    /**
     * Get hours remaining until deadline
     */
    getHoursRemaining(): number {
        if (this._inspectionCompletedAt) return 0;
        const now = new Date();
        const diff = this.deadlineTime.getTime() - now.getTime();
        return Math.max(0, diff / (1000 * 60 * 60));
    }

    /**
     * Mark inspection as completed
     */
    completeInspection(inspectionId: string): void {
        this._inspectionCompletedAt = new Date();
        this._inspectionId = inspectionId;
    }

    /**
     * Check if inspection is completed
     */
    isCompleted(): boolean {
        return this._inspectionCompletedAt !== null;
    }
}
