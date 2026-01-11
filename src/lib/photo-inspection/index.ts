/**
 * Photo Inspection Module
 * 
 * AI-powered BMP defect detection from construction site photos:
 * - Multi-class defect classification
 * - Confidence scoring with thresholds
 * - GPS-tagged inspection records
 * 
 * @example
 * ```typescript
 * import { DefectDetectionService, MockVisionAdapter } from '@/lib/photo-inspection';
 * 
 * const adapter = new MockVisionAdapter();
 * const service = new DefectDetectionService(adapter);
 * 
 * const result = await service.analyzePhoto(photo, imageData);
 * console.log('Defects found:', result.defects);
 * ```
 */

// Domain Layer - Entities
export { BMPDefect } from './domain/entities/BMPDefect';
export type {
    BMPDefectProps,
    DefectClass,
    DefectSeverity,
    BoundingBox
} from './domain/entities/BMPDefect';

export { InspectionPhoto } from './domain/entities/InspectionPhoto';
export type {
    InspectionPhotoProps,
    GPSCoordinates
} from './domain/entities/InspectionPhoto';

// Domain Layer - Services
export { DefectDetectionService } from './domain/services/DefectDetectionService';
export type {
    AnalysisResult,
    AnalysisConfig
} from './domain/services/DefectDetectionService';

// Ports
export type {
    IVisionModelPort,
    DetectionResult,
    AnalysisOutput
} from './ports/IVisionModelPort';

// Infrastructure - Adapters
export { MockVisionAdapter } from './infrastructure/MockVisionAdapter';
export type { MockPhotoType } from './infrastructure/MockVisionAdapter';

// ============================================================================
// Factory Functions
// ============================================================================

import { DefectDetectionService } from './domain/services/DefectDetectionService';
import { MockVisionAdapter } from './infrastructure/MockVisionAdapter';

/**
 * Create a defect detection service with mock adapter
 */
export function createDefectDetectionService(): DefectDetectionService {
    const adapter = new MockVisionAdapter();
    return new DefectDetectionService(adapter);
}
