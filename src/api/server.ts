/**
 * ESCACS API Server
 * 
 * Hono-based API with OpenAPI documentation.
 */

import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

import { healthRoutes } from './routes/health';
import { weatherRoutes } from './routes/weather';
import { inspectionsRoutes } from './routes/inspections';
import { riskRoutes } from './routes/risk';

const app = new OpenAPIHono();

// Middleware
app.use('*', cors());

// Mount routes
app.route('/api', healthRoutes);
app.route('/api', weatherRoutes);
app.route('/api', inspectionsRoutes);
app.route('/api', riskRoutes);

// OpenAPI documentation
app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: {
        title: 'ESCACS Platform API',
        version: '1.0.0',
        description: 'Erosion & Sediment Control Auto-Compliance System API',
    },
    servers: [
        { url: 'http://localhost:3001', description: 'Development' },
    ],
});

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 ESCACS API starting on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

export default app;
