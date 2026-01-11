import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3042';

test.describe('ESCACS API E2E', () => {
    test('Health check returns 200', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/health`);
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.status).toBe('healthy');
        expect(body.version).toBeDefined();
    });

    test('OpenAPI spec is available', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/openapi.json`);
        expect(response.ok()).toBeTruthy();
        const spec = await response.json();
        expect(spec.openapi).toBeDefined();
        expect(spec.info.title).toContain('ESCACS');
    });

    test('Weather forecast data', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/weather/forecast`, {
            params: {
                lat: 37.5407,
                lon: -77.4360,
                hours: 24
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.forecasts).toBeInstanceOf(Array);
        expect(body.forecasts.length).toBe(24);
    });

    test('Weather trigger evaluation', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/weather/evaluate`, {
            data: {
                siteId: 'site-123',
                latitude: 37.5407,
                longitude: -77.4360,
                thresholdInchesPerHour: 0.5,
                superintendentPhone: '+15551234567',
                inspectorEmails: ['inspector@example.com'],
                ownerEmail: 'owner@example.com'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.shouldAlert).toBeDefined();
        expect(body.alerts).toBeInstanceOf(Array);
    });

    test('Violation risk calculation', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/risk/calculate`, {
            data: {
                siteId: 'site-123',
                phase: 'grading',
                slopePercent: 15,
                soilType: 'sandy',
                acreage: 5.5,
                daysSinceLastInspection: 3,
                historicalNOVCount: 1,
                weather: {
                    precipitationInchesNext24h: 0.2,
                    precipitationInchesNext48h: 0.8,
                    precipitationInchesNext72h: 1.2
                },
                horizonHours: '48'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.score).toBeDefined();
        expect(body.level).toBeDefined();
        expect(body.actions).toBeInstanceOf(Array);
    });

    test('Photo inspection analysis', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/inspections/analyze`, {
            data: {
                siteId: 'site-123',
                inspectorId: 'insp-456',
                imageBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 1x1 pixel gif
                latitude: 37.5407,
                longitude: -77.4360
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.photoId).toBeDefined();
        expect(body.defects).toBeInstanceOf(Array);
        expect(body.processingTimeMs).toBeGreaterThan(0);
    });

    test('Report generation', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/reports/generate`, {
            data: {
                siteId: 'site-123',
                siteName: 'Production Verification Site',
                inspectorName: 'E2E Runner',
                inspectionDate: new Date().toISOString().split('T')[0],
                weatherConditions: 'Verified by automation',
                overallCompliance: true,
                riskScore: 30,
                format: 'pdf',
                findings: [
                    {
                        bmpType: 'Silt Fence',
                        condition: 'good',
                        defects: []
                    }
                ]
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.filename).toContain('.pdf');
        expect(body.contentBase64).toBeDefined();
        expect(body.sizeBytes).toBeGreaterThan(0);
    });
});
