/**
 * OpenAIVisionAdapter - Infrastructure Adapter
 * 
 * GPT-4o Vision API adapter for BMP defect detection.
 */

import type { IVisionApiPort, VisionAnalysisResult, VisionDetection } from '../ports/IVisionApiPort';
import type { DefectClass } from '../domain/entities/BMPDefect';

const DEFECT_CLASSES: DefectClass[] = [
    'silt_fence_tear',
    'silt_fence_overtopping',
    'silt_fence_gap',
    'inlet_clogged',
    'inlet_bypassed',
    'inlet_overflow',
    'sediment_tracking',
    'bare_soil',
    'perimeter_gap',
    'construction_entrance_rutting',
];

export class OpenAIVisionAdapter implements IVisionApiPort {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? '';
    }

    async analyzeImage(imageBase64: string, prompt: string): Promise<VisionAnalysisResult> {
        const startTime = Date.now();

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                        },
                    ],
                }],
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.choices?.[0]?.message?.content ?? '';

        return {
            modelId: 'gpt-4o',
            ...this.parseResponse(rawResponse),
            rawResponse,
            processingTimeMs: Date.now() - startTime,
        };
    }

    getModelId(): string {
        return 'gpt-4o';
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey.length > 0;
    }

    private parseResponse(rawResponse: string): {
        detections: VisionDetection[];
        isCompliant: boolean;
        confidence: number;
    } {
        try {
            // Extract JSON from response
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return { detections: [], isCompliant: true, confidence: 0.5 };
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const detections: VisionDetection[] = [];

            if (parsed.defects && Array.isArray(parsed.defects)) {
                for (const defect of parsed.defects) {
                    const defectClass = this.normalizeDefectClass(defect.type || defect.class);
                    detections.push({
                        defectClass,
                        confidence: defect.confidence ?? 0.8,
                        severity: this.normalizeSeverity(defect.severity),
                        description: defect.description,
                        boundingBox: defect.boundingBox || defect.location,
                    });
                }
            }

            return {
                detections,
                isCompliant: detections.length === 0,
                confidence: parsed.confidence ?? 0.8,
            };
        } catch {
            return { detections: [], isCompliant: true, confidence: 0.5 };
        }
    }

    private normalizeDefectClass(raw: string): DefectClass | 'unknown' {
        const normalized = raw?.toLowerCase().replace(/[\s-]/g, '_');
        return DEFECT_CLASSES.includes(normalized as DefectClass)
            ? (normalized as DefectClass)
            : 'unknown';
    }

    private normalizeSeverity(raw: string): 'low' | 'medium' | 'high' | 'critical' {
        const normalized = raw?.toLowerCase();
        if (['critical', 'severe'].includes(normalized)) return 'critical';
        if (['high', 'serious'].includes(normalized)) return 'high';
        if (['medium', 'moderate'].includes(normalized)) return 'medium';
        return 'low';
    }
}
