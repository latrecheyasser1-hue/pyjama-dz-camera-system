import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Clock, AlertTriangle, CheckCircle2, Tag, FileText, X, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function IncidentTimeline({ onNewAlert }) {
  const [events, setEvents] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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

  const filteredEvents = events.filter((ev) => {
    if (filter === 'critical') return ev.severity === 'critical';
    if (filter === 'discount') return ev.event_type === 'suspicious_reach' || ev.title.includes('تخفيض');
    if (filter === 'unattended') return ev.event_type === 'caisse_unattended';
    return true;
  });

  const getSeverityBadge = (severity, type) => {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
          <AlertTriangle className="w-3 h-3" />
          حرج
        </span>
      );
    }
    if (type === 'suspicious_reach') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
          <Tag className="w-3 h-3" />
          تدقيق مالي
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        تنبيه
      </span>
    );
  };

  return (
    <div className="card-clean rounded-xl p-4 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-rose-400 border border-slate-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">سجل التنبيهات الأمنية</h3>
            <p className="text-[11px] text-slate-400">مزامنة سحابية لحظية</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-xs transition-all ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({events.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-2 py-0.5 rounded text-xs transition-all ${
              filter === 'critical' ? 'bg-rose-900 text-rose-200 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            حرجة
          </button>
          <button
            onClick={() => setFilter('discount')}
            className={`px-2 py-0.5 rounded text-xs transition-all ${
              filter === 'discount' ? 'bg-slate-700 text-slate-200 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            تخفيضات
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">جارٍ جلب السجل...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            لا توجد تنبيهات أمنية مسجلة.
          </div>
        ) : (
          filteredEvents.map((item) => {
            const timeFormatted = new Date(item.created_at).toLocaleTimeString('ar-DZ', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="bg-[#090d16] rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400" dir="ltr">{timeFormatted}</span>
                      {getSeverityBadge(item.severity, item.event_type)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                  </div>

                  <button
                    onClick={() => {
                      const videoUrl = item.local_clip_path
                        ? `http://localhost:8000/clips/${item.local_clip_path.split('\\').pop().split('/').pop()}`
                        : 'http://localhost:8000/clips/sample.mp4';
                      setSelectedVideo({ url: videoUrl, title: item.title, time: timeFormatted });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold hover:bg-slate-700 transition-all shrink-0"
                  >
                    <Video className="w-3 h-3 text-amber-400" />
                    مشاهدة المقطع
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Video Replay Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="card-clean w-full max-w-2xl rounded-xl p-4 border border-slate-700 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedVideo.title}</h4>
                <p className="text-xs text-amber-500 font-mono" dir="ltr">{selectedVideo.time}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800">
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
