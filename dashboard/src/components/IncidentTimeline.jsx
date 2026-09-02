import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Clock, AlertTriangle, CheckCircle2, Tag, FileText, X, Video, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function IncidentTimeline({ onNewAlert }) {
  const [events, setEvents] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    }

    fetchEvents();

    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          setEvents((prev) => [payload.new, ...prev]);
          if (onNewAlert) onNewAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClearLogs = async () => {
    if (!confirm('هل تريد مسح سجل التنبيهات التجريبية بالكامل؟')) return;
    setClearing(true);
    try {
      await supabase.from('security_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setEvents([]);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filter === 'critical') return ev.severity === 'critical';
    if (filter === 'discount') return ev.event_type === 'suspicious_reach' || ev.title.includes('تخفيض');
    if (filter === 'unattended') return ev.event_type === 'caisse_unattended';
    return true;
  });

  const getSeverityBadge = (severity, type) => {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          حرج
        </span>
      );
    }
    if (type === 'suspicious_reach') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Tag className="w-3 h-3 text-amber-600" />
          تدقيق مالي
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        تنبيه
      </span>
    );
  };

  return (
    <div className="card-clean rounded-xl p-4 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="space-y-3 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">سجل التنبيهات الأمنية</h3>
              <p className="text-[11px] text-slate-500">مزامنة سحابية لحظية</p>
            </div>
          </div>

          {events.length > 0 && (
            <button
              onClick={handleClearLogs}
              disabled={clearing}
              title="مسح سجل التجارب"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded text-xs transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({events.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-1 py-1 rounded text-xs transition-all ${
              filter === 'critical' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حرجة
          </button>
          <button
            onClick={() => setFilter('discount')}
            className={`flex-1 py-1 rounded text-xs transition-all ${
              filter === 'discount' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تخفيضات
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">جارٍ جلب السجل...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            لا توجد تنبيهات أمنية مسجلة حالياً.
          </div>
        ) : (
          filteredEvents.map((item) => {
            const timeFormatted = new Date(item.created_at).toLocaleTimeString('ar-DZ', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            // Clean title from English brackets if any
            const cleanTitle = item.title.replace(/\s*\(No Customer\)/gi, '').replace(/\s*\(Customer/gi, '');

            return (
              <div
                key={item.id}
                className="bg-slate-50/70 rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-2"
              >
                {/* Top Row: Time & Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 font-bold" dir="ltr">{timeFormatted}</span>
                  {getSeverityBadge(item.severity, item.event_type)}
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{cleanTitle}</h4>

                {/* Description */}
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>

                {/* Video Clip Button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => {
                      const videoUrl = item.local_clip_path
                        ? `http://localhost:8000/clips/${item.local_clip_path.split('\\').pop().split('/').pop()}`
                        : 'http://localhost:8000/clips/sample.mp4';
                      setSelectedVideo({ url: videoUrl, title: cleanTitle, time: timeFormatted });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-300 text-[11px] font-semibold hover:bg-slate-50 shadow-xs transition-all"
                  >
                    <Video className="w-3 h-3 text-slate-600" />
                    مشاهدة المقطع
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Video Replay Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card-clean w-full max-w-2xl rounded-xl p-4 border border-slate-200 shadow-2xl relative bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedVideo.title}</h4>
                <p className="text-xs text-slate-500 font-mono" dir="ltr">{selectedVideo.time}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-200">
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
