import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { createRiskCalculationService, SiteCondition } from '../../src/lib/risk-engine/index.ts';

// --- World Context ---
let service: any;
let siteId: string = 'site-001';
let phase: any = 'grading';
let conditions: any = {
    slopePercent: 5,
    soilType: 'clay',
    daysSinceLastInspection: 1,
    historicalNOVCount: 0
};
let weather: any = {
    precipitationInchesNext24h: 0,
    precipitationInchesNext48h: 0,
    precipitationInchesNext72h: 0
};
let analysisResult: any;
let forecastResult: any;

Before(() => {
    service = createRiskCalculationService();
    analysisResult = null;
    forecastResult = null;
    weather = {
        precipitationInchesNext24h: 0,
        precipitationInchesNext48h: 0,
        precipitationInchesNext72h: 0
    };
});

// --- Given ---
Given('a construction site with id {string}', (id: string) => {
    siteId = id;
});

Given('the site is in the {string} phase', (p: string) => {
    phase = p;
});

Given('site conditions:', (dataTable: any) => {
    const data = dataTable.rowsHash();
    if (data.slope_percent) conditions.slopePercent = Number(data.slope_percent);
    if (data.soil_type) conditions.soilType = data.soil_type;
    if (data.days_since_inspect) conditions.daysSinceLastInspection = Number(data.days_since_inspect);
});

Given(/weather forecast shows ([\d.]+) inch(?:es)? rain in (\d+) hours/, (inches: number, hours: number) => {
    // Fill all horizons up to the specified hours for testing logic
    if (hours >= 24) weather.precipitationInchesNext24h = Math.max(weather.precipitationInchesNext24h, inches);
    if (hours >= 48) weather.precipitationInchesNext48h = Math.max(weather.precipitationInchesNext48h, inches);
    if (hours >= 72) weather.precipitationInchesNext72h = Math.max(weather.precipitationInchesNext72h, inches);
});

Given('weather forecast shows no precipitation', () => {
    weather = {
        precipitationInchesNext24h: 0,
        precipitationInchesNext48h: 0,
        precipitationInchesNext72h: 0
    };
});

Given('the contractor has {int} NOVs in the past 12 months', (count: number) => {
    conditions.historicalNOVCount = count;
});

Given('site conditions are otherwise moderate', () => {
    conditions.slopePercent = 10;
    conditions.soilType = 'sandy';
});

Given('current site conditions', () => {
    // defaults
});

// --- When ---
When('I calculate the risk score', () => {
    const site = SiteCondition.create({
        siteId,
        phase,
        slopePercent: conditions.slopePercent,
        soilType: conditions.soilType,
        acreage: 5.0,
        daysSinceLastInspection: conditions.daysSinceLastInspection,
        bmpInventory: [],
        historicalNOVCount: conditions.historicalNOVCount,
        observedAt: new Date()
    });

    // We calculate for the 24h horizon if current rain is in 24h, otherwise 48h
    analysisResult = service.calculateRisk({ siteCondition: site, weather }, 24);
});

When('I request a 72-hour risk forecast', () => {
    const site = SiteCondition.create({
        siteId,
        phase,
        slopePercent: conditions.slopePercent,
        soilType: conditions.soilType,
        acreage: 5.0,
        daysSinceLastInspection: conditions.daysSinceLastInspection,
        bmpInventory: [],
        historicalNOVCount: conditions.historicalNOVCount,
        observedAt: new Date()
    });

    forecastResult = service.calculateForecast({ siteCondition: site, weather });
});

// --- Then ---
Then('the score should be greater than {int}', (val: number) => {
    expect(analysisResult.score).toBeGreaterThan(val);
});

Then('the risk level should be {string}', (level: string) => {
    // level is determined by score in RiskScore.level
    expect(analysisResult.level).toBe(level);
});

Then('the top preventive action should be {string}', (action: string) => {
    const topAction = analysisResult.actions[0]?.action;
    expect(topAction).toBe(action);
});

Then('the score should be between {int} and {int}', (min: number, max: number) => {
    expect(analysisResult.score).toBeGreaterThanOrEqual(min);
    expect(analysisResult.score).toBeLessThanOrEqual(max);
});

Then('the score should be less than {int}', (val: number) => {
    expect(analysisResult.score).toBeLessThan(val);
});

Then('the score should be increased by at least {int} points', (val: number) => {
    // Baseline test without NOV
    const baseSite = SiteCondition.create({
        siteId,
        phase,
        slopePercent: conditions.slopePercent,
        soilType: conditions.soilType,
        acreage: 5.0,
        daysSinceLastInspection: conditions.daysSinceLastInspection,
        bmpInventory: [],
        historicalNOVCount: 0,
        observedAt: new Date()
    });
    const baseResult = service.calculateRisk({ siteCondition: baseSite, weather }, 24);
    expect(analysisResult.score - baseResult.score).toBeGreaterThanOrEqual(val);
});

Then('the risk factors should include {string}', (factor: string) => {
    const hasFactor = analysisResult.factors.some((f: any) => f.name.toLowerCase().includes(factor.toLowerCase()));
    expect(hasFactor, `Expected factor ${factor}`).toBe(true);
});

Then('the result should include exactly {int} preventive actions', (count: number) => {
    expect(analysisResult.actions.length).toBe(count);
});

Then('each action should have a priority rank', () => {
    analysisResult.actions.forEach((a: any) => expect(a.priority).toBeDefined());
});

Then('each action should be achievable within 24 hours', () => {
    analysisResult.actions.forEach((a: any) => expect(a.estimatedTimeHours).toBeLessThanOrEqual(24));
});

Then('I should receive risk scores for 24, 48, and 72 hour horizons', () => {
    const horizons = forecastResult.map((f: any) => f.horizonHours);
    expect(horizons).toContain(24);
    expect(horizons).toContain(48);
    expect(horizons).toContain(72);
});

Then('each horizon should have its own preventive actions', () => {
    forecastResult.forEach((f: any) => expect(f.actions.length).toBeGreaterThan(0));
});
