import React from 'react';
import { ShieldAlert, Tag, Users, Clock, TrendingUp } from 'lucide-react';

export default function CaisseMetrics({ metrics }) {
  const cards = [
    {
      title: 'حركات مشبوهة اليوم',
      value: metrics?.suspiciousCount ?? '3',
      subtext: 'مقارنة بـ 0 البارحة',
      icon: ShieldAlert,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10'
    },
    {
      title: 'تخفيضات تم تدقيقها',
      value: metrics?.discountAudits ?? '1,000 دج',
      subtext: 'عملية واحدة استثنائية',
      icon: Tag,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'تدفق الزبائن عند لاكيس',
      value: metrics?.footfall ?? '142',
      subtext: 'ذروة الزبائن: 17:00 - 19:00',
      icon: Users,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'متوسط وقت فتح لاكيس',
      value: metrics?.avgOpenTime ?? '14 ثانية',
      subtext: 'في الحدود الآمنة الطبيعية',
      icon: Clock,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-4 border ${c.border} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400">{c.title}</span>
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={`text-2xl font-black ${c.color} font-mono tracking-tight`}>{c.value}</div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-gray-500" />
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
