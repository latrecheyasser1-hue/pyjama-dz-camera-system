import React, { useState } from 'react';
import { PlayCircle, ShieldAlert, Tag, CheckCircle2 } from 'lucide-react';

export default function SimulationControls({ onTrigger }) {
  const [loading, setLoading] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleTestTrigger = async (type) => {
    setLoading(type);
    setFeedback('');

    try {
      if (type === 'no_customer') {
        const res = await fetch('http://localhost:8000/test/trigger-no-customer', { method: 'POST' });
        if (res.ok) setFeedback('تم إطلاق تجربة فتح لاكيس بدون زبون بنجاح.');
      } else if (type === 'discount') {
        const res = await fetch('http://localhost:8000/test/trigger-discount', { method: 'POST' });
        if (res.ok) setFeedback('تم إطلاق تجربة تدقيق تخفيض 1000 دج بنجاح.');
      }
      if (onTrigger) onTrigger();
    } catch (e) {
      setFeedback('تعذر الاتصال بالمحرك المحلي. يرجى التأكد من تشغيل backend.');
    } finally {
      setLoading('');
      setTimeout(() => setFeedback(''), 3500);
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
