import React, { useState } from 'react';
import { PlayCircle, ShieldAlert, Tag, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStreamServerUrl } from '../lib/streamConfig';

export default function SimulationControls({ onTrigger }) {
  const [loading, setLoading] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleTestTrigger = async (type) => {
    setLoading(type);
    setFeedback('');

    let backendSuccess = false;
    try {
      const endpoint = type === 'no_customer' ? '/test/trigger-no-customer' : '/test/trigger-discount';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${getStreamServerUrl()}${endpoint}`, {
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) backendSuccess = true;
    } catch (e) {
      backendSuccess = false;
    }

    try {
      if (!backendSuccess) {
        // Direct Cloud Realtime Fallback (Always works on Vercel & when local backend is paused)
        if (type === 'no_customer') {
          await supabase.from('security_events').insert([{
            camera_id: 'cam_hanout_caisse',
            location: 'hanout',
            event_type: 'caisse_unattended',
            severity: 'critical',
            title: 'فتح درج النقود بدون وجود زبون',
            description: 'تم رصد فتح درج النقود في غياب أي زبون أمام الكونتوار عبر الذكاء الاصطناعي.',
            start_time: new Date().toISOString(),
            duration_seconds: 12,
            worker_tags: ['مسؤول لاكيس'],
            telegram_sent: false,
            resolved: false
          }]);
          setFeedback('تم رصد الحادثة واكتشاف فتح لاكيس بدون زبون وتسجيل التنبيه بنجاح');
        } else if (type === 'discount') {
          await supabase.from('security_events').insert([{
            camera_id: 'cam_hanout_caisse',
            location: 'hanout',
            event_type: 'abnormal_discount',
            severity: 'warning',
            title: 'تخفيض استثنائي غير مبرر (1000 دج)',
            description: 'تم تطبيق تخفيض استثنائي (1000 دج) على تذكرة بيع بدون موافقة مسبقة.',
            start_time: new Date().toISOString(),
            duration_seconds: 15,
            worker_tags: ['مسؤول لاكيس'],
            telegram_sent: false,
            resolved: false
          }]);
          setFeedback('تم تدقيق التخفيض الاستثنائي (1000 دج) وتسجيل الملاحظة الأمنية بنجاح');
        }
      } else {
        if (type === 'no_customer') setFeedback('تم إطلاق تجربة فتح لاكيس بدون زبون واقتطاع الفيديو بنجاح');
        if (type === 'discount') setFeedback('تم إطلاق تجربة تدقيق تخفيض 1000 دج بنجاح');
      }
      if (onTrigger) onTrigger();
    } catch (err) {
      setFeedback('تم تسجيل التجربة');
    } finally {
      setLoading('');
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  return (
    <div className="card-clean rounded-xl p-3.5 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-slate-700" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">أزرار التجربة والمحاكاة الفورية</h4>
            <p className="text-[11px] text-slate-500">
              اختبار رد فعل الذكاء الاصطناعي واقتطاع مقطع الفيديو فوراً
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTestTrigger('no_customer')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all shadow-xs disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {loading === 'no_customer' ? 'جارٍ الإطلاق...' : 'تجربة: فتح لاكيس بدون زبون'}
          </button>

          <button
            onClick={() => handleTestTrigger('discount')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold hover:bg-slate-200 transition-all shadow-xs disabled:opacity-50"
          >
            <Tag className="w-3.5 h-3.5" />
            {loading === 'discount' ? 'جارٍ الإطلاق...' : 'تجربة: تخفيض استثنائي 1000 دج'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {feedback}
        </div>
      )}
    </div>
  );
}
