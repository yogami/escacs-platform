/**
 * ClaudeVisionAdapter - Infrastructure Adapter
 * 
 * Claude 3.5 Sonnet Vision API adapter for BMP defect detection.
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

export class ClaudeVisionAdapter implements IVisionApiPort {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
    }

    async analyzeImage(imageBase64: string, prompt: string): Promise<VisionAnalysisResult> {
        const startTime = Date.now();

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2024-01-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                        { type: 'text', text: prompt },
                    ],
                }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.content?.[0]?.text ?? '';

        return {
            modelId: 'claude-3-5-sonnet',
            ...this.parseResponse(rawResponse),
            rawResponse,
            processingTimeMs: Date.now() - startTime,
        };
    }

    getModelId(): string {
        return 'claude-3-5-sonnet';
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
