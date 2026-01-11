import React, { useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Droplets,
    Map as MapIcon,
    Camera,
    Activity,
    ShieldCheck,
    Menu,
    Bell
} from 'lucide-react';

import { CameraCapture } from './CameraCapture';
import { InspectionChecklist } from './InspectionChecklist';
import { RiskAnalysis } from './RiskAnalysis';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Mock site data for the dashboard
const MOCK_SITES = [
    {
        id: 'site-1',
        name: 'Berlin North Heights',
        latitude: 52.5200,
        longitude: 13.4050,
        riskScore: 24,
        riskLevel: 'low' as const,
        precipInches: 0.05,
        lastInspection: '2h ago'
    },
    {
        id: 'site-2',
        name: 'Alexanderplatz Tower Complex',
        latitude: 52.5219,
        longitude: 13.4132,
        riskScore: 68,
        riskLevel: 'high' as const,
        precipInches: 0.45,
        lastInspection: '12h ago'
    },
    {
        id: 'site-3',
        name: 'Spree Waterfront Residences',
        latitude: 52.5074,
        longitude: 13.4300,
        riskScore: 82,
        riskLevel: 'critical' as const,
        precipInches: 1.10,
        lastInspection: '1h ago'
    }
];

type ViewMode = 'map' | 'scan' | 'checklist' | 'risk';

export const MapDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [viewState, setViewState] = useState({
        latitude: 52.52,
        longitude: 13.405,
        zoom: 12
    });

    const renderContent = () => {
        switch (viewMode) {
            case 'scan':
                return <CameraCapture onComplete={() => setViewMode('map')} />;
            case 'checklist':
                return <InspectionChecklist onComplete={() => setViewMode('map')} />;
            case 'risk':
                return <RiskAnalysis onComplete={() => setViewMode('map')} />;
            default:
                return (
                    <>
                        {/* Main Map */}
                        <Map
                            initialViewState={viewState}
                            onMove={(evt: any) => setViewState(evt.viewState)}
                            mapStyle="mapbox://styles/mapbox/dark-v11"
                            mapboxAccessToken={MAPBOX_TOKEN}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <NavigationControl position="top-right" visualizePitch />

                            {MOCK_SITES.map(site => (
                                <Marker
                                    key={site.id}
                                    latitude={site.latitude}
                                    longitude={site.longitude}
                                    anchor="bottom"
                                    onClick={(e: any) => {
                                        e.originalEvent.stopPropagation();
                                        setSelectedSite(site);
                                    }}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            position: 'relative',
                                            background: site.riskLevel === 'critical' ? 'rgba(255, 51, 102, 0.8)' :
                                                site.riskLevel === 'high' ? 'rgba(255, 204, 0, 0.8)' :
                                                    'rgba(0, 255, 153, 0.8)',
                                            borderColor: site.riskLevel === 'critical' ? 'var(--danger)' :
                                                site.riskLevel === 'high' ? 'var(--warning)' :
                                                    'var(--success)'
                                        }}
                                    >
                                        <Activity size={24} color="white" />
                                    </motion.div>
                                </Marker>
                            ))}

                            {selectedSite && (
                                <Popup
                                    latitude={selectedSite.latitude}
                                    longitude={selectedSite.longitude}
                                    offset={10}
                                    closeButton={false}
                                    onClose={() => setSelectedSite(null)}
                                >
                                    <div style={{ padding: '4px', minWidth: '180px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', margin: 0 }}>{selectedSite.name}</h3>
                                            <span className={`status-badge ${selectedSite.riskLevel}`}>
                                                {selectedSite.riskLevel}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                <Droplets size={14} color="var(--primary)" />
                                                <span>{selectedSite.precipInches}" Rain</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                                <Activity size={14} color="var(--secondary)" />
                                                <span>Risk: {selectedSite.riskScore}%</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setViewMode('scan')}
                                            style={{
                                                width: '100%',
                                                marginTop: '12px',
                                                padding: '8px',
                                                background: 'rgba(0, 242, 255, 0.2)',
                                                border: '1px solid rgba(0, 242, 255, 0.3)',
                                                borderRadius: '8px',
                                                color: 'var(--primary)',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Inspect Site
                                        </button>
                                    </div>
                                </Popup>
                            )}
                        </Map>

                        {/* Risk Slider Trigger (Map View Only) */}
                        <div className="floating-panel">
                            <div className="panel-content" onClick={() => setViewMode('risk')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                                    <div>
                                        <p style={{ color: 'var(--primary)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Active Monitor</p>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Basin Overview</h2>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', fontSize: '14px' }}>
                                            <AlertTriangle size={16} />
                                            <span>Storm Alert</span>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Synced 2m ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {/* HUD: Top Bar */}
            <div className="hud-top">
                <div className="hud-item" onClick={() => setViewMode('map')} style={{ cursor: 'pointer' }}>
                    <div className="icon-box">
                        <ShieldCheck className="text-primary" size={20} />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '1.125rem', letterSpacing: '-0.025em', margin: 0 }}>
                            ESCACS <span style={{ color: 'var(--primary)', fontWeight: 300 }}>AI</span>
                        </h1>
                        <p style={{ color: 'rgba(0, 242, 255, 0.7)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>
                            Stormwater Pilot v1.0
                        </p>
                    </div>
                </div>

                <div className="hud-item" style={{ gap: '8px' }}>
                    <button className="icon-btn">
                        <Bell size={20} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid black' }} />
                    </button>
                    <button className="icon-btn">
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ width: '100%', height: '100%' }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            {/* Footer Navigation Bar */}
            <div className="nav-bar-container">
                <div className="nav-bar">
                    <button
                        className={`nav-item ${viewMode === 'map' ? 'active' : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        <MapIcon size={24} />
                        <span>Map</span>
                    </button>

                    <button
                        className={`nav-item ${viewMode === 'scan' ? 'active' : ''}`}
                        onClick={() => setViewMode('scan')}
                    >
                        <Camera size={24} />
                        <span>Scan</span>
                    </button>

                    <div className="nav-center-btn-wrapper">
                        <button className="nav-center-btn" onClick={() => setViewMode('risk')}>
                            <AlertTriangle size={32} color="black" />
                        </button>
                    </div>

                    <button
                        className={`nav-item ${viewMode === 'checklist' ? 'active' : ''}`}
                        onClick={() => setViewMode('checklist')}
                    >
                        <Droplets size={24} />
                        <span>Tasks</span>
                    </button>

                    <button
                        className={`nav-item ${viewMode === 'risk' ? 'active' : ''}`}
                        onClick={() => setViewMode('risk')}
                    >
                        <Activity size={24} />
                        <span>Risk</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
