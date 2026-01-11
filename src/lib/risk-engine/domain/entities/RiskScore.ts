/**
 * RiskScore - Domain Entity
 * 
 * Represents a violation risk assessment for a construction site.
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface PreventiveAction {
    action: string;
    priority: number;
    estimatedTimeHours: number;
}

export interface RiskFactor {
    name: string;
    contribution: number;
    description: string;
}

export interface RiskScoreProps {
    id: string;
    siteId: string;
    score: number; // 0-100
    level: RiskLevel;
    factors: RiskFactor[];
    actions: PreventiveAction[];
    horizonHours: 24 | 48 | 72;
    calculatedAt: Date;
    expiresAt: Date;
}

export class RiskScore {
    readonly id: string;
    readonly siteId: string;
    readonly score: number;
    readonly level: RiskLevel;
    readonly factors: RiskFactor[];
    readonly actions: PreventiveAction[];
    readonly horizonHours: 24 | 48 | 72;
    readonly calculatedAt: Date;
    readonly expiresAt: Date;

    private constructor(props: RiskScoreProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.score = props.score;
        this.level = props.level;
        this.factors = props.factors;
        this.actions = props.actions;
        this.horizonHours = props.horizonHours;
        this.calculatedAt = props.calculatedAt;
        this.expiresAt = props.expiresAt;
    }

    static create(props: Omit<RiskScoreProps, 'level' | 'expiresAt'>): RiskScore {
        if (props.score < 0 || props.score > 100) {
            throw new Error('Score must be between 0 and 100');
        }

        const level = RiskScore.determineLevel(props.score);
        const expiresAt = new Date(props.calculatedAt);
        expiresAt.setHours(expiresAt.getHours() + 6); // Expires in 6 hours

        return new RiskScore({ ...props, level, expiresAt });
    }

    /**
     * Determine risk level from score
     */
    static determineLevel(score: number): RiskLevel {
        if (score >= 90) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 30) return 'moderate';
        return 'low';
    }

    /**
     * Check if risk score has expired
     */
    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    /**
     * Get top N preventive actions
     */
    getTopActions(count: number = 3): PreventiveAction[] {
        return [...this.actions]
            .sort((a, b) => a.priority - b.priority)
            .slice(0, count);
    }

    /**
     * Check if immediate action is required
     */
    requiresImmediateAction(): boolean {
        return this.level === 'critical' || this.level === 'high';
    }
}
