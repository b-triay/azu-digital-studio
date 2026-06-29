'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, X, Plus, Filter, Save, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface CalClient {
  id: string;
  name: string;
  color: string;
}

interface CalPost {
  id: string;
  client_id: string;
  platform: string;
  title: string;
  caption: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';
  scheduled_for: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  published:        { dot: '#16a34a', bg: '#f0fdf4', text: '#16a34a', label: 'Publicado' },
  approved:         { dot: '#2563eb', bg: '#eff6ff', text: '#2563eb', label: 'Aprobado' },
  pending_approval: { dot: '#B8976C', bg: '#fff7ed', text: '#ea580c', label: 'Pendiente' },
  draft:            { dot: '#8A9BB0', bg: '#EDE9E1', text: '#5A6B80', label: 'Borrador' },
  rejected:         { dot: '#dc2626', bg: '#fef2f2', text: '#dc2626', label: 'Rechazado' },
};

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'email'] as const;

const getDaysInMonth    = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffCalendarPage() {
  const t = useTranslations('portal');
  const params = useParams();
  const locale = params.locale as string;

  const [year, setYear]         = useState(() => new Date().getFullYear());
  const [month, setMonth]       = useState(() => new Date().getMonth());
  const [clientId, setClientId] = useState('all');
  const [posts, setPosts]       = useState<CalPost[]>([]);
  const [clients, setClients]   = useState<CalClient[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Filters
  const [filterToday, setFilterToday] = useState(false);
  const [filterMine, setFilterMine]   = useState(false);
  const [myPostIds, setMyPostIds]     = useState<Set<string>>(new Set());

  // Modals
  const [detailPost, setDetailPost]     = useState<CalPost | null>(null);
  const [editingPost, setEditingPost]   = useState(false);
  const [editForm, setEditForm]         = useState<Partial<CalPost>>({});
  const [savingEdit, setSavingEdit]     = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [createDay, setCreateDay]       = useState<number>(new Date().getDate());
  const [createForm, setCreateForm]     = useState({ client_id: '', platform: 'instagram', title: '', status: 'draft' as CalPost['status'], time: '09:00' });
  const [savingCreate, setSavingCreate] = useState(false);

  const today = new Date();

  const loadClients = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('clients').select('id, name, color').order('name');
    if (data && data.length > 0) {
      setClients(data.map((c) => ({ id: c.id, name: c.name, color: c.color ?? '#8A9BB0' })));
    }
  }, []);

  const loadMyPostIds = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: sm } = await supabase.from('staff_members').select('id').eq('email', user.email).single();
    if (!sm) return;
    const { data: assignments } = await supabase.from('post_assignments').select('post_id').eq('staff_member_id', sm.id);
    setMyPostIds(new Set((assignments ?? []).map((a: { post_id: string }) => a.post_id)));
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    let q = supabase
      .from('posts')
      .select('id, client_id, platform, title, caption, status, scheduled_for')
      .gte('scheduled_for', start)
      .lte('scheduled_for', end)
      .order('scheduled_for');
    if (clientId !== 'all') q = q.eq('client_id', clientId);
    const { data } = await q;
    setPosts(data ?? []);
    setLoading(false);
  }, [year, month, clientId]);

  useEffect(() => { loadClients(); loadMyPostIds(); }, [loadClients, loadMyPostIds]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const filteredPosts = posts.filter(p => {
    if (filterMine && !myPostIds.has(p.id)) return false;
    if (filterToday) {
      const d = new Date(p.scheduled_for);
      if (d.getFullYear() !== today.getFullYear() || d.getMonth() !== today.getMonth() || d.getDate() !== today.getDate()) return false;
    }
    return true;
  });

  const postsByDay = filteredPosts.reduce<Record<number, CalPost[]>>((acc, p) => {
    const day = new Date(p.scheduled_for).getDate();
    acc[day] = acc[day] ?? [];
    acc[day].push(p);
    return acc;
  }, {});

  const openCreate = (day: number) => {
    setCreateDay(day);
    setCreateForm({ client_id: clients[0]?.id ?? '', platform: 'instagram', title: '', status: 'draft', time: '09:00' });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.client_id || savingCreate) return;
    setSavingCreate(true);
    const supabase = createClient();
    const [hh, mm] = createForm.time.split(':').map(Number);
    const d = new Date(year, month, createDay, hh, mm);
    await supabase.from('posts').insert({
      client_id: createForm.client_id,
      platform:  createForm.platform,
      title:     createForm.title.trim(),
      caption:   '',
      status:    createForm.status,
      scheduled_for: d.toISOString(),
    });
    setSavingCreate(false);
    setShowCreate(false);
    loadPosts();
  };

  const openDetail = (post: CalPost) => {
    setDetailPost(post);
    setEditingPost(false);
    setEditForm({ ...post });
  };

  const handleSaveEdit = async () => {
    if (!detailPost || savingEdit) return;
    setSavingEdit(true);
    const supabase = createClient();
    await supabase.from('posts').update({
      title:        editForm.title,
      status:       editForm.status,
      scheduled_for: editForm.scheduled_for,
      platform:     editForm.platform,
    }).eq('id', detailPost.id);
    setSavingEdit(false);
    setDetailPost(null);
    loadPosts();
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>
            {t('calendar.title')}
          </h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
            {t('calendar.subtitle')}
          </p>
        </div>
        <Link
          href={`/${locale}/portal/staff/content/new`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: '#0A0F1C', color: '#ffffff', boxShadow: '0 2px 8px rgba(10,15,28,0.25)' }}
        >
          <Plus size={14} /> Nueva publicación
        </Link>
      </motion.div>

      {/* Calendar card */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Calendar header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)] transition-colors">
              <ChevronLeft size={16} style={{ color: '#5A6B80' }} />
            </button>
            <h2 className="text-sm font-bold w-44 text-center" style={{ color: '#0A0F1C' }}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)] transition-colors">
              <ChevronRight size={16} style={{ color: '#5A6B80' }} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#EDE9E1' }}>
              <button
                onClick={() => { setFilterToday(f => !f); if (!filterToday) { setYear(today.getFullYear()); setMonth(today.getMonth()); } }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: filterToday ? '#0A0F1C' : 'transparent', color: filterToday ? '#ffffff' : '#5A6B80' }}
              >
                Hoy
              </button>
              <button
                onClick={() => setFilterMine(f => !f)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: filterMine ? '#0A0F1C' : 'transparent', color: filterMine ? '#ffffff' : '#5A6B80' }}
              >
                <Filter size={10} /> Solo lo mío
              </button>
            </div>

            {/* Client filter */}
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setSelectedDay(null); }}
              className="text-xs px-3 py-2 rounded-xl outline-none"
              style={{ border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', background: '#F7F4EE', fontFamily: 'inherit' }}
            >
              <option value="all">Todos los clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Status legend */}
        <div className="px-5 py-2 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ background: '#fafbfc', borderBottom: '1px solid rgba(10,15,28,0.05)' }}>
          {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
            <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#5A6B80' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Day-of-week labels */}
        <div
          className="grid grid-cols-7 text-center"
          style={{ borderBottom: '1px solid rgba(10,15,28,0.06)', background: '#F7F4EE' }}
        >
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#8A9BB0' }} />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-b border-r min-h-[90px]"
                style={{ borderColor: 'rgba(10,15,28,0.05)' }}
              />
            ))}

            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const day = i + 1;
              const dayPosts = postsByDay[day] ?? [];
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSelected = selectedDay === day;
              return (
                <div
                  key={day}
                  className="border-b border-r min-h-[90px] p-2 transition-colors group"
                  style={{
                    borderColor: 'rgba(10,15,28,0.05)',
                    background: isSelected ? 'rgba(184,151,108,0.1)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <button
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80"
                      style={{
                        background: isToday ? '#0A0F1C' : 'transparent',
                        color: isToday ? '#fff' : '#334155',
                      }}
                    >
                      {day}
                    </button>
                    <button
                      onClick={() => openCreate(day)}
                      className="w-5 h-5 rounded-full items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                      style={{ background: 'rgba(10,15,28,0.08)', color: '#5A6B80' }}
                      title="Crear publicación en este día"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayPosts.slice(0, 3).map(p => {
                      const client = clients.find(c => c.id === p.client_id);
                      const color = client?.color ?? '#8A9BB0';
                      const cfg = STATUS_CONFIG[p.status];
                      return (
                        <button
                          key={p.id}
                          onClick={() => openDetail(p)}
                          className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-1 rounded w-full text-left truncate hover:opacity-80 transition-opacity"
                          style={{ background: color + '18', color }}
                          title={p.title}
                        >
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg?.dot ?? '#8A9BB0' }} />
                          <span className="truncate">{p.title}</span>
                        </button>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <div className="text-[9px] font-bold pl-1" style={{ color: '#8A9BB0' }}>+{dayPosts.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected day panel */}
        <AnimatePresence>
          {selectedDay !== null && (postsByDay[selectedDay] ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              style={{ borderTop: '1px solid rgba(10,15,28,0.08)' }}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>
                    {MONTH_NAMES[month]} {selectedDay}
                  </p>
                  <button
                    onClick={() => openCreate(selectedDay)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                    style={{ color: '#0A0F1C' }}
                  >
                    <Plus size={11} /> Agregar
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {(postsByDay[selectedDay] ?? []).map(p => {
                    const client = clients.find(c => c.id === p.client_id);
                    const cfg = STATUS_CONFIG[p.status];
                    return (
                      <button
                        key={p.id}
                        onClick={() => openDetail(p)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left hover:shadow-sm transition-all"
                        style={{ background: '#F7F4EE', border: '1px solid rgba(10,15,28,0.07)' }}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg?.dot ?? '#8A9BB0' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: '#0A0F1C' }}>{p.title}</p>
                          <p className="text-[10px]" style={{ color: '#8A9BB0' }}>
                            {client?.name ?? '—'} · {p.platform} · {new Date(p.scheduled_for).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: cfg?.bg, color: cfg?.text }}
                        >
                          {cfg?.label ?? p.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Post Detail Modal ── */}
      <AnimatePresence>
        {detailPost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setDetailPost(null); }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Modal header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>
                  {editingPost ? 'Editar publicación' : 'Detalle de publicación'}
                </h3>
                <button onClick={() => setDetailPost(null)} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)]">
                  <X size={14} style={{ color: '#5A6B80' }} />
                </button>
              </div>

              <div className="px-5 py-4 flex flex-col gap-3">
                {editingPost ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8A9BB0' }}>Título</label>
                      <input
                        value={editForm.title ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8A9BB0' }}>Estado</label>
                        <select
                          value={editForm.status ?? 'draft'}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value as CalPost['status'] }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                        >
                          <option value="draft">Borrador</option>
                          <option value="pending_approval">Pendiente</option>
                          <option value="approved">Aprobado</option>
                          <option value="published">Publicado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8A9BB0' }}>Plataforma</label>
                        <select
                          value={editForm.platform ?? 'instagram'}
                          onChange={e => setEditForm(f => ({ ...f, platform: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                        >
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8A9BB0' }}>Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduled_for ? new Date(editForm.scheduled_for).toISOString().slice(0, 16) : ''}
                        onChange={e => setEditForm(f => ({ ...f, scheduled_for: new Date(e.target.value).toISOString() }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Read mode */}
                    <div className="flex items-start gap-3 px-3 py-3 rounded-xl" style={{ background: '#F7F4EE' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{detailPost.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>
                          {clients.find(c => c.id === detailPost.client_id)?.name ?? '—'} · {detailPost.platform}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#8A9BB0' }}>
                          {new Date(detailPost.scheduled_for).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {' '}·{' '}
                          {new Date(detailPost.scheduled_for).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: STATUS_CONFIG[detailPost.status]?.bg, color: STATUS_CONFIG[detailPost.status]?.text }}
                      >
                        {STATUS_CONFIG[detailPost.status]?.label}
                      </span>
                    </div>
                    {detailPost.caption && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8A9BB0' }}>Caption</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{detailPost.caption}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-5 pb-4 flex items-center gap-2">
                {editingPost ? (
                  <>
                    <button
                      onClick={() => setEditingPost(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: '#EDE9E1', color: '#5A6B80' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                      style={{ background: '#0A0F1C', color: '#ffffff' }}
                    >
                      {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Guardar
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/portal/staff/content/new`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                      style={{ color: '#5A6B80' }}
                    >
                      <ExternalLink size={12} /> Abrir en editor
                    </Link>
                    <button
                      onClick={() => setEditingPost(true)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: '#0A0F1C', color: '#ffffff' }}
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Post Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Nueva publicación</h3>
                  <p className="text-xs" style={{ color: '#8A9BB0' }}>{MONTH_NAMES[month]} {createDay}, {year}</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)]">
                  <X size={14} style={{ color: '#5A6B80' }} />
                </button>
              </div>

              <div className="px-5 py-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>Título</label>
                  <input
                    value={createForm.title}
                    onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ej. Story de producto"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>Cliente</label>
                    <select
                      value={createForm.client_id}
                      onChange={e => setCreateForm(f => ({ ...f, client_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                    >
                      <option value="">Selecciona…</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>Plataforma</label>
                    <select
                      value={createForm.platform}
                      onChange={e => setCreateForm(f => ({ ...f, platform: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                    >
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>Hora</label>
                    <input
                      type="time"
                      value={createForm.time}
                      onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>Estado</label>
                    <select
                      value={createForm.status}
                      onChange={e => setCreateForm(f => ({ ...f, status: e.target.value as CalPost['status'] }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                    >
                      <option value="draft">Borrador</option>
                      <option value="pending_approval">Pendiente</option>
                      <option value="approved">Aprobado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#EDE9E1', color: '#5A6B80' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!createForm.title.trim() || !createForm.client_id || savingCreate}
                  className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: '#0A0F1C', color: '#ffffff' }}
                >
                  {savingCreate ? <Loader2 size={13} className="animate-spin" /> : null}
                  Crear publicación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
