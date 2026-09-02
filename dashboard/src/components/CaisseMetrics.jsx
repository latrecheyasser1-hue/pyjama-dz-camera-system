import React from 'react';
import { ShieldAlert, Tag, Users, Clock, TrendingUp } from 'lucide-react';

export default function CaisseMetrics({ metrics }) {
  const cards = [
    {
      title: 'حركات مشبوهة اليوم',
      value: metrics?.suspiciousCount ?? '3',
      subtext: 'مقارنة بـ 0 البارحة',
      icon: ShieldAlert,
      color: 'text-rose-600',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    {
      title: 'تخفيضات تم تدقيقها',
      value: metrics?.discountAudits ?? '1,000 دج',
      subtext: 'عملية واحدة استثنائية',
      icon: Tag,
      color: 'text-amber-600',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      title: 'تدفق الزبائن عند لاكيس',
      value: metrics?.footfall ?? '142',
      subtext: 'ذروة الزبائن: 17:00 - 19:00',
      icon: Users,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'متوسط وقت فتح لاكيس',
      value: metrics?.avgOpenTime ?? '14 ثانية',
      subtext: 'في الحدود الآمنة الطبيعية',
      icon: Clock,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="card-clean rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{c.title}</span>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${c.iconBg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className={`text-xl font-bold ${c.color} font-mono`} dir="ltr">{c.value}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-slate-400" />
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
