import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Clock, AlertTriangle, CheckCircle2, Tag, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function IncidentTimeline({ onNewAlert }) {
  const [events, setEvents] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch initial events
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

    // Subscribe to Supabase Realtime for instant alerts
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" />
          حرج / عاجل
        </span>
      );
    }
    if (type === 'suspicious_reach') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Tag className="w-3 h-3" />
          تدقيق مالي
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        تنبيه نظام
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col h-full">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">سجل التنبيهات والحركات المشبوهة</h3>
            <p className="text-xs text-gray-400">مزامنة لحظية مباشرة عبر Supabase</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filter === 'all' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            الكل ({events.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filter === 'critical' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            حرجة 🚨
          </button>
          <button
            onClick={() => setFilter('discount')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filter === 'discount' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            تخفيضات 🏷️
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">جارٍ جلب السجل من السحابة...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            لا توجد حوادث أمنية مسجلة حتى الآن. الأوضاع مستقرة!
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
                className="glass-card rounded-xl p-3.5 border border-white/5 hover:border-white/20 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">{timeFormatted}</span>
                      {getSeverityBadge(item.severity, item.event_type)}
                    </div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>

                  {/* Video Clip Play Button */}
                  <button
                    onClick={() => {
                      const videoUrl = item.local_clip_path
                        ? `http://localhost:8000/clips/${item.local_clip_path.split('\\').pop().split('/').pop()}`
                        : 'http://localhost:8000/clips/sample.mp4';
                      setSelectedVideo({ url: videoUrl, title: item.title, time: timeFormatted });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    مشاهدة المقطع 📹
                  </button>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Video Replay Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedVideo.title}</h4>
                <p className="text-xs text-amber-400 font-mono">{selectedVideo.time}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
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
