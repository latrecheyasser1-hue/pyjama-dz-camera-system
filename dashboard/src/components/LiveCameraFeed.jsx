import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Radio, Maximize2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function LiveCameraFeed({ activeCamera, onCameraChange, onOpenZoneEditor }) {
  const [showAI, setShowAI] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [streamState, setStreamState] = useState({
    drawer_open: false,
    customer_present: false,
    cashier_present: true,
    sim_scenario: 'normal'
  });

  const streamUrl = `http://localhost:8000/stream/${activeCamera}?ai=${showAI}&t=${streamKey}`;

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
  }, [activeCamera]);

  const cameraNames = {
    cam_hanout_caisse: { name: 'الحانوت - لاكيس والكونتوار', location: 'المحل الرئيسي' },
    cam_depot_packing: { name: 'الديبو - طاولات التغليف والطرود', location: 'المخزن المركزي' },
    cam_atelier_machines: { name: 'الورشة - آلات الخياطة والإنتاج', location: 'ورشة الفصالة' }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {cameraNames[activeCamera]?.name || 'كاميرا المراقبة'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                مباشر (15 FPS)
              </span>
            </div>
            <p className="text-xs text-gray-400">{cameraNames[activeCamera]?.location}</p>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-white/5">
          {Object.entries(cameraNames).map(([id, info]) => (
            <button
              key={id}
              onClick={() => {
                onCameraChange(id);
                setStreamKey(Date.now());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCamera === id
                  ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {id === 'cam_hanout_caisse' && '🏪 الحانوت (لاكيس)'}
              {id === 'cam_depot_packing' && '📦 الديبو (التغليف)'}
              {id === 'cam_atelier_machines' && '🧵 الورشة (الخياطة)'}
            </button>
          ))}
        </div>
      </div>

      {/* Video Viewport Container */}
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
            <h3 className="text-base font-bold text-gray-200">في انتظار تشغيل محرك الكاميرات المحلي...</h3>
            <p className="text-xs text-gray-400 max-w-md">
              تأكد من تشغيل ملف <code>Run_Pyjama_DZ_AI.bat</code> في البيسي لبدء بث الكاميرات والذكاء الاصطناعي.
            </p>
            <button
              onClick={() => {
                setStreamError(false);
                setStreamKey(Date.now());
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة فحص الاتصال
            </button>
          </div>
        )}

        {/* Realtime Live AI Status Overlays on Video */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Left: Caisse & Cashier status indicators */}
          <div className="flex items-center gap-2">
            {activeCamera === 'cam_hanout_caisse' && (
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

          {/* Right: Dahua Live Watermark */}
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs text-amber-400 font-mono font-bold">
            DAHUA HD-CVI / RTSP
          </div>
        </div>

        {/* Bottom Floating Bar Controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="font-semibold text-white">الذكاء الاصطناعي:</span>
            <span className="text-amber-400 font-mono">YOLOv8 Nano (Active)</span>
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
                رسم / تعديل الـ Zones
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
