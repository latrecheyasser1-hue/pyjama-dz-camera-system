import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MidnightReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummaries() {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .order('summary_date', { ascending: false });

      if (!error && data && data.length > 0) {
        setReports(data);
      } else {
        // Sample default preview reports
        setReports([
          {
            id: 'sample-1',
            summary_date: '2026-09-01',
            location: 'hanout',
            title: 'تقرير الحانوت ولاكيس اليومي',
            productivity_score: 94,
            summary_markdown: `• **حركة لاكيس:** تم تسجيل 142 عملية بيع عادية.
• **الحركات الاستثنائية:**
  - 14:09: لاكيس مفتوحة والمسؤول غائب لمدة 12 دقيقة (تم اقتطاع الفيديو).
  - 16:35: تخفيض كبير بقيمة 1000 دج على تذكرة رقم #1042 (مرفق المقطع).
• **أوقات الذروة:** من 17:00 إلى 19:30 (إجمالي 68 زبون).
• **تقييم الانضباط الأمني:** 94% ممتاز.`
          },
          {
            id: 'sample-2',
            summary_date: '2026-09-01',
            location: 'depot',
            title: 'تقرير الديبو ونشاط التغليف',
            productivity_score: 88,
            summary_markdown: `• **إجمالي الطرود المجهزة:** 320 طرد (شركات التوصيل: Yalidine 210, Procolis 110).
• **تجمعات العمال وتضييع الوقت:**
  - 10:14 إلى 10:56: تجمع الخدام #3 مع الخدام #5 في الزاوية C لمدة 42 دقيقة.
• **ساعات العمل الفعلية:** 7 ساعات و 15 دقيقة.`
          }
        ]);
      }
      setLoading(false);
    }

    loadSummaries();
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">تقارير منتصف الليل الذكية (00:00 Summaries)</h3>
            <p className="text-xs text-gray-400">
              ملخصات تنفيذية شاملة بالحركات المشبوهة، ساعات العمل، ومردودية العمال
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          مجدولة آلياً كل ليلة 00:00
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="glass-card rounded-xl p-4 border border-white/5 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-white">{rep.summary_date}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-300">
                  {rep.location === 'hanout' ? '🏪 الحانوت' : rep.location === 'depot' ? '📦 الديبو' : '🧵 الورشة'}
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-400">
                معدل الانضباط: {rep.productivity_score}%
              </div>
            </div>

            <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed font-sans bg-black/30 p-3 rounded-lg border border-white/5">
              {rep.summary_markdown}
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-gray-400 border-t border-white/5">
              <span className="inline-flex items-center gap-1 text-cyan-300">
                <Send className="w-3 h-3" />
                أُرسلت نسخة إلى Telegram
              </span>
              <span>مُراجعة بالذكاء الاصطناعي</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
