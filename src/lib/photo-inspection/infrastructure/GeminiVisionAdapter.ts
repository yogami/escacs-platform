/**
 * GeminiVisionAdapter - Infrastructure Adapter
 * 
 * Gemini 1.5 Pro Vision API adapter for BMP defect detection.
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

export class GeminiVisionAdapter implements IVisionApiPort {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? process.env.GOOGLE_AI_API_KEY ?? '';
    }

    async analyzeImage(imageBase64: string, prompt: string): Promise<VisionAnalysisResult> {
        const startTime = Date.now();

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                    ],
                }],
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        return {
            modelId: 'gemini-1.5-pro',
            ...this.parseResponse(rawResponse),
            rawResponse,
            processingTimeMs: Date.now() - startTime,
        };
    }

    getModelId(): string {
        return 'gemini-1.5-pro';
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
