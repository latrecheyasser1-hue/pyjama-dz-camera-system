import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Radio, Grid, Layout, Sparkles, RefreshCw } from 'lucide-react';

export default function LiveCameraFeed({ activeCamera, onCameraChange, onOpenZoneEditor }) {
  const [showAI, setShowAI] = useState(true);
  const [activeChannel, setActiveChannel] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [streamState, setStreamState] = useState({
    drawer_open: false,
    customer_present: false,
    cashier_present: true,
    sim_scenario: 'normal'
  });

  // Location configuration and its internal camera channels
  const locations = {
    cam_hanout_caisse: {
      name: 'الحانوت (المحل الرئيسي)',
      channels: [
        { id: 1, name: 'كاميرا 1: لاكيس والدرج (Caisse)', purpose: 'مراقبة النقود والسرقات' },
        { id: 2, name: 'كاميرا 2: المدخل وباب المحل (Entrée)', purpose: 'حساب تدفق الزبائن' },
        { id: 3, name: 'كاميرا 3: رفوف السلعة والبيجامات (Rayons)', purpose: 'مراقبة السلعة والتجول' },
        { id: 4, name: 'كاميرا 4: الممر وغرفة القياس (Cabines)', purpose: 'حماية الممرات' }
      ]
    },
    cam_depot_packing: {
      name: 'الديبو (المخزن المركزي)',
      channels: [
        { id: 1, name: 'كاميرا 1: طاولات التغليف والتحضير', purpose: 'تتبع سرعة التجهيز' },
        { id: 2, name: 'كاميرا 2: باب شحن السلعة (Quai)', purpose: 'مراقبة خروج الطرود' },
        { id: 3, name: 'كاميرا 3: ممرات التخزين (Allées Stock)', purpose: 'كشف تجمعات العمال' }
      ]
    },
    cam_atelier_machines: {
      name: 'الورشة (الفصالة والخياطة)',
      channels: [
        { id: 1, name: 'كاميرا 1: صف ماكينات الخياطة 1-4', purpose: 'مراقبة ساعات العمل' },
        { id: 2, name: 'كاميرا 2: طاولات الفصالة والقص', purpose: 'مراقبة الإنتاجية' },
        { id: 3, name: 'كاميرا 3: طاولة الكي والتشطيب', purpose: 'مراقبة الجودة' }
      ]
    }
  };

  const currentLocation = locations[activeCamera] || locations.cam_hanout_caisse;
  const streamUrl = `http://localhost:8000/stream/${activeCamera}?ai=${showAI}&channel=${activeChannel}&t=${streamKey}`;

  // Poll status from local engine
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
    <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden space-y-4">
      {/* Top Header: Location Selector & Multi-Cam View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {currentLocation.name}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Dahua DVR (4 قنوات نشطة)
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {viewMode === 'single'
                ? currentLocation.channels.find((c) => c.id === activeChannel)?.name
                : 'عرض شبكة الكاميرات المجمعة (Multi-Cam Grid)'}
            </p>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-white/5">
            {Object.entries(locations).map(([id, loc]) => (
              <button
                key={id}
                onClick={() => {
                  onCameraChange(id);
                  setActiveChannel(1);
                  setStreamKey(Date.now());
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCamera === id
                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {loc.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Single vs Grid Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('single')}
              title="عرض كاميرا مفردة كبيرة"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'single' ? 'bg-gray-800 text-amber-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layout className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="عرض شبكة 4 كاميرات في نفس الوقت"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid' ? 'bg-gray-800 text-amber-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Internal Channel Selector Bar (داخل نفس الموقع: كاميرا 1، 2، 3، 4) */}
      <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
        <span className="text-xs font-bold text-gray-400 pl-2">اختر الكاميرا داخل الموقع:</span>
        {currentLocation.channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => {
              setActiveChannel(ch.id);
              setViewMode('single');
              setStreamKey(Date.now());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'single' && activeChannel === ch.id
                ? 'bg-cyan-500 text-gray-950 shadow-sm shadow-cyan-500/30'
                : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800 border border-white/5'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeChannel === ch.id ? 'bg-gray-950' : 'bg-emerald-400'}`}></span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Video Viewport */}
      {viewMode === 'single' ? (
        /* Single Big Camera View */
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-950 border border-white/10 group shadow-2xl">
          {!streamError ? (
            <img
              src={streamUrl}
              alt="Live Camera Feed"
              className="w-full h-full object-cover"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-gray-900/90">
              <Radio className="w-10 h-10 text-amber-400/60 animate-bounce" />
              <h3 className="text-base font-bold text-gray-200">في انتظار اتصال الكاميرا...</h3>
              <button
                onClick={() => {
                  setStreamError(false);
                  setStreamKey(Date.now());
                }}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
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
                    className={`px-3 py-1 rounded-lg backdrop-blur-md text-xs font-bold border transition-all ${
                      streamState.drawer_open
                        ? 'bg-rose-500/80 text-white border-rose-400 glow-red animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {streamState.drawer_open ? '⚠️ لاكيس: مفتوحة (OPEN)' : '🔒 لاكيس: مغلقة (CLOSED)'}
                  </div>

                  <div
                    className={`px-3 py-1 rounded-lg backdrop-blur-md text-xs font-bold border ${
                      streamState.customer_present
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-gray-800/80 text-gray-400 border-white/10'
                    }`}
                  >
                    {streamState.customer_present ? '👤 زبون: متواجد' : '👤 زبون: لا يوجد'}
                  </div>
                </>
              )}
            </div>

            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs text-amber-400 font-mono font-bold">
              DAHUA CH-{activeChannel}
            </div>
          </div>

          {/* Bottom Floating Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="font-semibold text-white">الذكاء الاصطناعي:</span>
              <span className="text-amber-400 font-mono">YOLOv8 AI Active (CH-{activeChannel})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAI(!showAI)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  showAI
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-gray-800 text-gray-400 border border-white/5'
                }`}
              >
                {showAI ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showAI ? 'إخفاء خطوط الـ AI' : 'إظهار خطوط الـ AI'}
              </button>

              {onOpenZoneEditor && (
                <button
                  onClick={onOpenZoneEditor}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  رسم الـ Zones
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Multi-Cam 2x2 Grid View (عرض 4 كاميرات في ضربة وحدة) */
        <div className="grid grid-cols-2 gap-3">
          {currentLocation.channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                setViewMode('single');
              }}
              className="relative aspect-video rounded-xl overflow-hidden bg-gray-950 border border-white/10 hover:border-amber-500/50 cursor-pointer group transition-all"
            >
              <img
                src={`http://localhost:8000/stream/${activeCamera}?ai=${showAI}&channel=${ch.id}&t=${streamKey}`}
                alt={ch.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10">
                {ch.name}
              </div>
              <div className="absolute bottom-2 right-2 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                انقر للتكبير 🔍
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
