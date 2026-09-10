import React, { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Radio, Grid, Layout, Sliders, RefreshCw, Store, Package, Scissors, Scan, CheckCircle2, Globe, Server, Check } from 'lucide-react';
import { getStreamServerUrl, setStreamServerUrl } from '../lib/streamConfig';

export default function LiveCameraFeed({ activeCamera, onCameraChange, onOpenZoneEditor }) {
  const [showAI, setShowAI] = useState(true);
  const [activeChannel, setActiveChannel] = useState(1);
  const [viewMode, setViewMode] = useState('single');
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState(getStreamServerUrl());
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerInput, setCustomServerInput] = useState(getStreamServerUrl());
  const [discoveredChannels, setDiscoveredChannels] = useState([
    { id: 1, name: 'كاميرا 1: لاكيس والدرج', tag: 'Caisse', status: 'online' },
    { id: 2, name: 'كاميرا 2: المدخل الرئيسي', tag: 'Entree', status: 'online' },
    { id: 3, name: 'كاميرا 3: رفوف السلعة والبيجامات', tag: 'Rayons', status: 'online' }
  ]);
  const [streamState, setStreamState] = useState({
    drawer_open: false,
    customer_present: false,
    cashier_present: true,
    sim_scenario: 'normal'
  });

  // Fetch actually discovered cameras from Dahua DVR
  useEffect(() => {
    async function loadActiveCameras() {
      try {
        const res = await fetch(`${currentServerUrl}/api/cameras/active`);
        if (res.ok) {
          const data = await res.json();
          if (data.cameras && data.cameras.length > 0) {
            setDiscoveredChannels(data.cameras);
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    loadActiveCameras();
  }, [currentServerUrl]);

  async function handleAutoDetectCameras() {
    setIsScanning(true);
    setScanMessage('جاري فحص مخارج DVR داهوا واكتشاف الكاميرات...');
    try {
      const res = await fetch(`${currentServerUrl}/api/cameras/scan`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.cameras && data.cameras.length > 0) {
          setDiscoveredChannels(data.cameras);
          setActiveChannel(data.cameras[0].id);
          setScanMessage(`تم اكتشاف ${data.cameras.length} كاميرا نشطة ومتصلة بالـ DVR بنجاح`);
        } else {
          setScanMessage('لم يتم العثور على كاميرات إضافية متصلة بالشبكة حالياً');
        }
      }
    } catch (e) {
      setScanMessage('تعذر الاتصال بـ DVR (تأكد من تشغيل السيرفر في شبكة المحل)');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 4000);
    }
  }

  const locations = {
    cam_hanout_caisse: {
      name: 'المحل الرئيسي (الحانوت)',
      icon: Store,
      channels: discoveredChannels
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
  const streamUrl = `${currentServerUrl}/stream/${activeCamera}?ai=${showAI}&channel=${activeChannel}&t=${streamKey}`;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${currentServerUrl}/status`);
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
  }, [activeCamera, activeChannel, currentServerUrl]);

  const handleSaveServerUrl = (newUrl) => {
    setStreamServerUrl(newUrl);
    setCurrentServerUrl(getStreamServerUrl());
    setCustomServerInput(getStreamServerUrl());
    setShowServerModal(false);
    setStreamKey(Date.now());
    setStreamError(false);
  };

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
              <button
                onClick={() => setShowServerModal(true)}
                title="إعدادات اتصال البث المباشر (محلي / سحابي)"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer"
              >
                <Globe className="w-3 h-3 text-slate-600" />
                <span>مصدر البث</span>
              </button>
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

      {/* Stream Server Configuration Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 font-cairo">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">إعدادات مصدر البث المباشر (Live Stream Source)</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              اختر أين يتواجد خادم الكاميرات لتشغيل البث المباشر من أي جهاز (البيسي تاعك، التيليفون، أو بيسي الحانوت):
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSaveServerUrl('http://localhost:8000')}
                className={`w-full p-3 rounded-lg border text-right transition-all flex items-center justify-between text-xs ${
                  currentServerUrl === 'http://localhost:8000'
                    ? 'border-slate-900 bg-slate-50 font-bold text-slate-900'
                    : 'border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-bold">1. نفس بيسي الحانوت (Localhost)</span>
                  <span className="text-[11px] text-slate-500 font-mono" dir="ltr">http://localhost:8000</span>
                </div>
                {currentServerUrl === 'http://localhost:8000' && <Check className="w-4 h-4 text-slate-900" />}
              </button>

              <div className="p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                <span className="block font-bold text-slate-800">2. عبر ويفي الحانوت (Wi-Fi Local IP) أو نفق Cloudflare:</span>
                <p className="text-[11px] text-slate-500">
                  إذا كنت في ويفي الحانوت، اكتب IP بيسي الحانوت (مثلاً: http://192.168.1.15:8000). أو ضع رابط Cloudflare Tunnel للبث خارج المحل:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="http://192.168.1.XX:8000 أو https://tunnel.trycloudflare.com"
                    value={customServerInput}
                    onChange={(e) => setCustomServerInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-xs font-mono focus:outline-none focus:border-slate-800"
                    dir="ltr"
                  />
                  <button
                    onClick={() => handleSaveServerUrl(customServerInput)}
                    className="px-3 py-1.5 rounded bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shrink-0"
                  >
                    حفظ وتطبيق
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowServerModal(false)}
                className="px-4 py-1.5 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Channel Selector Bar with Auto-Detection */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              الكاميرات المتصلة فعلياً ({currentLocation.channels.length} كاميرات متصلة بالـ DVR):
            </span>
            {scanMessage && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {scanMessage}
              </span>
            )}
          </div>

          {activeCamera === 'cam_hanout_caisse' && (
            <button
              onClick={handleAutoDetectCameras}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="فحص مخارج DVR داهوا واكتشاف الكاميرات النشطة تلقائياً"
            >
              <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-600' : 'text-slate-600'}`} />
              {isScanning ? 'جاري فحص الـ DVR...' : 'كشف الكاميرات تلقائياً (Auto-Detect)'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 overflow-x-auto scrollbar-none">
          {currentLocation.channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                setViewMode('single');
                setStreamKey(Date.now());
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'single' && activeChannel === ch.id
                  ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeChannel === ch.id ? 'bg-slate-900' : 'bg-emerald-500'}`}></span>
              {ch.name}
            </button>
          ))}
        </div>
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
                src={`${currentServerUrl}/stream/${activeCamera}?ai=${showAI}&channel=${ch.id}&t=${streamKey}`}
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
