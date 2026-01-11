/**
 * MockNoaaAdapter - Infrastructure Adapter
 * 
 * Mock implementation of NOAA weather data for development/testing.
 */

import type { IWeatherDataPort, HourlyForecast, WeatherForecast } from '../ports/IWeatherDataPort';

export class MockNoaaAdapter implements IWeatherDataPort {
    private mockScenario: 'clear' | 'light_rain' | 'heavy_rain' | 'storm' = 'clear';

    setMockScenario(scenario: 'clear' | 'light_rain' | 'heavy_rain' | 'storm'): void {
        this.mockScenario = scenario;
    }

    async getHourlyForecast(
        latitude: number,
        longitude: number,
        hoursAhead: number
    ): Promise<HourlyForecast> {
        const forecasts: WeatherForecast[] = [];
        const now = new Date();

        for (let i = 0; i < hoursAhead; i++) {
            const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
            forecasts.push({
                timestamp,
                precipitationInchesPerHour: this.getPrecipitation(i),
                temperature: 65 + Math.random() * 10,
                windSpeed: 5 + Math.random() * 15,
                humidity: 60 + Math.random() * 30,
            });
        }

        return {
            siteId: `site-${latitude}-${longitude}`,
            latitude,
            longitude,
            forecasts,
            fetchedAt: now,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour cache
        };
    }

    async getCurrentPrecipitation(
        _latitude: number,
        _longitude: number
    ): Promise<number> {
        switch (this.mockScenario) {
            case 'clear':
                return 0;
            case 'light_rain':
                return 0.2;
            case 'heavy_rain':
                return 0.8;
            case 'storm':
                return 1.5;
        }
    }

    async isAvailable(): Promise<boolean> {
        return true;
    }

    private getPrecipitation(hoursFromNow: number): number {
        switch (this.mockScenario) {
            case 'clear':
                return 0;
            case 'light_rain':
                return hoursFromNow >= 3 && hoursFromNow <= 8 ? 0.3 : 0;
            case 'heavy_rain':
                return hoursFromNow >= 3 && hoursFromNow <= 6 ? 0.7 : 0;
            case 'storm':
                return hoursFromNow >= 3 && hoursFromNow <= 4 ? 1.2 : 0;
        }
    }
}
