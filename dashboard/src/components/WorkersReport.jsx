import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, Video, Send, Plus, Store, Package, Scissors, UserCheck, ShieldAlert, Award, Camera, Upload, Trash2, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WorkersReport() {
  const [workers, setWorkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Worker
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    location: 'hanout',
    workstation: '',
    shiftStart: '08:00',
    shiftEnd: '17:00'
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial seed data
  const initialEvaluations = [
    {
      id: 'w-1',
      full_name: 'أمين بلحاج',
      role: 'مسؤول لاكيس والصندوق',
      location: 'hanout',
      workstation: 'Caisse Principale',
      shift_start: '08:00',
      shift_end: '17:00',
      photo_filename: 'w-1.jpg',
      actual_hours: '7 ساعات و 45 دقيقة',
      idle_minutes: 15,
      performance_score: 88,
      status: 'warning',
      mistakes: [
        {
          time: '14:09:12',
          title: 'فتح درج لاكيس في غياب أي زبون',
          description: 'تم فتح الصندوق لمدة 6 ثوانٍ والمسؤول بمفرده دون وجود عملية بيع.',
          clip_url: 'http://localhost:8000/clips/sample.mp4'
        }
      ],
      positives: [
        'تسجيل 142 عملية بيع عادية بدون عجز في الصندوق.',
        'سرعة خدمة الزبائن خلال فترة الذروة (17:00 - 19:00).'
      ],
      midnight_summary: `تقييم العامل: أمين بلحاج (الحانوت)
• الساعات الفعلية: 7 ساعات و 45 دقيقة.
• الأداء العام: جيد مع ملاحظة أمنية (88%).
• التنبيهات والأخطاء: تم تسجيل فتح درج الصندوق بدون زبون الساعة 14:09 (المقطع مرفق).
• الإيجابيات: خدمة 142 زبون، تصفية الحسابات مطابقة بدون نقص في الصندوق.`
    },
    {
      id: 'w-2',
      full_name: 'فاطمة بن علي',
      role: 'خياطة ماكينة سنجر',
      location: 'atelier',
      workstation: 'Machine Singer #1',
      shift_start: '08:00',
      shift_end: '16:30',
      photo_filename: 'w-2.jpg',
      actual_hours: '8 ساعات كاملة',
      idle_minutes: 0,
      performance_score: 100,
      status: 'excellent',
      mistakes: [],
      positives: [
        'انضباط مثالي: 8 ساعات عمل فعلي على الماكينة.',
        'إنهاء خياطة 45 بيجامة بمستوى جودة ممتاز وبدون توقف غير مبرر.'
      ],
      midnight_summary: `تقييم العاملة: فاطمة بن علي (الورشة)
• الساعات الفعلية: 8 ساعات كاملة (100% انضباط).
• الأداء العام: ممتاز ومثالي (100%).
• التنبيهات والأخطاء: لا توجد أي أخطاء أو غياب عن منصب العمل.
• الإيجابيات: خياطة 45 بيجامة بجودة عالية وتركيز تام طوال اليوم.`
    },
    {
      id: 'w-3',
      full_name: 'عبد القادر رحماني',
      role: 'عامل تحضير وتغليف الطرود',
      location: 'depot',
      workstation: 'Table Emballage #1',
      shift_start: '08:30',
      shift_end: '17:30',
      photo_filename: 'w-3.jpg',
      actual_hours: '6 ساعات و 30 دقيقة',
      idle_minutes: 45,
      performance_score: 82,
      status: 'warning',
      mistakes: [
        {
          time: '10:14:00',
          title: 'تجمع وتضييع وقت في الممر الخلفي',
          description: 'مغادرة طاولة التغليف والتحدث مع عامل آخر لمدة 42 دقيقة في الزاوية C.',
          clip_url: 'http://localhost:8000/clips/sample.mp4'
        }
      ],
      positives: [
        'تغليف وتجهيز 195 طرد لشركة Yalidine في الفترة المسائية.'
      ],
      midnight_summary: `تقييم العامل: عبد القادر رحماني (الديبو)
• الساعات الفعلية: 6 ساعات و 30 دقيقة.
• الأداء العام: متوسط (82%).
• التنبيهات والأخطاء: تضييع 45 دقيقة تجمع وتحدث في الممرات بين 10:14 و 10:56.
• الإيجابيات: تغليف 195 طرد بكفاءة وسرعة جيدة في الفترة المسائية.`
    },
    {
      id: 'w-4',
      full_name: 'سميرة شريفي',
      role: 'فصالة وقص القماش',
      location: 'atelier',
      workstation: 'Table Coupe #2',
      shift_start: '08:00',
      shift_end: '16:30',
      photo_filename: 'w-4.jpg',
      actual_hours: '7 ساعات و 50 دقيقة',
      idle_minutes: 10,
      performance_score: 96,
      status: 'excellent',
      mistakes: [],
      positives: [
        'قص وفصالة 12 رول قماش شتوي بدون إتلاف.',
        'تسليم القطع المفصلة لورشة الخياطة في الوقت المحدد.'
      ],
      midnight_summary: `تقييم العاملة: سميرة شريفي (الورشة)
• الساعات الفعلية: 7 ساعات و 50 دقيقة.
• الأداء العام: ممتاز جداً (96%).
• التنبيهات والأخطاء: لا توجد أخطاء مسجلة.
• الإيجابيات: فصالة 12 رول قماش شتوي بدقة عالية وانضباط تام.`
    }
  ];

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      // Try to fetch from local API server
      const res = await fetch('http://localhost:8000/api/workers');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          // Merge with evaluations
          const merged = data.map((apiW) => {
            const found = initialEvaluations.find((e) => e.full_name === apiW.full_name || e.id === apiW.id);
            return {
              ...apiW,
              actual_hours: found?.actual_hours || '8 ساعات عمل',
              idle_minutes: found?.idle_minutes || 0,
              performance_score: found?.performance_score || 95,
              mistakes: found?.mistakes || [],
              positives: found?.positives || ['الانضباط في الوردية المحددة وحضور منصب العمل.'],
              midnight_summary: found?.midnight_summary || `تقييم العامل: ${apiW.full_name}\n• المنصب: ${apiW.role}\n• الساعات الفعلية: 8 ساعات\n• الحالة: ممتاز`
            };
          });
          setWorkers(merged);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Using default evaluations:', e);
    }
    setWorkers(initialEvaluations);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.role) {
      alert('يرجى كتابة اسم العامل والوظيفة.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('full_name', formData.fullName);
      data.append('role', formData.role);
      data.append('location', formData.location);
      data.append('workstation', formData.workstation || 'منصب العمل الرئيسي');
      data.append('shift_start', formData.shiftStart);
      data.append('shift_end', formData.shiftEnd);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      const res = await fetch('http://localhost:8000/api/workers/enroll', {
        method: 'POST',
        body: data
      });

      if (res.ok) {
        alert(`تم تسجيل العامل ${formData.fullName} وبصمة وجهه بنجاح!`);
        setShowAddModal(false);
        setFormData({
          fullName: '',
          role: '',
          location: 'hanout',
          workstation: '',
          shiftStart: '08:00',
          shiftEnd: '17:00'
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        fetchWorkers();
      } else {
        alert('حدث خطأ أثناء حفظ العامل.');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بخادم الذكاء الاصطناعي.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorker = async (wid) => {
    if (!confirm('هل تريد حذف هذا العامل من النظام وبصمة الوجه؟')) return;
    try {
      await fetch(`http://localhost:8000/api/workers/${wid}`, { method: 'DELETE' });
      setWorkers((prev) => prev.filter((w) => w.id !== wid));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = workers.filter((w) => {
    if (selectedLocation === 'hanout') return w.location === 'hanout';
    if (selectedLocation === 'depot') return w.location === 'depot';
    if (selectedLocation === 'atelier') return w.location === 'atelier';
    return true;
  });

  return (
    <div className="card-clean rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 border border-slate-200">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">سجل أداء العمال والتعرف على الوجوه بالاسم</h3>
            <p className="text-xs text-slate-500">
              تسجيل صورة واسم كل عامل ليتعرف عليه النظام بالكاميرا + تقارير 00:00 الفردية
            </p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عامل وتصويرته (Face ID)</span>
          </button>

          {/* Location Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedLocation === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({workers.length})
            </button>
            <button
              onClick={() => setSelectedLocation('hanout')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedLocation === 'hanout' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الحانوت
            </button>
            <button
              onClick={() => setSelectedLocation('depot')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedLocation === 'depot' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الديبو
            </button>
            <button
              onClick={() => setSelectedLocation('atelier')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedLocation === 'atelier' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الورشة
            </button>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((worker) => {
          const photoUrl = worker.photo_filename
            ? `http://localhost:8000/api/workers/photos/${worker.photo_filename}`
            : null;

          return (
            <div
              key={worker.id}
              className="bg-slate-50/60 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-3.5 hover:border-slate-300 transition-all relative group"
            >
              {/* Worker Top Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs bg-slate-200 shrink-0">
                      <img
                        src={photoUrl}
                        alt={worker.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                      {worker.full_name.split(' ')[0][0]}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900">{worker.full_name}</h4>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        بصمة وجه مفعلة
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{worker.role} &bull; {worker.workstation}</p>
                    <p className="text-[10px] text-slate-400 font-mono" dir="ltr">وردية: {worker.shift_start || '08:00'} - {worker.shift_end || '17:00'}</p>
                  </div>
                </div>

                {/* Score & Delete */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                      worker.performance_score >= 95
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : worker.performance_score >= 85
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                    dir="ltr"
                  >
                    {worker.performance_score}%
                  </span>
                  <button
                    onClick={() => handleDeleteWorker(worker.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                    title="حذف العامل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <div>
                    <span className="block text-[10px] text-slate-400">ساعات العمل الفعلية:</span>
                    <span className="font-bold text-slate-800">{worker.actual_hours}</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 ${worker.idle_minutes > 20 ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-[10px] text-slate-400">وقت التوقف / التضييع:</span>
                    <span className="font-bold text-slate-800">{worker.idle_minutes} دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Mistakes / Anomalies Section */}
              {worker.mistakes && worker.mistakes.length > 0 ? (
                <div className="space-y-1.5 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>تنبيهات وأخطاء مسجلة ({worker.mistakes.length}):</span>
                  </div>
                  {worker.mistakes.map((m, idx) => (
                    <div key={idx} className="text-xs text-rose-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{m.title}</span>
                        <span className="font-mono text-[10px] text-rose-700" dir="ltr">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>عمل متقن: لم يتم تسجيل أي أخطاء أو مخالفات أمنية اليوم.</span>
                </div>
              )}

              {/* Positives Section */}
              {worker.positives && worker.positives.length > 0 && (
                <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>نقاط الإشادة والإنجاز:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {worker.positives.map((pos, pIdx) => (
                      <li key={pIdx}>{pos}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 00:00 Telegram Report Box */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-slate-600 text-[11px]">
                  <Send className="w-3 h-3 text-slate-400" />
                  يُرسل في تقرير 00:00 باسم: <strong>{worker.full_name}</strong>
                </span>
                <button
                  onClick={() => setSelectedWorker(worker)}
                  className="text-slate-800 font-bold hover:underline text-[11px]"
                >
                  معاينة نص التقرير
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Worker & Face ID Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card-clean w-full max-w-lg rounded-xl p-5 border border-slate-200 shadow-2xl relative bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">تسجيل عامل جديد وبصمة الوجه (Face ID)</h4>
                  <p className="text-xs text-slate-500">حفظ صورة العامل ليتعرف عليه الذكاء الاصطناعي في الكاميرات</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-4">
              {/* Photo Upload Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">صورة العامل (بصمة الوجه):</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-emerald-400 animate-pulse rounded-full" />
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-800">اضغط لرفع صورة واضحة لوجه العامل</p>
                        <p className="text-[11px] text-slate-400">JPG أو PNG من الهاتف أو البيسي</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم واللقب:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أمين بلحاج"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوظيفة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مسؤول الصندوق"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Location & Workstation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع:</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="hanout">الحانوت</option>
                    <option value="depot">الديبو (المستودع)</option>
                    <option value="atelier">الورشة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">منصب العمل (Workstation):</label>
                  <input
                    type="text"
                    placeholder="مثال: Caisse #1 أو Table Emballage"
                    value={formData.workstation}
                    onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">بداية الوردية:</label>
                  <input
                    type="time"
                    value={formData.shiftStart}
                    onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نهاية الوردية:</label>
                  <input
                    type="time"
                    value={formData.shiftEnd}
                    onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
                >
                  {submitting ? 'جارٍ الحفظ وبناء البصمة...' : 'حفظ العامل وتفعيل بصمة الوجه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card-clean w-full max-w-lg rounded-xl p-5 border border-slate-200 shadow-2xl relative bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">معاينة تقرير منتصف الليل الفردي</h4>
                <p className="text-xs text-slate-500">{selectedWorker.full_name} &bull; {selectedWorker.role}</p>
              </div>
              <button
                onClick={() => setSelectedWorker(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {selectedWorker.midnight_summary}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                مجدول للإرسال التلقائي عبر Telegram كل ليلة 00:00
              </span>
              <button
                onClick={() => setSelectedWorker(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
