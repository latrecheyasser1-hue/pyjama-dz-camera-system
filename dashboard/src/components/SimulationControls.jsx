import React, { useState } from 'react';
import { PlayCircle, ShieldAlert, Tag, Clock, CheckCircle } from 'lucide-react';

export default function SimulationControls({ onTrigger }) {
  const [loading, setLoading] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleTestTrigger = async (type) => {
    setLoading(type);
    setFeedback('');

    try {
      if (type === 'no_customer') {
        const res = await fetch('http://localhost:8000/test/trigger-no-customer', { method: 'POST' });
        if (res.ok) setFeedback('تم إطلاق إنذار: فتح لاكيس بدون زبون بنجاح!');
      } else if (type === 'discount') {
        const res = await fetch('http://localhost:8000/test/trigger-discount', { method: 'POST' });
        if (res.ok) setFeedback('تم إطلاق تدقيق: تخفيض كبير 1000 دج بنجاح!');
      }
      if (onTrigger) onTrigger();
    } catch (e) {
      setFeedback('تعذر الاتصال بالمحرك المحلي. تأكد من تشغيل backend.');
    } finally {
      setLoading('');
      setTimeout(() => setFeedback(''), 3500);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-slate-900/40 to-cyan-500/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <PlayCircle className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-white">أزرار التجربة والمحاكاة الفورية (Live Simulation Suite)</h4>
            <p className="text-xs text-gray-400">
              انقر لتجربة اقتطاع الفيديو الفوري وإرسال التنبيهات واختبار رد فعل الذكاء الاصطناعي
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTestTrigger('no_customer')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            {loading === 'no_customer' ? 'جارٍ الإطلاق...' : 'تجربة: فتح لاكيس بدون زبون 🚨'}
          </button>

          <button
            onClick={() => handleTestTrigger('discount')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Tag className="w-4 h-4" />
            {loading === 'discount' ? 'جارٍ الإطلاق...' : 'تجربة: تخفيض استثنائي 1000 دج 🏷️'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4" />
          {feedback}
        </div>
      )}
    </div>
  );
}
