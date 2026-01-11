/**
 * ESCACS API Server
 * 
 * Hono-based API with OpenAPI documentation.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import path from 'node:path';
import fs from 'node:fs';

import { healthRoutes } from './routes/health';
import { weatherRoutes } from './routes/weather';
import { inspectionsRoutes } from './routes/inspections';
import { riskRoutes } from './routes/risk';
import { reportsRoutes } from './routes/reports';
import process from 'node:process';

const app = new OpenAPIHono();

// Middleware
app.use('*', cors());

// Mount routes
app.route('/api', healthRoutes);
app.route('/api', weatherRoutes);
app.route('/api', inspectionsRoutes);
app.route('/api', riskRoutes);
app.route('/api/reports', reportsRoutes);

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
const port = parseInt(process.env.PORT || '3042', 10);

// Static files (frontend)
app.use('/*', serveStatic({ root: './dist' }));

// Fallback for SPA routing
app.get('*', (c) => {
    const indexPath = path.resolve('./dist/index.html');
    if (fs.existsSync(indexPath)) {
        return c.html(fs.readFileSync(indexPath, 'utf-8'));
    }
    return c.text('API is running. UI build not found.', 404);
});

console.log(`🚀 ESCACS API starting on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

export default app;
