import { Given, When, Then, Before } from '@cucumber/cucumber';

// --- Types ---
interface Defect {
    class: string;
    confidence: number;
    severity: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    recommendedAction?: string;
}

interface AnalysisResult {
    defects: Defect[];
    isCompliant: boolean;
    flaggedForReview: boolean;
    reviewReason?: string;
    gpsCoordinates?: { lat: number; lon: number; accuracy: number };
}

// --- World Context ---
let photoDescription: string;
let analysisResult: AnalysisResult | null;
let gpsCoordinates: { lat: number; lon: number } | null;
let confidenceThreshold: number;

Before(() => {
    photoDescription = '';
    analysisResult = null;
    gpsCoordinates = null;
    confidenceThreshold = 0.85;
});

// --- Given ---
Given('the AI vision model is initialized', () => {
    // Model initialization stub
});

Given('the minimum confidence threshold is {float}', (threshold: number) => {
    confidenceThreshold = threshold;
});

Given('I have a photo of a damaged silt fence with a visible tear', () => {
    photoDescription = 'silt_fence_tear';
});

Given('I have a photo of an inlet with accumulated sediment', () => {
    photoDescription = 'inlet_clogged';
});

Given('I have a photo showing mud tracks leaving the site', () => {
    photoDescription = 'sediment_tracking';
});

Given('the tracks extend more than {int} feet', (_feet: number) => {
    // Track length validation
});

Given('I have a photo of a properly installed silt fence', () => {
    photoDescription = 'compliant_silt_fence';
});

Given('I have a photo showing a torn silt fence and gap in perimeter control', () => {
    photoDescription = 'multiple_defects';
});

Given('I have a photo with poor lighting conditions', () => {
    photoDescription = 'low_quality';
});

Given('I capture a photo at coordinates {float}, {float}', (lat: number, lon: number) => {
    gpsCoordinates = { lat, lon };
});

// --- When ---
When('the AI analyzes the photo', () => {
    // Mock AI analysis based on photo description
    switch (photoDescription) {
        case 'silt_fence_tear':
            analysisResult = {
                defects: [{
                    class: 'silt_fence_tear',
                    confidence: 0.92,
                    severity: 'high',
                    boundingBox: { x: 100, y: 50, width: 200, height: 150 },
                }],
                isCompliant: false,
                flaggedForReview: false,
            };
            break;
        case 'inlet_clogged':
            analysisResult = {
                defects: [{
                    class: 'inlet_clogged',
                    confidence: 0.88,
                    severity: 'high',
                }],
                isCompliant: false,
                flaggedForReview: false,
            };
            break;
        case 'sediment_tracking':
            analysisResult = {
                defects: [{
                    class: 'sediment_tracking',
                    confidence: 0.90,
                    severity: 'medium',
                    recommendedAction: 'Deploy wheel wash or sweep access road',
                }],
                isCompliant: false,
                flaggedForReview: false,
            };
            break;
        case 'compliant_silt_fence':
            analysisResult = {
                defects: [],
                isCompliant: true,
                flaggedForReview: false,
            };
            break;
        case 'multiple_defects':
            analysisResult = {
                defects: [
                    { class: 'silt_fence_tear', confidence: 0.89, severity: 'high' },
                    { class: 'perimeter_gap', confidence: 0.86, severity: 'medium' },
                ],
                isCompliant: false,
                flaggedForReview: false,
            };
            break;
        case 'low_quality':
            analysisResult = {
                defects: [{ class: 'unknown', confidence: 0.55, severity: 'unknown' }],
                isCompliant: false,
                flaggedForReview: true,
                reviewReason: 'Low confidence detection',
            };
            break;
        default:
            analysisResult = { defects: [], isCompliant: true, flaggedForReview: false };
    }
});

When('the confidence score is below {float}', (_score: number) => {
    // Already handled in low_quality case
});

When('the photo is submitted for analysis', () => {
    if (gpsCoordinates) {
        analysisResult = {
            defects: [],
            isCompliant: true,
            flaggedForReview: false,
            gpsCoordinates: { ...gpsCoordinates, accuracy: 3 },
        };
    }
});

// --- Then ---
Then('the result should contain a defect of class {string}', (defectClass: string) => {
    if (!analysisResult?.defects.some(d => d.class === defectClass)) {
        throw new Error(`Expected defect class: ${defectClass}`);
    }
});

Then('the confidence score should be greater than {float}', (threshold: number) => {
    const allAbove = analysisResult?.defects.every(d => d.confidence > threshold);
    if (!allAbove) throw new Error(`Expected confidence > ${threshold}`);
});

Then('a bounding box should be provided for the defect', () => {
    const hasBoundingBox = analysisResult?.defects.some(d => d.boundingBox);
    if (!hasBoundingBox) throw new Error('Expected bounding box');
});

Then('the severity should be {string}', (severity: string) => {
    if (!analysisResult?.defects.some(d => d.severity === severity)) {
        throw new Error(`Expected severity: ${severity}`);
    }
});

Then('the recommended action should be {string}', (action: string) => {
    if (!analysisResult?.defects.some(d => d.recommendedAction === action)) {
        throw new Error(`Expected action: ${action}`);
    }
});

Then('no defects should be detected', () => {
    if (analysisResult?.defects.length !== 0) {
        throw new Error('Expected no defects');
    }
});

Then('the result should indicate {string}', (status: string) => {
    if (status === 'BMP compliant' && !analysisResult?.isCompliant) {
        throw new Error('Expected BMP compliant');
    }
});

Then('the result should contain {int} defects', (count: number) => {
    if (analysisResult?.defects.length !== count) {
        throw new Error(`Expected ${count} defects, got ${analysisResult?.defects.length}`);
    }
});

Then('the defects should include {string} and {string}', (defect1: string, defect2: string) => {
    const classes = analysisResult?.defects.map(d => d.class) || [];
    if (!classes.includes(defect1) || !classes.includes(defect2)) {
        throw new Error(`Expected defects: ${defect1}, ${defect2}`);
    }
});

Then('the result should be flagged for {string}', (flag: string) => {
    if (flag === 'manual_review' && !analysisResult?.flaggedForReview) {
        throw new Error('Expected flagged for manual review');
    }
});

Then('the reason should be {string}', (reason: string) => {
    if (analysisResult?.reviewReason !== reason) {
        throw new Error(`Expected reason: ${reason}`);
    }
});

Then('the inspection record should include GPS coordinates', () => {
    if (!analysisResult?.gpsCoordinates) {
        throw new Error('Expected GPS coordinates');
    }
});

Then('location accuracy should be within {int} meters', (meters: number) => {
    if (analysisResult?.gpsCoordinates && analysisResult.gpsCoordinates.accuracy > meters) {
        throw new Error(`Expected accuracy within ${meters}m`);
    }
});
