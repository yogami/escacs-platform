/**
 * InspectionPhoto - Domain Entity
 * 
 * Represents a captured inspection photo with GPS metadata.
 */

export interface GPSCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
    altitude?: number;
}

export interface InspectionPhotoProps {
    id: string;
    siteId: string;
    inspectorId: string;
    capturedAt: Date;
    imageUrl: string;
    gpsCoordinates?: GPSCoordinates;
    deviceId?: string;
    analyzedAt?: Date;
    analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
}

export class InspectionPhoto {
    readonly id: string;
    readonly siteId: string;
    readonly inspectorId: string;
    readonly capturedAt: Date;
    readonly imageUrl: string;
    readonly gpsCoordinates: GPSCoordinates | null;
    readonly deviceId: string | null;
    private _analyzedAt: Date | null;
    private _analysisStatus: InspectionPhotoProps['analysisStatus'];

    private constructor(props: InspectionPhotoProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.inspectorId = props.inspectorId;
        this.capturedAt = props.capturedAt;
        this.imageUrl = props.imageUrl;
        this.gpsCoordinates = props.gpsCoordinates ?? null;
        this.deviceId = props.deviceId ?? null;
        this._analyzedAt = props.analyzedAt ?? null;
        this._analysisStatus = props.analysisStatus;
    }

    static create(props: InspectionPhotoProps): InspectionPhoto {
        if (!props.imageUrl) {
            throw new Error('Image URL is required');
        }
        if (props.gpsCoordinates) {
            if (props.gpsCoordinates.accuracy > 100) {
                // GPS accuracy > 100m is too imprecise
            }
        }
        return new InspectionPhoto(props);
    }

    get analyzedAt(): Date | null {
        return this._analyzedAt;
    }

    get analysisStatus(): InspectionPhotoProps['analysisStatus'] {
        return this._analysisStatus;
    }

    /**
     * Mark analysis as started
     */
    startAnalysis(): void {
        this._analysisStatus = 'analyzing';
    }

    /**
     * Mark analysis as completed
     */
    completeAnalysis(): void {
        this._analysisStatus = 'completed';
        this._analyzedAt = new Date();
    }

    /**
     * Mark analysis as failed
     */
    failAnalysis(): void {
        this._analysisStatus = 'failed';
    }

    /**
     * Check if photo has GPS coordinates
     */
    hasGpsCoordinates(): boolean {
        return this.gpsCoordinates !== null;
    }

    /**
     * Check if GPS coordinates meet accuracy requirement
     */
    isGpsAccurate(maxMeters: number = 5): boolean {
        return this.hasGpsCoordinates() &&
            this.gpsCoordinates!.accuracy <= maxMeters;
    }

    /**
     * Alias for isGpsAccurate for backwards compatibility
     */
    hasAccurateGPS(maxMeters: number = 5): boolean {
        return this.isGpsAccurate(maxMeters);
    }

    /**
     * Update analysis status directly
     */
    updateAnalysisStatus(status: InspectionPhotoProps['analysisStatus']): void {
        this._analysisStatus = status;
        if (status === 'completed') {
            this._analyzedAt = new Date();
        }
    }
}
