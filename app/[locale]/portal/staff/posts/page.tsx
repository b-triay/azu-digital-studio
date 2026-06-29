'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, Pencil, Trash2, Loader2, Camera, Play, Mail,
  X, Check, CalendarDays,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'email';
type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';

interface StaffChip {
  name: string;
  color: string;
}

interface Post {
  id: string;
  title: string;
  caption: string;
  platform: Platform;
  content_type: string;
  status: PostStatus;
  scheduled_for: string | null;
  custom_rate_usd: number | null;
  client_id: string;
  created_at: string;
  // joined
  clientName: string;
  clientInitials: string;
  clientColor: string;
  staff: StaffChip[];
}

interface Client {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface EditForm {
  title: string;
  caption: string;
  platform: Platform;
  status: PostStatus;
  scheduled_for: string;
  custom_rate_usd: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#c026d3', bg: 'rgba(192,38,211,0.08)', Icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#0f0f0f', bg: 'rgba(10,15,28,0.08)',   Icon: () => <span className="text-[10px] font-black leading-none">TK</span> },
  youtube:   { label: 'YouTube',   color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  Icon: Play },
  email:     { label: 'Email',     color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  Icon: Mail },
};

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bg: string }> = {
  published:        { label: 'Publicado',   color: '#16a34a', bg: '#f0fdf4' },
  approved:         { label: 'Aprobado',    color: '#2563eb', bg: '#eff6ff' },
  pending_approval: { label: 'Pendiente',   color: '#d97706', bg: '#fffbeb' },
  draft:            { label: 'Borrador',    color: '#5A6B80', bg: '#F7F4EE' },
  rejected:         { label: 'Rechazado',   color: '#dc2626', bg: '#fef2f2' },
};

const ALL_STATUSES: PostStatus[] = ['draft', 'pending_approval', 'approved', 'published', 'rejected'];

function formatDate(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDatetimeLocal(ts: string | null) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1.5px solid rgba(10,15,28,0.12)',
  color: '#334155',
  fontFamily: 'inherit',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPostsPage() {
  const t = useTranslations('portal');
  const params = useParams();
  const locale = params.locale as string;

  const [posts, setPosts]       = useState<Post[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);

  const [query, setQuery]               = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusTab, setStatusTab]       = useState<'all' | PostStatus>('all');

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm]       = useState<EditForm>({ title: '', caption: '', platform: 'instagram', status: 'draft', scheduled_for: '', custom_rate_usd: '' });
  const [saving, setSaving]           = useState(false);
  const [editError, setEditError]     = useState('');

  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [postsRes, clientsRes, assignmentsRes, staffRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, caption, platform, content_type, status, scheduled_for, custom_rate_usd, client_id, created_at')
        .order('scheduled_for', { ascending: false }),
      supabase.from('clients').select('id, name, initials, color'),
      supabase.from('post_assignments').select('post_id, staff_member_id'),
      supabase.from('staff_members').select('id, name, color'),
    ]);

    const cls: Client[] = (clientsRes.data ?? []).map((c: { id: string; name: string; initials: string; color: string }) => ({
      id: c.id, name: c.name, initials: c.initials ?? c.name.slice(0, 2).toUpperCase(), color: c.color ?? '#0A0F1C',
    }));
    setClients(cls);
    const clMap = new Map(cls.map((c) => [c.id, c]));

    const staffMap = new Map((staffRes.data ?? []).map((s: { id: string; name: string; color: string }) => [s.id, s]));
    const postStaffMap: Record<string, StaffChip[]> = {};
    for (const a of (assignmentsRes.data ?? []) as { post_id: string; staff_member_id: string }[]) {
      const s = staffMap.get(a.staff_member_id);
      if (!s) continue;
      (postStaffMap[a.post_id] ??= []).push({ name: s.name, color: s.color });
    }

    const ps: Post[] = (postsRes.data ?? []).map((p: {
      id: string; title: string; caption: string; platform: string; content_type: string;
      status: string; scheduled_for: string | null; custom_rate_usd: number | null;
      client_id: string; created_at: string;
    }) => {
      const cl = clMap.get(p.client_id);
      return {
        ...p,
        platform: (p.platform ?? 'instagram') as Platform,
        status: (p.status ?? 'draft') as PostStatus,
        clientName: cl?.name ?? '—',
        clientInitials: cl?.initials ?? '??',
        clientColor: cl?.color ?? '#0A0F1C',
        staff: postStaffMap[p.id] ?? [],
      };
    });
    setPosts(ps);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title ?? '',
      caption: post.caption ?? '',
      platform: post.platform,
      status: post.status,
      scheduled_for: toDatetimeLocal(post.scheduled_for),
      custom_rate_usd: post.custom_rate_usd != null ? String(post.custom_rate_usd) : '',
    });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setSaving(true);
    setEditError('');
    const supabase = createClient();
    const { error } = await supabase.from('posts').update({
      title: editForm.title,
      caption: editForm.caption,
      platform: editForm.platform,
      status: editForm.status,
      scheduled_for: editForm.scheduled_for ? new Date(editForm.scheduled_for).toISOString() : null,
      custom_rate_usd: editForm.custom_rate_usd !== '' ? parseFloat(editForm.custom_rate_usd) : null,
    }).eq('id', editingPost.id);
    if (error) { setEditError(error.message); setSaving(false); return; }
    setSaving(false);
    setEditingPost(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from('posts').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = posts
    .filter((p) => statusTab === 'all' || p.status === statusTab)
    .filter((p) => clientFilter === 'all' || p.client_id === clientFilter)
    .filter((p) => p.title?.toLowerCase().includes(query.toLowerCase()) || p.clientName.toLowerCase().includes(query.toLowerCase()));

  const STATUS_TABS: Array<{ key: 'all' | PostStatus; label: string }> = [
    { key: 'all',             label: `Todos (${posts.length})` },
    { key: 'draft',           label: `Borradores (${posts.filter(p => p.status === 'draft').length})` },
    { key: 'pending_approval',label: `Pendientes (${posts.filter(p => p.status === 'pending_approval').length})` },
    { key: 'approved',        label: `Aprobados (${posts.filter(p => p.status === 'approved').length})` },
    { key: 'published',       label: `Publicados (${posts.filter(p => p.status === 'published').length})` },
    { key: 'rejected',        label: `Rechazados (${posts.filter(p => p.status === 'rejected').length})` },
  ];

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('nav.posts')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
            {posts.length} publicaciones registradas
          </p>
        </div>
        <Link
          href={`/${locale}/portal/staff/content/new`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#0A0F1C', color: '#ffffff' }}
        >
          <Plus size={15} />
          Nueva Publicación
        </Link>
      </motion.div>

      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {/* Filters bar */}
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.08)' }}>
            <Search size={13} style={{ color: '#8A9BB0', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar por título o cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#334155', fontFamily: 'inherit' }}
            />
          </div>
          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.08)', color: '#334155', fontFamily: 'inherit', minWidth: 160 }}
          >
            <option value="all">Todos los clientes</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Status tabs */}
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className="flex-shrink-0 px-4 py-3 text-xs font-semibold relative transition-colors"
              style={{ color: statusTab === tab.key ? '#0A0F1C' : '#8A9BB0' }}
            >
              {tab.label}
              {statusTab === tab.key && (
                <motion.div layoutId="posts-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#0A0F1C' }} />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: '#8A9BB0' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CalendarDays size={32} style={{ color: '#e2e8f0' }} />
            <p className="text-sm font-medium mt-3" style={{ color: '#8A9BB0' }}>No hay publicaciones que coincidan</p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="hidden sm:grid px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px 80px',
                color: '#8A9BB0', background: '#F7F4EE',
                borderBottom: '1px solid rgba(10,15,28,0.05)',
              }}
            >
              <span>Título / Cliente</span>
              <span>Plataforma</span>
              <span>Estado</span>
              <span>Responsable</span>
              <span>Programado</span>
              <span>Tarifa</span>
              <span />
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.04)' }}>
              {filtered.map((post) => {
                const plat = PLATFORM_CONFIG[post.platform] ?? PLATFORM_CONFIG.instagram;
                const PIcon = plat.Icon;
                const st = STATUS_CONFIG[post.status];
                const isDeleting = deletingId === post.id;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid items-center px-5 py-3.5 hover:bg-[rgba(10,15,28,0.04)] transition-colors"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px 80px' }}
                  >
                    {/* Title / client */}
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: post.clientColor + '18', color: post.clientColor }}
                      >
                        {post.clientInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{post.title || '(sin título)'}</p>
                        <p className="text-xs truncate" style={{ color: '#8A9BB0' }}>{post.clientName}</p>
                      </div>
                    </div>

                    {/* Platform */}
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit"
                      style={{ background: plat.bg, color: plat.color }}
                    >
                      <PIcon size={10} />
                      {plat.label}
                    </span>

                    {/* Status */}
                    <span
                      className="inline-flex text-xs font-semibold px-2 py-1 rounded-full w-fit"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>

                    {/* Responsable */}
                    <div className="flex items-center gap-1">
                      {post.staff.length === 0 ? (
                        <span className="text-xs" style={{ color: '#cbd5e1' }}>—</span>
                      ) : (
                        <>
                          {post.staff.slice(0, 2).map((s) => {
                            const initials = s.name.split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('');
                            return (
                              <span
                                key={s.name}
                                title={s.name}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ background: s.color + '30', color: s.color }}
                              >
                                {initials}
                              </span>
                            );
                          })}
                          {post.staff.length > 2 && (
                            <span className="text-[10px] font-semibold" style={{ color: '#8A9BB0' }}>
                              +{post.staff.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-xs" style={{ color: '#5A6B80' }}>{formatDate(post.scheduled_for)}</p>

                    {/* Rate */}
                    <p className="text-xs font-semibold" style={{ color: '#334155' }}>
                      {post.custom_rate_usd != null ? `$${post.custom_rate_usd}` : '—'}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-2 rounded-xl transition-colors hover:bg-blue-50"
                        style={{ color: '#2563eb' }}
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(post.id)}
                        disabled={isDeleting}
                        className="p-2 rounded-xl transition-colors hover:bg-red-50 disabled:opacity-40"
                        style={{ color: '#dc2626' }}
                        title="Eliminar"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingPost(null); }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
              style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold" style={{ color: '#0A0F1C' }}>Editar publicación</h2>
                <button onClick={() => setEditingPost(null)} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)]" style={{ color: '#8A9BB0' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Título</label>
                  <input type="text" required value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Caption</label>
                  <textarea rows={4} value={editForm.caption} onChange={(e) => setEditForm(f => ({ ...f, caption: e.target.value }))}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" style={fieldStyle} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Plataforma</label>
                    <select value={editForm.platform} onChange={(e) => setEditForm(f => ({ ...f, platform: e.target.value as Platform }))}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle}>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Estado</label>
                    <select value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as PostStatus }))}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle}>
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Fecha programada</label>
                    <input type="datetime-local" value={editForm.scheduled_for} onChange={(e) => setEditForm(f => ({ ...f, scheduled_for: e.target.value }))}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>Tarifa personalizada ($)</label>
                    <input type="number" min="0" step="0.01" placeholder="Dejar vacío para tarifa base"
                      value={editForm.custom_rate_usd} onChange={(e) => setEditForm(f => ({ ...f, custom_rate_usd: e.target.value }))}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} />
                  </div>
                </div>

                {editError && (
                  <div className="px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {editError}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  <button type="button" onClick={() => setEditingPost(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{ background: '#0A0F1C', color: '#ffffff' }}>
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Guardar cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-bold mb-2" style={{ color: '#0A0F1C' }}>Eliminar publicación</h2>
              <p className="text-sm mb-5" style={{ color: '#5A6B80' }}>
                ¿Confirmás que querés eliminar esta publicación? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: '#dc2626', color: '#ffffff' }}>
                  {deletingId === confirmDeleteId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
