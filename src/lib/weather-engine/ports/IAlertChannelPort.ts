/**
 * IAlertChannelPort - Port Interface
 * 
 * Interface for alert delivery channels (SMS, push, email).
 */

import { WeatherAlert, AlertChannel } from '../domain/entities/WeatherAlert';

export interface AlertDeliveryResult {
    alertId: string;
    channel: AlertChannel;
    success: boolean;
    deliveredAt?: Date;
    errorMessage?: string;
}

export interface IAlertChannelPort {
    /**
     * Send an alert through the channel
     */
    sendAlert(alert: WeatherAlert): Promise<AlertDeliveryResult>;

    /**
     * Check if channel is available for delivery
     */
    isAvailable(): Promise<boolean>;

    /**
     * Get channel type
     */
    getChannelType(): AlertChannel;
}
