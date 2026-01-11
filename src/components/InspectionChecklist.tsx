import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Slash,
    ShieldCheck,
    Save,
    ChevronLeft
} from 'lucide-react';

interface ChecklistItem {
    id: string;
    category: string;
    question: string;
    response: 'compliant' | 'non_compliant' | 'not_applicable' | null;
}

const MOCK_ITEMS: ChecklistItem[] = [
    { id: '1', category: 'Erosion Control', question: 'All disturbed areas not being worked are stabilized?', response: null },
    { id: '2', category: 'Sediment Control', question: 'Silt fences are entrenched and upright?', response: null },
    { id: '3', category: 'Sediment Control', question: 'Inlet protection is in place and clear of debris?', response: null },
    { id: '4', category: 'Pollution Prevention', question: 'Concrete washout is contained and at capacity?', response: null },
    { id: '5', category: 'Administrative', question: 'SWPPP map is up to date and posted?', response: null },
];

export const InspectionChecklist: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const [items, setItems] = useState(MOCK_ITEMS);

    const updateResponse = (id: string, response: ChecklistItem['response']) => {
        setItems(items.map(item => item.id === id ? { ...item, response } : item));
    };

    const progress = (items.filter(i => i.response !== null).length / items.length) * 100;
    const categories = Array.from(new Set(items.map(i => i.category)));

    return (
        <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col">
            {/* HUD Header */}
            <div className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <ClipboardCheck className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-bold tracking-tight">Compliance Audit</h2>
                        <p className="text-primary/70 text-[10px] uppercase font-bold tracking-widest">Berlin North Heights • Basin A</p>
                    </div>
                </div>
                <button onClick={onComplete} className="p-2 text-white/40 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-white/5 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {categories.map((cat) => (
                    <div key={cat} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-6 h-px bg-primary/30" />
                            <h3 className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em]">{cat}</h3>
                        </div>

                        <AnimatePresence>
                            {items.filter(i => i.category === cat).map((item, itemIdx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: itemIdx * 0.1 }}
                                    key={item.id}
                                    className="premium-card p-5 space-y-4"
                                >
                                    <p className="text-white text-sm font-medium leading-relaxed">{item.question}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateResponse(item.id, 'compliant')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${item.response === 'compliant'
                                                    ? 'bg-success/20 border-success text-success shadow-[0_0_15px_rgba(0,255,153,0.3)]'
                                                    : 'bg-white/5 border-white/5 text-white/40'
                                                }`}
                                        >
                                            <CheckCircle2 size={18} />
                                            <span className="text-[10px] font-bold uppercase">Pass</span>
                                        </button>

                                        <button
                                            onClick={() => updateResponse(item.id, 'non_compliant')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${item.response === 'non_compliant'
                                                    ? 'bg-danger/20 border-danger text-danger shadow-[0_0_15px_rgba(255,51,102,0.3)]'
                                                    : 'bg-white/5 border-white/5 text-white/40'
                                                }`}
                                        >
                                            <XCircle size={18} />
                                            <span className="text-[10px] font-bold uppercase">Fail</span>
                                        </button>

                                        <button
                                            onClick={() => updateResponse(item.id, 'not_applicable')}
                                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${item.response === 'not_applicable'
                                                    ? 'bg-white/10 border-white/20 text-white'
                                                    : 'bg-white/5 border-white/5 text-white/40'
                                                }`}
                                        >
                                            <Slash size={18} />
                                            <span className="text-[10px] font-bold uppercase">N/A</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Footer Submission Overlay */}
            <AnimatePresence>
                {progress === 100 && (
                    <motion.div
                        initial={{ translateY: 100 }}
                        animate={{ translateY: 0 }}
                        exit={{ translateY: 100 }}
                        className="fixed bottom-0 left-0 w-full p-6 pb-12 bg-black/90 backdrop-blur-2xl border-t border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-success" size={20} />
                                <span className="text-white text-sm font-bold">Audit Complete</span>
                            </div>
                            <div className="text-right">
                                <p className="text-white/40 text-[10px]">Overall Compliance</p>
                                <p className="text-success text-lg font-black tracking-tighter">100% SECURE</p>
                            </div>
                        </div>

                        <button
                            onClick={onComplete}
                            className="w-full py-4 bg-primary rounded-2xl text-black font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_40px_rgba(0,242,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Finalize Audit
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
