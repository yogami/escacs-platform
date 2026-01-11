/**
 * AlertScheduler - Domain Service
 * 
 * Manages the timing and delivery of alerts across channels.
 */

import { WeatherAlert } from '../entities/WeatherAlert';
import type { IAlertChannelPort } from '../../ports/IAlertChannelPort';

export class AlertScheduler {
    private readonly channels: IAlertChannelPort[];

    constructor(channels: IAlertChannelPort[]) {
        this.channels = channels;
    }

    /**
     * Schedule and deliver a batch of alerts
     */
    async processAlerts(alerts: WeatherAlert[]): Promise<void> {
        const pendingAlerts = alerts.filter(a => a.isPending());

        await Promise.all(
            pendingAlerts.map(async (alert) => {
                const channel = this.channels.find(c => c.getChannelType() === alert.channel);

                if (!channel) {
                    console.error(`No channel found for ${alert.channel}`);
                    alert.markFailed();
                    return;
                }

                try {
                    const result = await channel.sendAlert(alert);
                    if (result.success) {
                        alert.markDelivered();
                    } else {
                        alert.markFailed();
                    }
                } catch (error) {
                    console.error(`Failed to send alert ${alert.id}:`, error);
                    alert.markFailed();
                }
            })
        );
    }

    /**
     * Filter alerts by priority
     */
    getHighPriorityAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
        return alerts.filter(a => a.priority === 'high' || a.priority === 'critical');
    }
}
