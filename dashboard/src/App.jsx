import React, { useState, useEffect } from 'react';
import { Shield, Clock, Radio, AlertTriangle, FileText, Users } from 'lucide-react';
import LiveCameraFeed from './components/LiveCameraFeed';
import IncidentTimeline from './components/IncidentTimeline';
import CaisseMetrics from './components/CaisseMetrics';
import MidnightReports from './components/MidnightReports';
import SimulationControls from './components/SimulationControls';
import ZoneEditor from './components/ZoneEditor';
import WorkersReport from './components/WorkersReport';

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-cairo" dir="rtl">
      {/* Toast Alert */}
      {latestAlertToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>تنبيه أمني: {latestAlertToast.title}</span>
          </div>
        </div>
      )}

      {/* Clean White Navbar */}
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            البث المباشر والكاميرات
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'workers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            سجل أداء العمال والأخطاء
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            تقارير منتصف الليل (00:00)
          </button>
        </nav>

        {/* Clock */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-xs text-slate-700 font-mono" dir="ltr">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {currentTime}
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

              <WorkersReport />
            </div>

            {/* Right 1 Col: Incidents Timeline */}
            <div className="lg:col-span-1">
              <IncidentTimeline onNewAlert={handleNewAlert} />
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-5">
            <WorkersReport />
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

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-center text-xs text-slate-500 flex items-center justify-between">
        <span>Pyjama DZ Camera Security System - 2026</span>
        <span className="font-mono text-slate-500 text-[11px]">System Status: All Cameras Operational</span>
      </footer>
    </div>
  );
}
