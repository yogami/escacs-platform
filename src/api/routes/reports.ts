/**
 * Reports API Routes
 * 
 * Endpoints for compliance report generation.
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ReportGeneratorService } from '../../lib/reporting/domain/services/ReportGeneratorService';
import type { InspectionReportData, InspectionFinding } from '../../lib/reporting/domain/services/ReportGeneratorService';

export const reportsRoutes = new OpenAPIHono();
const reportService = new ReportGeneratorService();

// Request schema
const GenerateReportSchema = z.object({
    siteId: z.string().openapi({ example: 'site-001' }),
    siteName: z.string().openapi({ example: 'Main Street Construction' }),
    inspectorName: z.string().openapi({ example: 'John Smith' }),
    inspectionDate: z.string().openapi({ example: '2026-01-11' }),
    weatherConditions: z.string().openapi({ example: 'Clear, 65°F' }),
    overallCompliance: z.boolean().openapi({ example: true }),
    riskScore: z.number().optional().openapi({ example: 45 }),
    format: z.enum(['pdf', 'excel']).default('pdf').openapi({ example: 'pdf' }),
    findings: z.array(z.object({
        bmpType: z.string(),
        condition: z.enum(['good', 'fair', 'poor', 'critical']),
        photoUrl: z.string().optional(),
        defects: z.array(z.string()),
        recommendedAction: z.string().optional(),
        coordinates: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }).optional(),
    })).default([]),
});

// Response schema
const GeneratedReportSchema = z.object({
    id: z.string(),
    format: z.enum(['pdf', 'excel']),
    filename: z.string(),
    contentBase64: z.string(),
    generatedAt: z.string(),
    sizeBytes: z.number(),
});

const generateReportRoute = createRoute({
    method: 'post',
    path: '/generate',
    tags: ['Reports'],
    summary: 'Generate compliance report',
    description: 'Generate a PDF or Excel compliance report for an inspection',
    request: {
        body: {
            content: { 'application/json': { schema: GenerateReportSchema } },
        },
    },
    responses: {
        200: {
            description: 'Report generated successfully',
            content: { 'application/json': { schema: GeneratedReportSchema } },
        },
    },
});

reportsRoutes.openapi(generateReportRoute, async (c) => {
    const body = c.req.valid('json');

    const reportData: InspectionReportData = {
        siteId: body.siteId,
        siteName: body.siteName,
        inspectorName: body.inspectorName,
        inspectionDate: new Date(body.inspectionDate),
        weatherConditions: body.weatherConditions,
        overallCompliance: body.overallCompliance,
        riskScore: body.riskScore,
        findings: body.findings as InspectionFinding[],
    };

    let report;
    if (body.format === 'excel') {
        report = await reportService.generateExcelReport(reportData);
    } else {
        report = await reportService.generatePdfReport(reportData);
    }

    return c.json({
        id: report.id,
        format: report.format,
        filename: report.filename,
        contentBase64: report.contentBase64,
        generatedAt: report.generatedAt.toISOString(),
        sizeBytes: report.sizeBytes,
    });
});

export default reportsRoutes;
