# ESCACS Platform

> **Erosion & Sediment Control Auto-Compliance System** - AI-native stormwater compliance platform for construction sites.

## 🏛️ Architectural Anchor
This project follows the [Berlin AI Studio RULES.md](../RULES.md) and registers with the [Microservices Catalog](../Microservices_Catalog.md).

## 🎯 Strategic Pillar
**Urban Resilience & Safety** - Tools for high-stakes urban and construction environments.

---

## 📡 API Manifest

| Endpoint | Description |
|:---------|:------------|
| `GET /api/health` | Health check |
| `GET /api/openapi.json` | OpenAPI 3.0 specification |
| `GET /api/docs` | Swagger UI |
| `GET /api/weather/forecast` | Weather forecast data |
| `POST /api/inspections/analyze` | AI photo analysis |
| `GET /api/risk/score/:siteId` | Violation risk score |

---

## 🚀 Setup & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start API server
npm run api
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# End-to-end tests
npm run test:e2e

# Acceptance tests (Cucumber)
npm run test:acceptance
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
src/
├── api/                     # Hono API routes
├── components/              # React UI components
├── lib/
│   ├── weather-engine/      # Weather triggers module
│   ├── photo-inspection/    # AI photo analysis
│   ├── risk-engine/         # Violation risk scoring
│   └── checklist-engine/    # Digital inspection checklists
└── main.tsx

tests/
├── acceptance/              # Cucumber .feature files
├── step-definitions/        # Gherkin step implementations
├── unit/                    # Vitest unit tests
└── e2e/                     # Playwright E2E tests
```

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://...
NOAA_API_KEY=...
MAPBOX_TOKEN=...
SERVICE_DISCOVERY_MODE=local|production
CAPABILITY_BROKER_URL=https://studio-service-directory-production.up.railway.app
```
