import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    TrendingUp,
    ShieldCheck,
    MapPin,
    Clock,
    ChevronRight,
    Zap,
    Droplets
} from 'lucide-react';

interface RiskFactor {
    name: string;
    contribution: number;
    description: string;
    icon: React.ReactNode;
}

const MOCK_FACTORS: RiskFactor[] = [
    { name: 'Heavy Rain', contribution: 30, description: '1.2" predicted in next 12h', icon: <Droplets size={16} /> },
    { name: 'Steep Slopes', contribution: 15, description: 'Acreage > 15% grade exposed', icon: <TrendingUp size={16} /> },
    { name: 'Erodible Soils', contribution: 12, description: 'Sandy loam prevalence detected', icon: <Zap size={16} /> },
    { name: 'Inspection Overdue', contribution: 10, description: '72h since last physical audit', icon: <Clock size={16} /> },
];

export const RiskAnalysis: React.FC<{ siteId?: string, onComplete?: () => void }> = ({ onComplete }) => {
    const totalScore = MOCK_FACTORS.reduce((acc, f) => acc + f.contribution, 0);

    const getLevel = (score: number) => {
        if (score > 75) return { label: 'CRITICAL', color: 'danger' };
        if (score > 50) return { label: 'HIGH', color: 'warning' };
        return { label: 'MODERATE', color: 'success' };
    };

    const level = getLevel(totalScore);

    return (
        <div className="fixed inset-0 z-50 bg-bg-dark overflow-y-auto pb-32">
            {/* Background Glow */}
            <div className={`fixed top-0 left-0 w-full h-[50vh] transition-all duration-1000 bg-gradient-to-b from-${level.color}/20 to-transparent pointer-events-none`} />

            {/* Header */}
            <div className="relative p-6 flex justify-between items-start">
                <button onClick={onComplete} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <ChevronRight className="text-white/40 rotate-180" size={24} />
                </button>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                        <MapPin size={14} className="text-primary" />
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Berlin North Heights</span>
                    </div>
                    <p className="text-white/40 text-[10px]">ID: Site-A24-B9</p>
                </div>
            </div>

            {/* Hero Score */}
            <div className="relative px-6 py-12 flex flex-col items-center">
                <div className="relative group">
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                            cx="96" cy="96" r="88"
                            className="stroke-white/5 fill-none"
                            strokeWidth="4"
                        />
                        <motion.circle
                            initial={{ strokeDasharray: "0 553" }}
                            animate={{ strokeDasharray: `${(totalScore / 100) * 553} 553` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="96" cy="96" r="88"
                            className={`stroke-${level.color} fill-none`}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-white text-6xl font-black tracking-tighter"
                        >
                            {totalScore}
                        </motion.span>
                        <span className={`status-badge ${level.color} shadow-lg shadow-${level.color}/20`}>
                            {level.label}
                        </span>
                    </div>
                </div>
                <p className="mt-8 text-white/40 text-[10px] text-center max-w-[200px] uppercase font-bold tracking-[0.2em]">Violation Probability Index</p>
            </div>

            {/* Intelligence Breakdown */}
            <div className="px-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-primary" />
                    <h3 className="text-white font-bold text-sm">Risk Intelligence</h3>
                </div>

                <div className="space-y-3">
                    {MOCK_FACTORS.map((factor, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            key={factor.name}
                            className="premium-card bg-black/40 p-4 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                                {factor.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-white text-xs font-bold">{factor.name}</h4>
                                    <span className="text-white/40 text-[10px] font-mono">+{factor.contribution} pts</span>
                                </div>
                                <p className="text-white/40 text-[10px] leading-relaxed line-clamp-1">{factor.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Recommended Actions */}
            <div className="px-6 mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-success" />
                    <h3 className="text-white font-bold text-sm">Priority Mitigation</h3>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xs">1</div>
                        <div>
                            <p className="text-white text-xs font-bold mb-1">Cover Exposure Areas</p>
                            <p className="text-white/50 text-[10px] leading-relaxed">Forecast intensity requires plastic covering or immediate straw mulch application at Basin A.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xs">2</div>
                        <div>
                            <p className="text-white text-xs font-bold mb-1">Reinforce Silt Fence</p>
                            <p className="text-white/50 text-[10px] leading-relaxed">Check structural integrity of perimeter at downslope stations before T-0 (3 hours).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-0 left-0 w-full p-6 pb-12 bg-gradient-to-t from-black via-black/90 to-transparent">
                <button
                    onClick={onComplete}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 transition-all"
                >
                    Return to Monitor
                </button>
            </div>
        </div>
    );
};
