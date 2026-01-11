/**
 * SiteCondition - Domain Entity
 * 
 * Represents current conditions at a construction site.
 */

export type ConstructionPhase =
    | 'clearing'
    | 'grading'
    | 'paving'
    | 'stabilization'
    | 'completed';

export type SoilType = 'sandy' | 'loam' | 'clay' | 'rocky';

export interface BMPInventoryItem {
    type: string;
    count: number;
    lastInspectionDate: Date;
    conditionRating: 'good' | 'fair' | 'poor';
}

export interface SiteConditionProps {
    siteId: string;
    phase: ConstructionPhase;
    slopePercent: number;
    soilType: SoilType;
    acreage: number;
    daysSinceLastInspection: number;
    bmpInventory: BMPInventoryItem[];
    historicalNOVCount: number;
    observedAt: Date;
}

export class SiteCondition {
    readonly siteId: string;
    readonly phase: ConstructionPhase;
    readonly slopePercent: number;
    readonly soilType: SoilType;
    readonly acreage: number;
    readonly daysSinceLastInspection: number;
    readonly bmpInventory: BMPInventoryItem[];
    readonly historicalNOVCount: number;
    readonly observedAt: Date;

    private constructor(props: SiteConditionProps) {
        this.siteId = props.siteId;
        this.phase = props.phase;
        this.slopePercent = props.slopePercent;
        this.soilType = props.soilType;
        this.acreage = props.acreage;
        this.daysSinceLastInspection = props.daysSinceLastInspection;
        this.bmpInventory = props.bmpInventory;
        this.historicalNOVCount = props.historicalNOVCount;
        this.observedAt = props.observedAt;
    }

    static create(props: SiteConditionProps): SiteCondition {
        if (props.slopePercent < 0) {
            throw new Error('Slope cannot be negative');
        }
        return new SiteCondition(props);
    }

    /**
     * Check if site is in a high-risk construction phase
     */
    isHighRiskPhase(): boolean {
        return this.phase === 'clearing' || this.phase === 'grading';
    }

    /**
     * Check if site has erodible soil
     */
    hasErodibleSoil(): boolean {
        return this.soilType === 'sandy';
    }

    /**
     * Check if inspection is overdue
     */
    isInspectionOverdue(maxDays: number = 7): boolean {
        return this.daysSinceLastInspection > maxDays;
    }

    /**
     * Get count of BMPs in poor condition
     */
    getPoorConditionBMPCount(): number {
        return this.bmpInventory.filter(b => b.conditionRating === 'poor').length;
    }
}
