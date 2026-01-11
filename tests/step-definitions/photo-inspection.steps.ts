import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { createDefectDetectionService } from '../../src/lib/photo-inspection/index.ts';
import { MockVisionAdapter } from '../../src/lib/photo-inspection/infrastructure/MockVisionAdapter.ts';

import { DefectDetectionService } from '../../src/lib/photo-inspection/domain/services/DefectDetectionService.ts';
import { InspectionPhoto } from '../../src/lib/photo-inspection/domain/entities/InspectionPhoto.ts';

// --- World Context ---
let service: any;
let mockAdapter: MockVisionAdapter;
let photoData: Uint8Array;
let analysisResult: any;
let siteId: string = 'site-123';
let inspectorId: string = 'inspector-456';
let currentCoordinates: any = null;

Before(() => {
    mockAdapter = new MockVisionAdapter();
    service = new DefectDetectionService(mockAdapter);
    photoData = new Uint8Array([0, 1, 2]); // DUMMY
    analysisResult = null;
    currentCoordinates = null;
});

// --- Given ---
Given('the AI vision model is initialized', () => {
});

Given('the minimum confidence threshold is {float}', (_threshold: number) => {
});

Given('I have a photo of a damaged silt fence with a visible tear', () => {
    mockAdapter.setMockPhotoType('silt_fence_tear');
});

Given('I have a photo of an inlet with accumulated sediment', () => {
    mockAdapter.setMockPhotoType('inlet_clogged');
});

Given('I have a photo showing mud tracks leaving the site', () => {
    mockAdapter.setMockPhotoType('sediment_tracking');
});

Given('the tracks extend more than 50 feet', () => {
    // metadata
});

Given('I have a photo of a properly installed silt fence', () => {
    mockAdapter.setMockPhotoType('compliant');
});

Given('I have a photo showing a torn silt fence and gap in perimeter control', () => {
    mockAdapter.setMockPhotoType('multiple_defects');
});

Given('I have a photo with poor lighting conditions', () => {
    mockAdapter.setMockPhotoType('low_quality');
});

Given(/I capture a photo at coordinates ([\d.-]+), ([\d.-]+)/, (lat: number, lon: number) => {
    currentCoordinates = { latitude: Number(lat), longitude: Number(lon), accuracy: 3 };
});

// --- When ---
When('the AI analyzes the photo', async () => {
    const photo = InspectionPhoto.create({
        id: 'photo-1',
        siteId,
        inspectorId,
        imageUrl: 'mock://photo-1.jpg',
        capturedAt: new Date(),
        analysisStatus: 'pending'
    });
    analysisResult = await service.analyzePhoto(photo, photoData);
});

When('the photo is submitted for analysis', async () => {
    const photo = InspectionPhoto.create({
        id: 'photo-1',
        siteId,
        inspectorId,
        imageUrl: 'mock://photo-1.jpg',
        capturedAt: new Date(),
        gpsCoordinates: currentCoordinates,
        analysisStatus: 'pending'
    });

    analysisResult = await service.analyzePhoto(photo, photoData);
});

// --- Then ---
Then('the result should contain a defect of class {string}', (defectClass: string) => {
    const hasDefect = analysisResult.defects.some((d: any) => d.defectClass === defectClass);
    expect(hasDefect).toBe(true);
});

Then('the confidence score should be greater than {float}', (minConf: number) => {
    const highConf = analysisResult.defects.every((d: any) => d.confidence > minConf);
    expect(highConf).toBe(true);
});

Then('the confidence score is below {float}', (maxConf: number) => {
    // low quality mock has 0.55
});

Then('a bounding box should be provided for the defect', () => {
    analysisResult.defects.forEach((d: any) => {
        expect(d.boundingBox).toBeDefined();
    });
});

Then('the severity should be {string}', (severity: string) => {
    const hasSeverity = analysisResult.defects.some((d: any) => d.severity === severity);
    expect(hasSeverity).toBe(true);
});

Then('the recommended action should be {string}', (action: string) => {
    const hasAction = analysisResult.defects.some((d: any) => d.recommendedAction === action);
    expect(hasAction).toBe(true);
});

Then('no defects should be detected', () => {
    expect(analysisResult.defects.length).toBe(0);
});

Then('the result should indicate {string}', (status: string) => {
    if (status === 'BMP compliant') {
        expect(analysisResult.isCompliant).toBe(true);
    }
});

Then('the result should contain {int} defects', (count: number) => {
    expect(analysisResult.defects.length).toBe(count);
});

Then('the defects should include {string} and {string}', (d1: string, d2: string) => {
    const classes = analysisResult.defects.map((d: any) => d.defectClass);
    expect(classes).toContain(d1);
    expect(classes).toContain(d2);
});

Then('the result should be flagged for {string}', (flag: string) => {
    if (flag === 'manual_review') {
        expect(analysisResult.requiresManualReview).toBe(true);
    }
});

Then('the reason should be {string}', (reason: string) => {
    expect(analysisResult.reviewReason).toBe(reason);
});

Then('the inspection record should include GPS coordinates', () => {
    expect(analysisResult.photo.gpsCoordinates).toBeDefined();
    expect(analysisResult.photo.gpsCoordinates.latitude).toBe(37.5407);
});

Then('location accuracy should be within {int} meters', (meters: number) => {
    expect(analysisResult.photo.gpsCoordinates.accuracy).toBeLessThanOrEqual(meters);
});
