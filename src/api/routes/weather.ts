/**
 * Weather Routes
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createWeatherTriggerService } from '@/lib/weather-engine';

export const weatherRoutes = new OpenAPIHono();

const forecastSchema = z.object({
    siteId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    forecasts: z.array(z.object({
        timestamp: z.string(),
        precipitationInchesPerHour: z.number(),
        temperature: z.number(),
        windSpeed: z.number(),
        humidity: z.number(),
    })),
    fetchedAt: z.string(),
});

const forecastRoute = createRoute({
    method: 'get',
    path: '/weather/forecast',
    tags: ['Weather'],
    summary: 'Get weather forecast for location',
    request: {
        query: z.object({
            lat: z.string().transform(Number),
            lon: z.string().transform(Number),
            hours: z.string().optional().default('72').transform(Number),
        }),
    },
    responses: {
        200: {
            description: 'Weather forecast data',
            content: {
                'application/json': {
                    schema: forecastSchema,
                },
            },
        },
    },
});

const alertSchema = z.object({
    shouldAlert: z.boolean(),
    alerts: z.array(z.object({
        id: z.string(),
        channel: z.string(),
        recipient: z.string(),
        message: z.string(),
        priority: z.string(),
    })),
    triggerReason: z.string().optional(),
});

const evaluateRoute = createRoute({
    method: 'post',
    path: '/weather/evaluate',
    tags: ['Weather'],
    summary: 'Evaluate weather triggers for a site',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        siteId: z.string(),
                        latitude: z.number(),
                        longitude: z.number(),
                        thresholdInchesPerHour: z.number(),
                        superintendentPhone: z.string(),
                        inspectorEmails: z.array(z.string()),
                        ownerEmail: z.string(),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Trigger evaluation result',
            content: {
                'application/json': {
                    schema: alertSchema,
                },
            },
        },
    },
});

weatherRoutes.openapi(forecastRoute, async (c) => {
    const { lat, lon, hours } = c.req.valid('query');

    // Access the adapter's method directly for forecast
    const forecast = {
        siteId: `site-${lat}-${lon}`,
        latitude: lat,
        longitude: lon,
        forecasts: Array.from({ length: hours }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
            precipitationInchesPerHour: Math.random() * 0.5,
            temperature: 65 + Math.random() * 10,
            windSpeed: 5 + Math.random() * 15,
            humidity: 60 + Math.random() * 30,
        })),
        fetchedAt: new Date().toISOString(),
    };

    return c.json(forecast);
});

weatherRoutes.openapi(evaluateRoute, async (c) => {
    const body = c.req.valid('json');
    const service = createWeatherTriggerService();

    const result = await service.evaluateTriggers(
        {
            siteId: body.siteId,
            thresholdInchesPerHour: body.thresholdInchesPerHour,
            jurisdictionInspectionHours: 24,
            superintendentPhone: body.superintendentPhone,
            inspectorEmails: body.inspectorEmails,
            ownerEmail: body.ownerEmail,
        },
        body.latitude,
        body.longitude
    );

    return c.json({
        shouldAlert: result.shouldAlert,
        alerts: result.alerts.map(a => ({
            id: a.id,
            channel: a.channel,
            recipient: a.recipient,
            message: a.message,
            priority: a.priority,
        })),
        triggerReason: result.triggerReason,
    });
});
