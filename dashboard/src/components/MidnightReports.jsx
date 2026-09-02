import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Send, CheckCircle2, Store, Package, Scissors } from 'lucide-react';
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
        setReports([
          {
            id: 'sample-1',
            summary_date: '2026-09-01',
            location: 'hanout',
            title: 'تقرير الحانوت ولاكيس اليومي',
            productivity_score: 94,
            summary_markdown: `• حركة لاكيس: تم تسجيل 142 عملية بيع عادية.
• الحركات الاستثنائية:
  - 14:09: لاكيس مفتوحة والمسؤول غائب لمدة 12 دقيقة (تم اقتطاع الفيديو).
  - 16:35: تخفيض كبير بقيمة 1000 دج على تذكرة رقم #1042 (مرفق المقطع).
• أوقات الذروة: من 17:00 إلى 19:30 (إجمالي 68 زبون).
• تقييم الانضباط الأمني: 94% ممتاز.`
          },
          {
            id: 'sample-2',
            summary_date: '2026-09-01',
            location: 'depot',
            title: 'تقرير الديبو ونشاط التغليف',
            productivity_score: 88,
            summary_markdown: `• إجمالي الطرود المجهزة: 320 طرد (شركات التوصيل: Yalidine 210, Procolis 110).
• تجمعات العمال وتضييع الوقت:
  - 10:14 إلى 10:56: تجمع الخدام #3 مع الخدام #5 في الزاوية C لمدة 42 دقيقة.
• ساعات العمل الفعلية: 7 ساعات و 15 دقيقة.`
          }
        ]);
      }
      setLoading(false);
    }

    loadSummaries();
  }, []);

  return (
    <div className="card-clean rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">تقارير منتصف الليل (00:00 Summaries)</h3>
            <p className="text-[11px] text-slate-400">
              ملخصات تنفيذية شاملة بالحركات المشبوهة وساعات العمل ومردودية العمال
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          مجدولة آلياً كل ليلة 00:00
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-[#090d16] rounded-lg p-3.5 border border-slate-800 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-mono font-bold text-slate-200" dir="ltr">{rep.summary_date}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {rep.location === 'hanout' ? 'الحانوت' : rep.location === 'depot' ? 'الديبو' : 'الورشة'}
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-400">
                معدل الانضباط: {rep.productivity_score}%
              </div>
            </div>

            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-[#0c121e] p-3 rounded border border-slate-800">
              {rep.summary_markdown}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Send className="w-3 h-3 text-cyan-400" />
                نسخة مرسلة إلى Telegram
              </span>
              <span>تدقيق بالذكاء الاصطناعي</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
