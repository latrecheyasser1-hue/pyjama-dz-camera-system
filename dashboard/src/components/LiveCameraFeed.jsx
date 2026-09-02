import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Radio, Grid, Layout, Sliders, RefreshCw, Store, Package, Scissors, ShieldAlert, UserCheck, UserX } from 'lucide-react';

export default function LiveCameraFeed({ activeCamera, onCameraChange, onOpenZoneEditor }) {
  const [showAI, setShowAI] = useState(true);
  const [activeChannel, setActiveChannel] = useState(1);
  const [viewMode, setViewMode] = useState('single');
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [streamState, setStreamState] = useState({
    drawer_open: false,
    customer_present: false,
    cashier_present: true,
    sim_scenario: 'normal'
  });

  const locations = {
    cam_hanout_caisse: {
      name: 'المحل الرئيسي (الحانوت)',
      icon: Store,
      channels: [
        { id: 1, name: 'كاميرا 1: لاكيس والدرج', tag: 'Caisse' },
        { id: 2, name: 'كاميرا 2: المدخل الرئيسي', tag: 'Entree' },
        { id: 3, name: 'كاميرا 3: رفوف السلعة والبيجامات', tag: 'Rayons' },
        { id: 4, name: 'كاميرا 4: الممر وغرفة القياس', tag: 'Cabines' }
      ]
    },
    cam_depot_packing: {
      name: 'المخزن المركزي (الديبو)',
      icon: Package,
      channels: [
        { id: 1, name: 'كاميرا 1: طاولات التغليف والتحضير', tag: 'Packing' },
        { id: 2, name: 'كاميرا 2: باب شحن السلعة', tag: 'Quai' },
        { id: 3, name: 'كاميرا 3: ممرات التخزين', tag: 'Stock' }
      ]
    },
    cam_atelier_machines: {
      name: 'ورشة الفصالة والخياطة (الورشة)',
      icon: Scissors,
      channels: [
        { id: 1, name: 'كاميرا 1: صف ماكينات الخياطة', tag: 'Machines' },
        { id: 2, name: 'كاميرا 2: طاولات الفصالة والقص', tag: 'Coupe' },
        { id: 3, name: 'كاميرا 3: طاولة الكي والتشطيب', tag: 'Finition' }
      ]
    }
  };

  const currentLocation = locations[activeCamera] || locations.cam_hanout_caisse;
  const streamUrl = `http://localhost:8000/stream/${activeCamera}?ai=${showAI}&channel=${activeChannel}&t=${streamKey}`;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8000/status');
        if (res.ok) {
          const data = await res.json();
          if (data[activeCamera]?.state) {
            setStreamState(data[activeCamera].state);
          }
          setStreamError(false);
        }
      } catch (err) {
        setStreamError(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCamera, activeChannel]);

  return (
    <div className="card-clean rounded-xl p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-700">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {currentLocation.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Dahua DVR (متصل)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'single'
                ? currentLocation.channels.find((c) => c.id === activeChannel)?.name
                : 'عرض شبكة الكاميرات المجمعة'}
            </p>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800">
            {Object.entries(locations).map(([id, loc]) => {
              const Icon = loc.icon;
              return (
                <button
                  key={id}
                  onClick={() => {
                    onCameraChange(id);
                    setActiveChannel(1);
                    setStreamKey(Date.now());
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeCamera === id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {id === 'cam_hanout_caisse' && 'الحانوت'}
                  {id === 'cam_depot_packing' && 'الديبو'}
                  {id === 'cam_atelier_machines' && 'الورشة'}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('single')}
              title="عرض كاميرا رئيسية"
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'single' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="عرض شبكة الكاميرات"
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Internal Channel Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#090d16] p-1.5 rounded-lg border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 px-2">الكاميرات:</span>
        {currentLocation.channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => {
              setActiveChannel(ch.id);
              setViewMode('single');
              setStreamKey(Date.now());
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all ${
              viewMode === 'single' && activeChannel === ch.id
                ? 'bg-slate-800 text-white font-bold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeChannel === ch.id ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Video Viewport */}
      {viewMode === 'single' ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800">
          {!streamError ? (
            <img
              src={streamUrl}
              alt="Live Camera Feed"
              className="w-full h-full object-cover"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center bg-slate-900">
              <Radio className="w-8 h-8 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-200">في انتظار تشغيل البث...</h3>
              <button
                onClick={() => {
                  setStreamError(false);
                  setStreamKey(Date.now());
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Status Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              {activeChannel === 1 && activeCamera === 'cam_hanout_caisse' && (
                <>
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      streamState.drawer_open
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {streamState.drawer_open ? 'لاكيس: مفتوحة' : 'لاكيس: مغلقة'}
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      streamState.customer_present
                        ? 'bg-slate-900/90 text-cyan-300 border-slate-700'
                        : 'bg-slate-900/90 text-slate-400 border-slate-700'
                    }`}
                  >
                    {streamState.customer_present ? 'زبون: متواجد' : 'زبون: لا يوجد'}
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-xs text-amber-400 font-mono font-bold" dir="ltr">
              DAHUA CH-{activeChannel}
            </div>
          </div>

          {/* Bottom Floating Bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-950/90 px-3 py-1.5 rounded-md border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">الذكاء الاصطناعي:</span>
              <span className="text-amber-400 font-mono" dir="ltr">YOLOv8 Active (CH-{activeChannel})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAI(!showAI)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                  showAI
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {showAI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showAI ? 'إخفاء خطوط الـ AI' : 'إظهار خطوط الـ AI'}
              </button>

              {onOpenZoneEditor && (
                <button
                  onClick={onOpenZoneEditor}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
                >
                  <Sliders className="w-3 h-3" />
                  رسم وتحديد الـ Zones
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Multi-Cam 2x2 Grid View */
        <div className="grid grid-cols-2 gap-3">
          {currentLocation.channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                setViewMode('single');
              }}
              className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 hover:border-slate-600 cursor-pointer transition-all"
            >
              <img
                src={`http://localhost:8000/stream/${activeCamera}?ai=${showAI}&channel=${ch.id}&t=${streamKey}`}
                alt={ch.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-slate-900/90 px-2 py-0.5 rounded text-[11px] font-semibold text-white border border-slate-700">
                {ch.name}
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700" dir="ltr">
                CH-{ch.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
