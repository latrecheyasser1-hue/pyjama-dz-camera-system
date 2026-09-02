import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Radio, Grid, Layout, Sliders, RefreshCw, Store, Package, Scissors } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {currentLocation.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Dahua DVR (متصل)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {viewMode === 'single'
                ? currentLocation.channels.find((c) => c.id === activeChannel)?.name
                : 'عرض شبكة الكاميرات المجمعة'}
            </p>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
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
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
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
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('single')}
              title="عرض كاميرا رئيسية"
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="عرض شبكة الكاميرات"
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Internal Channel Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
        <span className="text-xs font-semibold text-slate-500 px-2">الكاميرات:</span>
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
                ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeChannel === ch.id ? 'bg-slate-900' : 'bg-slate-300'}`}></span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Video Viewport */}
      {viewMode === 'single' ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-200 shadow-inner">
          {!streamError ? (
            <img
              src={streamUrl}
              alt="Live Camera Feed"
              className="w-full h-full object-cover"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center bg-slate-100">
              <Radio className="w-8 h-8 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700">في انتظار تشغيل البث...</h3>
              <button
                onClick={() => {
                  setStreamError(false);
                  setStreamKey(Date.now());
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-slate-700 border border-slate-300 text-xs font-semibold hover:bg-slate-50 shadow-xs"
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
                    className={`px-2.5 py-1 rounded text-xs font-bold border shadow-xs ${
                      streamState.drawer_open
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white/95 text-slate-800 border-slate-200'
                    }`}
                  >
                    {streamState.drawer_open ? 'لاكيس: مفتوحة' : 'لاكيس: مغلقة'}
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded text-xs font-bold border shadow-xs bg-white/95 text-slate-800 border-slate-200`}
                  >
                    {streamState.customer_present ? 'زبون: متواجد' : 'زبون: لا يوجد'}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white/95 px-2.5 py-1 rounded border border-slate-200 text-xs text-slate-800 font-mono font-bold shadow-xs" dir="ltr">
              DAHUA CH-{activeChannel}
            </div>
          </div>

          {/* Bottom Floating Bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-white/95 px-3 py-1.5 rounded-md border border-slate-200 text-xs shadow-md">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-slate-500 font-medium">الذكاء الاصطناعي:</span>
              <span className="text-slate-900 font-mono font-bold" dir="ltr">YOLOv8 Active (CH-{activeChannel})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAI(!showAI)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                  showAI
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {showAI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showAI ? 'إخفاء خطوط الـ AI' : 'إظهار خطوط الـ AI'}
              </button>

              {onOpenZoneEditor && (
                <button
                  onClick={onOpenZoneEditor}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
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
              className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-200 hover:border-slate-400 cursor-pointer transition-all shadow-xs"
            >
              <img
                src={`http://localhost:8000/stream/${activeCamera}?ai=${showAI}&channel=${ch.id}&t=${streamKey}`}
                alt={ch.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800 border border-slate-200 shadow-xs">
                {ch.name}
              </div>
              <div className="absolute bottom-2 left-2 bg-white/95 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200 shadow-xs" dir="ltr">
                CH-{ch.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
