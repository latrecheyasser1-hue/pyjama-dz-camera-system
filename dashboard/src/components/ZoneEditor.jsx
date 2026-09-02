import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ZoneEditor({ isOpen, onClose, activeCamera = 'cam_hanout_caisse' }) {
  const [points, setPoints] = useState([
    { x: 0.35, y: 0.45 },
    { x: 0.65, y: 0.45 },
    { x: 0.65, y: 0.85 },
    { x: 0.35, y: 0.85 }
  ]);
  const [zoneType, setZoneType] = useState('caisse');
  const [zoneName, setZoneName] = useState('منطقة لاكيس والدرج');
  const [thresholdSeconds, setThresholdSeconds] = useState(30);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const canvasRef = useRef(null);

  // Handle canvas click to place points
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (points.length >= 4) {
      setPoints([{ x, y }]);
    } else {
      setPoints([...points, { x, y }]);
    }
  };

  // Draw overlay polygon
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      if (points.length === 4) {
        ctx.closePath();
        ctx.fillStyle = zoneType === 'caisse' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)';
        ctx.fill();
      }
      ctx.strokeStyle = zoneType === 'caisse' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw corner point handles
      points.forEach((pt, index) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [points, zoneType]);

  const handleSave = async () => {
    setSaving(true);
    const normalizedPoints = points.map((p) => [parseFloat(p.x.toFixed(3)), parseFloat(p.y.toFixed(3))]);

    try {
      const { error } = await supabase.from('camera_zones').upsert({
        camera_id: activeCamera,
        zone_name: zoneName,
        zone_type: zoneType,
        polygon_points: normalizedPoints,
        alert_threshold_seconds: parseInt(thresholdSeconds),
        color_hex: zoneType === 'caisse' ? '#EF4444' : '#3B82F6',
        is_active: true
      });

      if (!error) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">رسم وتحديد منطقة الحراسة (Zone ROI)</h3>
              <p className="text-xs text-gray-400">
                انقر على الكادر بالماوس لتحديد الزوايا الأربعة لمنطقة المراقبة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Grid: Canvas on Left, Controls on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2 relative aspect-video bg-gray-950 rounded-xl overflow-hidden border border-white/10 cursor-crosshair">
            <img
              src={`http://localhost:8000/stream/${activeCamera}?ai=false`}
              alt="Snapshot"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] text-amber-300">
              {points.length}/4 نقاط محددة
            </div>
          </div>

          {/* Form Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">اسم المنطقة:</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">نوع المنطقة:</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="caisse">🔴 منطقة لاكيس ودرج النقود</option>
                <option value="queue">🔵 منطقة طابور وانتظار الزبائن</option>
                <option value="packing">🟢 طاولة التغليف والتحضير</option>
                <option value="workstation">🟣 منصب ماكينة الخياطة</option>
                <option value="loitering_area">🟡 منطقة كشف تجمعات العمال</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                مدة الإنذار (بالثواني):
              </label>
              <input
                type="number"
                value={thresholdSeconds}
                onChange={(e) => setThresholdSeconds(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">
                (يتم إطلاق تنبيه فوري إذا تركت لاكيس مفتوحة أكثر من {thresholdSeconds} ثانية)
              </span>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => setPoints([])}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط
              </button>

              <button
                onClick={handleSave}
                disabled={saving || points.length < 4}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  successMsg
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-gray-950 hover:bg-amber-400 disabled:opacity-50'
                }`}
              >
                <Check className="w-4 h-4" />
                {saving ? 'جارٍ الحفظ...' : successMsg ? 'تم الحفظ بنجاح!' : 'حفظ المنطقة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
