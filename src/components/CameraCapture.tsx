import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera as CameraIcon,
    RotateCcw,
    Check,
    X,
    Loader2,
    AlertCircle,
    ShieldAlert,
    ChevronRight
} from 'lucide-react';

interface AnalysisResult {
    photoId: string;
    defects: Array<{
        id: string;
        defectClass: string;
        confidence: number;
        severity: string;
        recommendedAction: string | null;
    }>;
    isCompliant: boolean;
    requiresManualReview: boolean;
    processingTimeMs: number;
}

export const CameraCapture: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError('Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setPhoto(dataUrl);
                stopCamera();
            }
        }
    };

    const analyzePhoto = async () => {
        if (!photo) return;

        setIsAnalyzing(true);
        setResult(null);

        try {
            const base64Data = photo.split(',')[1];
            const response = await fetch('/api/inspections/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: 'site-demo-1',
                    inspectorId: 'insp-123',
                    imageBase64: base64Data,
                }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError('Analysis engine unavailable. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const reset = () => {
        setPhoto(null);
        setResult(null);
        setError(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-md">
                <h2 className="text-white font-bold tracking-tight flex items-center gap-2">
                    <CameraIcon size={20} className="text-primary" />
                    BMP Inspection
                </h2>
                <button onClick={() => { stopCamera(); onComplete?.(); }} className="text-white/50">
                    <X size={24} />
                </button>
            </div>

            {/* Viewport */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900">
                <AnimatePresence mode="wait">
                    {!photo ? (
                        <motion.div
                            key="camera"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                <div className="w-full h-full border border-white/20 rounded-lg flex items-center justify-center">
                                    <div className="w-12 h-12 border-t-2 border-l-2 border-primary/50 absolute top-0 left-0" />
                                    <div className="w-12 h-12 border-t-2 border-r-2 border-primary/50 absolute top-0 right-0" />
                                    <div className="w-12 h-12 border-b-2 border-l-2 border-primary/50 absolute bottom-0 left-0" />
                                    <div className="w-12 h-12 border-b-2 border-r-2 border-primary/50 absolute bottom-0 right-0" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full h-full"
                        >
                            <img src={photo} className="w-full h-full object-cover" alt="Captured BMP" />
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <Loader2 size={48} className="text-primary animate-spin" />
                                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-primary font-bold tracking-widest uppercase text-xs">AI Neural Analysis</p>
                                        <p className="text-white/60 text-[10px]">Detecting BMP failures...</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="absolute top-4 left-4 right-4 p-4 bg-danger/20 border border-danger/40 rounded-xl backdrop-blur-md flex items-center gap-3">
                        <AlertCircle className="text-danger" size={20} />
                        <p className="text-white text-xs">{error}</p>
                    </div>
                )}
            </div>

            {/* Results / Controls Overlay */}
            <div className="bg-black/80 backdrop-blur-2xl p-6 pb-12 border-t border-white/10">
                <AnimatePresence>
                    {result && !isAnalyzing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {result.isCompliant ? (
                                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                                            <Check className="text-success" size={16} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                                            <ShieldAlert className="text-danger" size={16} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-white font-bold text-sm">
                                            {result.isCompliant ? 'Compliant' : 'Defects Detected'}
                                        </h3>
                                        <p className="text-white/40 text-[10px]">Processed in {result.processingTimeMs}ms</p>
                                    </div>
                                </div>
                                {result.requiresManualReview && (
                                    <span className="status-badge high h-fit">Manual Review Required</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {result.defects.map(defect => (
                                    <div key={defect.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-white font-medium text-xs capitalize">
                                                    {defect.defectClass.replace(/_/g, ' ')}
                                                </span>
                                                <span className={`status-badge ${defect.severity} text-[8px] py-0.5`}>
                                                    {defect.severity}
                                                </span>
                                            </div>
                                            <p className="text-white/60 text-[10px] italic">"{defect.recommendedAction}"</p>
                                        </div>
                                        <ChevronRight size={16} className="text-white/20 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-around items-center">
                    {!photo ? (
                        <button
                            onClick={takePhoto}
                            className="nav-center-btn"
                            style={{ top: 0, position: 'relative' }}
                        >
                            <CameraIcon size={32} color="black" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={reset}
                                className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/50"
                            >
                                <RotateCcw size={24} />
                            </button>

                            {!result && (
                                <button
                                    onClick={analyzePhoto}
                                    disabled={isAnalyzing}
                                    className="px-8 py-4 bg-primary rounded-full text-black font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(0,242,255,0.4)] disabled:opacity-50"
                                >
                                    Analyze
                                </button>
                            )}

                            {result && (
                                <button
                                    onClick={onComplete}
                                    className="w-14 h-14 rounded-full bg-success flex items-center justify-center text-black"
                                >
                                    <Check size={24} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
