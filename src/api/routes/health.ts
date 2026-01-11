/**
 * Health Route
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

export const healthRoutes = new OpenAPIHono();

const healthSchema = z.object({
    status: z.string(),
    timestamp: z.string(),
    version: z.string(),
    uptime: z.number(),
});

const healthRoute = createRoute({
    method: 'get',
    path: '/health',
    tags: ['System'],
    summary: 'Health check endpoint',
    responses: {
        200: {
            description: 'Service is healthy',
            content: {
                'application/json': {
                    schema: healthSchema,
                },
            },
        },
    },
});

const startTime = Date.now();

healthRoutes.openapi(healthRoute, (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
    });
});
