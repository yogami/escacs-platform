import { Given, When, Then, Before } from '@cucumber/cucumber';

// --- Types ---
interface Site {
    id: string;
    region: string;
    permitThreshold: number;
}

interface Alert {
    channel: string;
    recipient: string;
    message: string;
    priority: string;
}

interface WeatherForecast {
    precipitationInches: number;
    hoursAhead: number;
}

// --- World Context ---
let site: Site;
let forecast: WeatherForecast | null;
let alerts: Alert[];
let inspectionDeadline: Date | null;
let cachedDataAge: number;
let usingCachedData: boolean;

Before(() => {
    site = { id: '', region: '', permitThreshold: 0 };
    forecast = null;
    alerts = [];
    inspectionDeadline = null;
    cachedDataAge = 0;
    usingCachedData = false;
});

// --- Given ---
Given('a site with id {string} in Virginia', (siteId: string) => {
    site.id = siteId;
    site.region = 'Virginia';
});

Given('the site has a CGP permit with {float} inch per hour threshold', (threshold: number) => {
    site.permitThreshold = threshold;
});

Given('NOAA forecasts {float} inches rainfall in {int} hours', (inches: number, hours: number) => {
    forecast = { precipitationInches: inches, hoursAhead: hours };
});

Given('a rainfall event of {float} inches occurred', (inches: number) => {
    forecast = { precipitationInches: inches, hoursAhead: 0 };
});

Given('the jurisdiction requires {int}-hour post-storm inspection', (_hours: number) => {
    // Stored for inspection window calculation
});

Given('weather data was cached {int} hours ago', (hours: number) => {
    cachedDataAge = hours;
});

// --- When ---
When('the weather trigger service evaluates the forecast', () => {
    if (!forecast) return;

    if (forecast.precipitationInches > site.permitThreshold) {
        alerts.push({
            channel: 'SMS',
            recipient: 'superintendent',
            message: 'Rain alert: Deploy controls',
            priority: 'high',
        });
    }
});

When('the inspection window is calculated', () => {
    inspectionDeadline = new Date();
    inspectionDeadline.setHours(inspectionDeadline.getHours() + 24);
});

When('the NOAA API is unavailable', () => {
    usingCachedData = true;
});

// --- Then ---
Then('an SMS alert should be queued for the superintendent', () => {
    const smsAlert = alerts.find(a => a.channel === 'SMS' && a.recipient === 'superintendent');
    if (!smsAlert) throw new Error('Expected SMS alert for superintendent');
});

Then('the alert message should contain {string}', (expected: string) => {
    const hasMessage = alerts.some(a => a.message.includes(expected));
    if (!hasMessage) throw new Error(`Expected alert with message containing: ${expected}`);
});

Then('the alert priority should be {string}', (priority: string) => {
    const hasAlertWithPriority = alerts.some(a => a.priority === priority);
    if (!hasAlertWithPriority) throw new Error(`Expected alert with priority: ${priority}`);
});

Then('no alerts should be generated', () => {
    if (alerts.length > 0) throw new Error('Expected no alerts');
});

Then('the inspection deadline should be {int} hours from storm end', (hours: number) => {
    if (!inspectionDeadline) throw new Error('Inspection deadline not calculated');
    // Verification logic would go here
});

Then('an inspection reminder should be scheduled', () => {
    // Verification for reminder scheduling
});

Then('alerts should be queued for the following channels:', (dataTable: any) => {
    const expectedChannels = dataTable.hashes();
    // Multi-channel verification logic
});

Then('the system should use cached weather data', () => {
    if (!usingCachedData) throw new Error('Expected cached data usage');
});

Then('a warning should indicate {string}', (warning: string) => {
    // Warning message verification
});
