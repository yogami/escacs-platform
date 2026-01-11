/**
 * ChecklistEngine Module
 * 
 * Digital inspection checklists and automated compliance reporting.
 */

// Entities
export { InspectionChecklist } from './domain/entities/InspectionChecklist';
export type {
    InspectionChecklistProps,
    ChecklistItem,
    ChecklistStatus
} from './domain/entities/InspectionChecklist';

// Factory
import { InspectionChecklist } from './domain/entities/InspectionChecklist';

export function createDigitalChecklist(siteId: string, inspectorId: string): InspectionChecklist {
    return InspectionChecklist.create({
        id: crypto.randomUUID(),
        siteId,
        inspectorId,
        scheduledAt: new Date(),
        items: [
            {
                id: 'item-1',
                category: 'erosion_control',
                question: 'Are all slopes stabilized?',
                response: 'compliant',
                photoIds: [],
            },
            {
                id: 'item-2',
                category: 'sediment_control',
                question: 'Is the silt fence intact?',
                response: 'compliant',
                photoIds: [],
            },
            {
                id: 'item-3',
                category: 'pollution_prevention',
                question: 'Are concrete washouts properly contained?',
                response: 'compliant',
                photoIds: [],
            },
        ],
    });
}
