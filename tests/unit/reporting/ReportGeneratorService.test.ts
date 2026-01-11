/**
 * ReportGeneratorService Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { ReportGeneratorService } from '../../../src/lib/reporting/domain/services/ReportGeneratorService';
import type { InspectionReportData } from '../../../src/lib/reporting/domain/services/ReportGeneratorService';

describe('ReportGeneratorService', () => {
    const service = new ReportGeneratorService();

    const sampleData: InspectionReportData = {
        siteId: 'site-001',
        siteName: 'Main Street Construction',
        inspectorName: 'John Smith',
        inspectionDate: new Date('2026-01-11'),
        weatherConditions: 'Clear, 65°F',
        overallCompliance: true,
        riskScore: 45,
        findings: [
            {
                bmpType: 'Silt Fence',
                condition: 'good',
                defects: [],
                coordinates: { latitude: 37.5, longitude: -77.4 },
            },
            {
                bmpType: 'Inlet Protection',
                condition: 'fair',
                defects: ['Minor sediment buildup'],
                recommendedAction: 'Clean within 24 hours',
            },
        ],
    };

    describe('generatePdfReport', () => {
        it('should generate PDF report with valid data', async () => {
            const report = await service.generatePdfReport(sampleData);

            expect(report.format).toBe('pdf');
            expect(report.filename).toContain('.pdf');
            expect(report.contentBase64.length).toBeGreaterThan(0);
        });

        it('should include site name in filename', async () => {
            const report = await service.generatePdfReport(sampleData);
            expect(report.filename).toContain('Main_Street_Construction');
        });

        it('should include date in filename', async () => {
            const report = await service.generatePdfReport(sampleData);
            expect(report.filename).toContain('2026-01-11');
        });

        it('should have unique ID', async () => {
            const report1 = await service.generatePdfReport(sampleData);
            const report2 = await service.generatePdfReport(sampleData);
            expect(report1.id).not.toBe(report2.id);
        });

        it('should track size in bytes', async () => {
            const report = await service.generatePdfReport(sampleData);
            expect(report.sizeBytes).toBeGreaterThan(0);
        });
    });

    describe('generateExcelReport', () => {
        it('should generate Excel report with valid data', async () => {
            const report = await service.generateExcelReport(sampleData);

            expect(report.format).toBe('excel');
            expect(report.filename).toContain('.xlsx');
            expect(report.contentBase64.length).toBeGreaterThan(0);
        });

        it('should generate valid CSV content', async () => {
            const report = await service.generateExcelReport(sampleData);
            const content = Buffer.from(report.contentBase64, 'base64').toString();

            expect(content).toContain('Site ID');
            expect(content).toContain('site-001');
            expect(content).toContain('Silt Fence');
        });
    });

    describe('non-compliant reports', () => {
        it('should handle non-compliant status', async () => {
            const nonCompliantData = {
                ...sampleData,
                overallCompliance: false,
                findings: [
                    {
                        bmpType: 'Silt Fence',
                        condition: 'critical' as const,
                        defects: ['Major tear', 'Overtopping'],
                        recommendedAction: 'Immediate repair required',
                    },
                ],
            };

            const report = await service.generatePdfReport(nonCompliantData);
            expect(report.contentBase64.length).toBeGreaterThan(0);
        });
    });
});
