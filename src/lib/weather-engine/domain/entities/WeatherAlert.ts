/**
 * WeatherAlert - Domain Entity
 * 
 * Multi-channel alert with delivery status tracking.
 */

export type AlertChannel = 'sms' | 'push' | 'email';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface WeatherAlertProps {
    id: string;
    siteId: string;
    channel: AlertChannel;
    recipient: string;
    recipientType: 'superintendent' | 'inspector' | 'owner' | 'resident_engineer';
    message: string;
    priority: AlertPriority;
    triggerEventId: string;
    createdAt: Date;
    status?: AlertStatus;
    sentAt?: Date;
    deliveredAt?: Date;
}

export class WeatherAlert {
    readonly id: string;
    readonly siteId: string;
    readonly channel: AlertChannel;
    readonly recipient: string;
    readonly recipientType: WeatherAlertProps['recipientType'];
    readonly message: string;
    readonly priority: AlertPriority;
    readonly triggerEventId: string;
    readonly createdAt: Date;
    private _status: AlertStatus;
    private _sentAt: Date | null;
    private _deliveredAt: Date | null;
    private _failureReason: string | null;

    private constructor(props: WeatherAlertProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.channel = props.channel;
        this.recipient = props.recipient;
        this.recipientType = props.recipientType;
        this.message = props.message;
        this.priority = props.priority;
        this.triggerEventId = props.triggerEventId;
        this.createdAt = props.createdAt;
        this._status = props.status ?? 'pending';
        this._sentAt = props.sentAt ?? null;
        this._deliveredAt = props.deliveredAt ?? null;
        this._failureReason = null;
    }

    static create(props: WeatherAlertProps): WeatherAlert {
        if (!props.recipient) {
            throw new Error('Recipient is required');
        }
        if (!props.message) {
            throw new Error('Message is required');
        }
        return new WeatherAlert(props);
    }

    get status(): AlertStatus {
        return this._status;
    }

    get sentAt(): Date | null {
        return this._sentAt;
    }

    get deliveredAt(): Date | null {
        return this._deliveredAt;
    }

    /**
     * Mark alert as sent
     */
    markSent(): void {
        this._status = 'sent';
        this._sentAt = new Date();
    }

    /**
     * Mark alert as delivered
     */
    markDelivered(): void {
        this._status = 'delivered';
        this._deliveredAt = new Date();
    }

    /**
     * Mark alert as failed with optional reason
     */
    markFailed(reason?: string): void {
        this._status = 'failed';
        this._failureReason = reason ?? null;
    }

    get failureReason(): string | null {
        return this._failureReason;
    }

    /**
     * Check if alert is pending
     */
    isPending(): boolean {
        return this._status === 'pending';
    }
}
