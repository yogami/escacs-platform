/**
 * Inspections Routes
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createDefectDetectionService, InspectionPhoto } from '@/lib/photo-inspection';
import { Buffer } from 'node:buffer';

export const inspectionsRoutes = new OpenAPIHono();

const defectSchema = z.object({
    id: z.string(),
    defectClass: z.string(),
    confidence: z.number(),
    severity: z.string(),
    boundingBox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
    }).nullable(),
    recommendedAction: z.string().nullable(),
});

const analysisResultSchema = z.object({
    photoId: z.string(),
    defects: z.array(defectSchema),
    isCompliant: z.boolean(),
    requiresManualReview: z.boolean(),
    reviewReason: z.string().optional(),
    processingTimeMs: z.number(),
});

const analyzeRoute = createRoute({
    method: 'post',
    path: '/inspections/analyze',
    tags: ['Inspections'],
    summary: 'Submit photo for AI defect analysis',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        siteId: z.string(),
                        inspectorId: z.string(),
                        imageBase64: z.string(),
                        latitude: z.number().optional(),
                        longitude: z.number().optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Analysis result',
            content: {
                'application/json': {
                    schema: analysisResultSchema,
                },
            },
        },
    },
});

const getInspectionRoute = createRoute({
    method: 'get',
    path: '/inspections/{id}',
    tags: ['Inspections'],
    summary: 'Get inspection result by ID',
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Inspection result',
            content: {
                'application/json': {
                    schema: analysisResultSchema,
                },
            },
        },
        404: {
            description: 'Inspection not found',
        },
    },
});

// In-memory store for demo
const inspectionResults = new Map<string, object>();

inspectionsRoutes.openapi(analyzeRoute, async (c) => {
    const body = c.req.valid('json');
    const service = createDefectDetectionService();

    const photo = InspectionPhoto.create({
        id: crypto.randomUUID(),
        siteId: body.siteId,
        inspectorId: body.inspectorId,
        capturedAt: new Date(),
        imageUrl: `data:image/jpeg;base64,${body.imageBase64.slice(0, 50)}...`,
        gpsCoordinates: body.latitude && body.longitude ? {
            latitude: body.latitude,
            longitude: body.longitude,
            accuracy: 3,
        } : undefined,
        analysisStatus: 'pending',
    });

    // Convert base64 to Uint8Array (mock)
    const imageData = new Uint8Array(Buffer.from(body.imageBase64, 'base64'));

    const result = await service.analyzePhoto(photo, imageData);

    const response = {
        photoId: result.photo.id,
        defects: result.defects.map(d => ({
            id: d.id,
            defectClass: d.defectClass,
            confidence: d.confidence,
            severity: d.severity,
            boundingBox: d.boundingBox,
            recommendedAction: d.recommendedAction,
        })),
        isCompliant: result.isCompliant,
        requiresManualReview: result.requiresManualReview,
        reviewReason: result.reviewReason,
        processingTimeMs: result.processingTimeMs,
    };

    inspectionResults.set(result.photo.id, response);

    return c.json(response);
});

inspectionsRoutes.openapi(getInspectionRoute, async (c) => {
    const { id } = c.req.valid('param');

    const result = inspectionResults.get(id);
    if (!result) {
        return c.json({ error: 'Inspection not found' }, 404);
    }

    return c.json(result);
});
