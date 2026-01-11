/**
 * Risk Routes
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createRiskCalculationService, SiteCondition } from '../../lib/risk-engine';

export const riskRoutes = new OpenAPIHono();

const riskScoreSchema = z.object({
    id: z.string(),
    siteId: z.string(),
    score: z.number(),
    level: z.enum(['low', 'moderate', 'high', 'critical']),
    factors: z.array(z.object({
        name: z.string(),
        contribution: z.number(),
        description: z.string(),
    })),
    actions: z.array(z.object({
        action: z.string(),
        priority: z.number(),
        estimatedTimeHours: z.number(),
    })),
    horizonHours: z.number(),
    calculatedAt: z.string(),
    expiresAt: z.string(),
});

const calculateRiskRoute = createRoute({
    method: 'post',
    path: '/risk/calculate',
    tags: ['Risk'],
    summary: 'Calculate violation risk score for a site',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        siteId: z.string(),
                        phase: z.enum(['clearing', 'grading', 'paving', 'stabilization', 'completed']),
                        slopePercent: z.number(),
                        soilType: z.enum(['sandy', 'loam', 'clay', 'rocky']),
                        acreage: z.number(),
                        daysSinceLastInspection: z.number(),
                        historicalNOVCount: z.number().optional().default(0),
                        weather: z.object({
                            precipitationInchesNext24h: z.number(),
                            precipitationInchesNext48h: z.number(),
                            precipitationInchesNext72h: z.number(),
                        }),
                        horizonHours: z.enum(['24', '48', '72']).optional().default('48'),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Risk score result',
            content: {
                'application/json': {
                    schema: riskScoreSchema,
                },
            },
        },
    },
});

const getForecastRoute = createRoute({
    method: 'post',
    path: '/risk/forecast',
    tags: ['Risk'],
    summary: 'Get 72-hour risk forecast',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        siteId: z.string(),
                        phase: z.enum(['clearing', 'grading', 'paving', 'stabilization', 'completed']),
                        slopePercent: z.number(),
                        soilType: z.enum(['sandy', 'loam', 'clay', 'rocky']),
                        acreage: z.number(),
                        daysSinceLastInspection: z.number(),
                        historicalNOVCount: z.number().optional().default(0),
                        weather: z.object({
                            precipitationInchesNext24h: z.number(),
                            precipitationInchesNext48h: z.number(),
                            precipitationInchesNext72h: z.number(),
                        }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Risk forecast for 24/48/72 hour horizons',
            content: {
                'application/json': {
                    schema: z.object({
                        forecasts: z.array(riskScoreSchema),
                    }),
                },
            },
        },
    },
});

riskRoutes.openapi(calculateRiskRoute, async (c) => {
    const body = c.req.valid('json');
    const service = createRiskCalculationService();

    const siteCondition = SiteCondition.create({
        siteId: body.siteId,
        phase: body.phase,
        slopePercent: body.slopePercent,
        soilType: body.soilType,
        acreage: body.acreage,
        daysSinceLastInspection: body.daysSinceLastInspection,
        bmpInventory: [],
        historicalNOVCount: body.historicalNOVCount || 0,
        observedAt: new Date(),
    });

    const riskScore = service.calculateRisk(
        { siteCondition, weather: body.weather },
        parseInt(body.horizonHours, 10) as 24 | 48 | 72
    );

    return c.json({
        id: riskScore.id,
        siteId: riskScore.siteId,
        score: riskScore.score,
        level: riskScore.level,
        factors: riskScore.factors,
        actions: riskScore.actions,
        horizonHours: riskScore.horizonHours,
        calculatedAt: riskScore.calculatedAt.toISOString(),
        expiresAt: riskScore.expiresAt.toISOString(),
    });
});

riskRoutes.openapi(getForecastRoute, async (c) => {
    const body = c.req.valid('json');
    const service = createRiskCalculationService();

    const siteCondition = SiteCondition.create({
        siteId: body.siteId,
        phase: body.phase,
        slopePercent: body.slopePercent,
        soilType: body.soilType,
        acreage: body.acreage,
        daysSinceLastInspection: body.daysSinceLastInspection,
        bmpInventory: [],
        historicalNOVCount: body.historicalNOVCount || 0,
        observedAt: new Date(),
    });

    const forecasts = service.calculateForecast({ siteCondition, weather: body.weather });

    return c.json({
        forecasts: forecasts.map(f => ({
            id: f.id,
            siteId: f.siteId,
            score: f.score,
            level: f.level,
            factors: f.factors,
            actions: f.actions,
            horizonHours: f.horizonHours,
            calculatedAt: f.calculatedAt.toISOString(),
            expiresAt: f.expiresAt.toISOString(),
        })),
    });
});
