/**
 * NoaaApiAdapter - Infrastructure Adapter
 * 
 * Implementation of NOAA/NWS API for live weather data.
 */

import type {
    IWeatherDataPort,
    HourlyForecast,
    WeatherForecast
} from '../ports/IWeatherDataPort';

export class NoaaApiAdapter implements IWeatherDataPort {
    private readonly baseUrl = 'https://api.weather.gov';
    private readonly userAgent: string;

    constructor(email: string = 'escacs@berlinailabs.de') {
        this.userAgent = `(escacs-platform, ${email})`;
    }

    async getHourlyForecast(
        latitude: number,
        longitude: number,
        hoursAhead: number = 72
    ): Promise<HourlyForecast> {
        // Step 1: Get metadata for coordinates to find the grid point and forecast URL
        const pointResponse = await fetch(`${this.baseUrl}/points/${latitude},${longitude}`, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!pointResponse.ok) {
            throw new Error(`NOAA API point lookup failed: ${pointResponse.statusText}`);
        }

        const pointData = await pointResponse.json();
        const forecastUrl = pointData.properties.forecastHourly;

        // Step 2: Fetch the actual hourly forecast
        const forecastResponse = await fetch(forecastUrl, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!forecastResponse.ok) {
            throw new Error(`NOAA API forecast fetch failed: ${forecastResponse.statusText}`);
        }

        const forecastData = await forecastResponse.json();
        const periods = forecastData.properties.periods.slice(0, hoursAhead);

        const forecasts: WeatherForecast[] = periods.map((p: any) => ({
            timestamp: new Date(p.startTime),
            // NOAA Hourly API doesn't always provide raw precipitation inches per hour values.
            // We use probability and quantitative estimates where available or mock for demo logic.
            // In a real production scenario, we'd use the NWS Raster data for high precision.
            precipitationInchesPerHour: p.probabilityOfPrecipitation?.value ? (p.probabilityOfPrecipitation.value / 100) * 0.1 : 0,
            temperature: p.temperature,
            windSpeed: parseFloat(p.windSpeed),
            humidity: p.relativeHumidity?.value || 0,
        }));

        const now = new Date();
        return {
            siteId: `noaa-${latitude}-${longitude}`,
            latitude,
            longitude,
            forecasts,
            fetchedAt: now,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour cache
        };
    }

    async getCurrentPrecipitation(
        latitude: number,
        longitude: number
    ): Promise<number> {
        // For real-time current precip, NOAA/NWS usually requires station observations
        const forecast = await this.getHourlyForecast(latitude, longitude, 1);
        return forecast.forecasts[0]?.precipitationInchesPerHour || 0;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(this.baseUrl, {
                headers: { 'User-Agent': this.userAgent }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
