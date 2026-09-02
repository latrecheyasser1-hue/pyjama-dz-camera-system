import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, Shield, Sliders } from 'lucide-react';
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
        ctx.fillStyle = zoneType === 'caisse' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
      }
      ctx.strokeStyle = zoneType === 'caisse' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="card-clean w-full max-w-4xl rounded-xl p-5 border border-slate-700 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">رسم وتحديد منطقة الحراسة (Zone ROI)</h3>
              <p className="text-[11px] text-slate-400">
                انقر بالماوس لتحديد النقاط الأربعة لمنطقة المراقبة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 cursor-crosshair">
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
            <div className="absolute bottom-2 right-2 bg-slate-900/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
              {points.length}/4 نقاط محددة
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المنطقة:</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نوع المنطقة:</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-slate-600 focus:outline-none"
              >
                <option value="caisse">منطقة لاكيس ودرج النقود</option>
                <option value="queue">منطقة طابور وانتظار الزبائن</option>
                <option value="packing">طاولة التغليف والتحضير</option>
                <option value="workstation">منصب ماكينة الخياطة</option>
                <option value="loitering_area">منطقة كشف تجمعات العمال</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                مدة الإنذار (بالثواني):
              </label>
              <input
                type="number"
                value={thresholdSeconds}
                onChange={(e) => setThresholdSeconds(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-slate-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">
                (يتم إطلاق تنبيه إذا تركت لاكيس مفتوحة أكثر من {thresholdSeconds} ثانية)
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setPoints([])}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط
              </button>

              <button
                onClick={handleSave}
                disabled={saving || points.length < 4}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  successMsg
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? 'جارٍ الحفظ...' : successMsg ? 'تم الحفظ بنجاح' : 'حفظ المنطقة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
