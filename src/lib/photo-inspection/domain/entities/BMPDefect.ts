/**
 * BMPDefect - Domain Entity
 * 
 * Represents a detected BMP defect with classification and severity.
 */

export type DefectClass =
    | 'silt_fence_tear'
    | 'silt_fence_overtopping'
    | 'silt_fence_gap'
    | 'inlet_clogged'
    | 'inlet_bypassed'
    | 'inlet_overflow'
    | 'sediment_tracking'
    | 'bare_soil'
    | 'perimeter_gap'
    | 'construction_entrance_rutting'
    | 'unknown';

export type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BMPDefectProps {
    id: string;
    inspectionId: string;
    defectClass: DefectClass;
    confidence: number;
    severity: DefectSeverity;
    boundingBox?: BoundingBox;
    recommendedAction?: string;
    detectedAt: Date;
}

export class BMPDefect {
    readonly id: string;
    readonly inspectionId: string;
    readonly defectClass: DefectClass;
    readonly confidence: number;
    readonly severity: DefectSeverity;
    readonly boundingBox: BoundingBox | null;
    readonly recommendedAction: string | null;
    readonly detectedAt: Date;

    private constructor(props: BMPDefectProps) {
        this.id = props.id;
        this.inspectionId = props.inspectionId;
        this.defectClass = props.defectClass;
        this.confidence = props.confidence;
        this.severity = props.severity;
        this.boundingBox = props.boundingBox ?? null;
        this.recommendedAction = props.recommendedAction ?? null;
        this.detectedAt = props.detectedAt;
    }

    static create(props: BMPDefectProps): BMPDefect {
        if (props.confidence < 0 || props.confidence > 1) {
            throw new Error('Confidence must be between 0 and 1');
        }
        return new BMPDefect(props);
    }

    /**
     * Check if detection meets confidence threshold
     */
    meetsConfidenceThreshold(threshold: number): boolean {
        return this.confidence >= threshold;
    }

    /**
     * Check if defect requires immediate attention
     */
    requiresImmediateAction(): boolean {
        return this.severity === 'critical' || this.severity === 'high';
    }

    /**
     * Get recommended action based on defect class
     */
    static getDefaultAction(defectClass: DefectClass): string {
        const actions: Record<DefectClass, string> = {
            silt_fence_tear: 'Repair or replace damaged silt fence section',
            silt_fence_overtopping: 'Add additional height or install secondary control',
            silt_fence_gap: 'Close gap and reinforce connection points',
            inlet_clogged: 'Clear sediment and clean filter fabric',
            inlet_bypassed: 'Reinstall inlet protection properly',
            inlet_overflow: 'Add additional inlet capacity or diversion',
            sediment_tracking: 'Deploy wheel wash or sweep access road',
            bare_soil: 'Apply temporary stabilization (mulch, blankets)',
            perimeter_gap: 'Extend perimeter control to close gaps',
            construction_entrance_rutting: 'Add crushed stone and regrade entrance',
            unknown: 'Inspect manually and determine corrective action',
        };
        return actions[defectClass];
    }
}
