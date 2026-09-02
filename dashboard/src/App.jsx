import React, { useState, useEffect } from 'react';
import { Shield, Camera, Bell, Sparkles, Sliders, ExternalLink, Clock, Radio, Activity, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('live');
  const [latestAlertToast, setLatestAlertToast] = useState(null);

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
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-cairo" dir="rtl">
      {/* Toast Alert */}
      {latestAlertToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-rose-950 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>تنبيه أمني: {latestAlertToast.title}</span>
          </div>
        </div>
      )}

      {/* Clean Navbar */}
      <header className="border-b border-slate-800 bg-[#0c121e] px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide font-outfit">
                PYJAMA DZ <span className="text-xs font-cairo font-semibold text-slate-400">| نظام المراقبة الذكي</span>
              </h1>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            البث المباشر والكاميرات
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            تقارير منتصف الليل (00:00)
          </button>
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#090d16] px-3 py-1 rounded-md border border-slate-800 text-xs text-slate-300 font-mono" dir="ltr">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {currentTime}
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Supabase Cloud متصل
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* KPI Metrics */}
        <CaisseMetrics />

        {/* Simulation Controls */}
        <SimulationControls onTrigger={() => {}} />

        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Left 2 Cols: Live Camera & Reports Preview */}
            <div className="lg:col-span-2 space-y-5">
              <LiveCameraFeed
                activeCamera={activeCamera}
                onCameraChange={setActiveCamera}
                onOpenZoneEditor={() => setIsZoneEditorOpen(true)}
              />

              <MidnightReports />
            </div>

            {/* Right 1 Col: Incidents Timeline */}
            <div className="lg:col-span-1">
              <IncidentTimeline onNewAlert={handleNewAlert} />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-5">
            <MidnightReports />
          </div>
        )}
      </main>

      {/* Zone Editor Modal */}
      <ZoneEditor
        isOpen={isZoneEditorOpen}
        onClose={() => setIsZoneEditorOpen(false)}
        activeCamera={activeCamera}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-500 flex items-center justify-between">
        <span>Pyjama DZ Camera Security System - 2026</span>
        <span className="font-mono text-slate-400 text-[11px]">System Status: All Cameras Operational</span>
      </footer>
    </div>
  );
}
