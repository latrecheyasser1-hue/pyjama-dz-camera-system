import React, { useState, useEffect } from 'react';
import { Shield, Camera, Bell, Sparkles, Sliders, ExternalLink, Clock, Radio, Activity } from 'lucide-react';
import LiveCameraFeed from './components/LiveCameraFeed';
import IncidentTimeline from './components/IncidentTimeline';
import CaisseMetrics from './components/CaisseMetrics';
import MidnightReports from './components/MidnightReports';
import SimulationControls from './components/SimulationControls';
import ZoneEditor from './components/ZoneEditor';

export default function App() {
  const [activeCamera, setActiveCamera] = useState('cam_hanout_caisse');
  const [isZoneEditorOpen, setIsZoneEditorOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ar-DZ'));
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'reports', 'settings'
  const [latestAlertToast, setLatestAlertToast] = useState(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ar-DZ'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNewAlert = (alert) => {
    setLatestAlertToast(alert);
    setTimeout(() => {
      setLatestAlertToast(null);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 flex flex-col font-cairo">
      {/* Top Floating Alert Toast Notification */}
      {latestAlertToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="glass-panel px-5 py-3 rounded-2xl border border-rose-500/50 bg-rose-950/90 shadow-2xl flex items-center gap-3 text-white text-sm font-bold glow-red">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            🚨 تنبيه فوري: {latestAlertToast.title}
          </div>
        </div>
      )}

      {/* Luxury Navbar Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-outfit">
                PYJAMA DZ <span className="text-amber-400 text-sm font-cairo font-bold">حراسة ذكية</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                v1.0 AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400">نظام المراقبة والرؤية الحاسوبية لكاميرات Dahua</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4" />
            البث المباشر والكاميرات
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            تقارير منتصف الليل (00:00)
          </button>
        </nav>

        {/* Status Indicators & Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-gray-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {currentTime}
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Supabase Cloud متصل
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Metrics Top Row */}
        <CaisseMetrics />

        {/* Simulation Controls Quick Bar */}
        <SimulationControls onTrigger={() => {}} />

        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Live Camera Player */}
            <div className="lg:col-span-2 space-y-6">
              <LiveCameraFeed
                activeCamera={activeCamera}
                onCameraChange={setActiveCamera}
                onOpenZoneEditor={() => setIsZoneEditorOpen(true)}
              />

              {/* Reports Preview Below Live Feed */}
              <MidnightReports />
            </div>

            {/* Right 1 Column: Realtime Incident Timeline */}
            <div className="lg:col-span-1 h-full">
              <IncidentTimeline onNewAlert={handleNewAlert} />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <MidnightReports />
          </div>
        )}
      </main>

      {/* Zone Drawing Modal Canvas */}
      <ZoneEditor
        isOpen={isZoneEditorOpen}
        onClose={() => setIsZoneEditorOpen(false)}
        activeCamera={activeCamera}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-gray-500 flex items-center justify-between">
        <span>Pyjama DZ Camera System &copy; 2026 - All Rights Reserved</span>
        <span className="text-amber-500/70 font-semibold font-mono">Built for High Security & Multi-Site Audit</span>
      </footer>
    </div>
  );
}
