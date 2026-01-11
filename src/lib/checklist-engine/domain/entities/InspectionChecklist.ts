/**
 * InspectionChecklist - Domain Entity
 * 
 * Represents a digital compliance checklist for a specific site.
 */

export type ChecklistStatus = 'draft' | 'in_progress' | 'completed' | 'submitted';

export interface ChecklistItem {
    id: string;
    category: 'erosion_control' | 'sediment_control' | 'pollution_prevention' | 'administrative';
    question: string;
    response: 'compliant' | 'non_compliant' | 'not_applicable';
    comment?: string;
    photoIds: string[];
}

export interface InspectionChecklistProps {
    id: string;
    siteId: string;
    inspectorId: string;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: ChecklistStatus;
    items: ChecklistItem[];
    overallCompliance: boolean;
}

export class InspectionChecklist {
    readonly id: string;
    readonly siteId: string;
    readonly inspectorId: string;
    readonly scheduledAt: Date;
    private _startedAt: Date | null;
    private _completedAt: Date | null;
    private _status: ChecklistStatus;
    private _items: ChecklistItem[];

    private constructor(props: InspectionChecklistProps) {
        this.id = props.id;
        this.siteId = props.siteId;
        this.inspectorId = props.inspectorId;
        this.scheduledAt = props.scheduledAt;
        this._startedAt = props.startedAt ?? null;
        this._completedAt = props.completedAt ?? null;
        this._status = props.status;
        this._items = props.items;
    }

    static create(props: Omit<InspectionChecklistProps, 'status' | 'overallCompliance'>): InspectionChecklist {
        return new InspectionChecklist({
            ...props,
            status: 'draft',
            overallCompliance: true,
        });
    }

    get items(): ChecklistItem[] {
        return [...this._items];
    }

    get status(): ChecklistStatus {
        return this._status;
    }

    get startedAt(): Date | null {
        return this._startedAt;
    }

    get completedAt(): Date | null {
        return this._completedAt;
    }

    /**
     * Update a checklist item response
     */
    updateItem(itemId: string, response: ChecklistItem['response'], comment?: string): void {
        const index = this._items.findIndex(i => i.id === itemId);
        if (index === -1) throw new Error(`Item ${itemId} not found`);

        this._items[index] = {
            ...this._items[index],
            response,
            comment,
        };

        if (this._status === 'draft') {
            this._status = 'in_progress';
            this._startedAt = new Date();
        }
    }

    /**
     * Check overall compliance
     */
    isOverallCompliant(): boolean {
        return !this._items.some(i => i.response === 'non_compliant');
    }

    /**
     * Complete the checklist
     */
    complete(): void {
        this._status = 'completed';
        this._completedAt = new Date();
    }

    /**
     * Add photo to item
     */
    addPhotoToItem(itemId: string, photoId: string): void {
        const index = this._items.findIndex(i => i.id === itemId);
        if (index === -1) throw new Error(`Item ${itemId} not found`);

        this._items[index].photoIds.push(photoId);
    }
}
