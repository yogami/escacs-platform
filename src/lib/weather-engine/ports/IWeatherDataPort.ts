/**
 * IWeatherDataPort - Port Interface
 * 
 * Interface for weather data providers (NOAA, local gauges).
 */

export interface WeatherForecast {
    timestamp: Date;
    precipitationInchesPerHour: number;
    temperature: number;
    windSpeed: number;
    humidity: number;
}

export interface HourlyForecast {
    siteId: string;
    latitude: number;
    longitude: number;
    forecasts: WeatherForecast[];
    fetchedAt: Date;
    expiresAt: Date;
}

export interface IWeatherDataPort {
    /**
     * Get hourly forecast for a location
     */
    getHourlyForecast(
        latitude: number,
        longitude: number,
        hoursAhead: number
    ): Promise<HourlyForecast>;

    /**
     * Get current precipitation rate
     */
    getCurrentPrecipitation(
        latitude: number,
        longitude: number
    ): Promise<number>;

    /**
     * Check if data source is available
     */
    isAvailable(): Promise<boolean>;
}
