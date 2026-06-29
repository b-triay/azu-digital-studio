'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Play, Clock, CheckCircle2, XCircle, ChevronRight, CalendarDays, Search, Filter, Send, Lock, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

// ── Types + config ────────────────────────────────────────────────────────────

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'email';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ApprovalItem {
  id: string;
  clientId: string;
  clientName: string;
  clientColor: string;
  clientInitials: string;
  platform: Platform;
  title: string;
  caption: string;
  scheduled: string;
  scheduledRaw: string | null;
  status: ApprovalStatus;
  clientComment?: string;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#c026d3', bg: 'rgba(192,38,211,0.08)', Icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#0f0f0f', bg: 'rgba(10,15,28,0.08)',   Icon: () => <span className="text-[10px] font-black leading-none">TK</span> },
  youtube:   { label: 'YouTube',   color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  Icon: Play },
  email:     { label: 'Email',     color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  Icon: () => <span className="text-[10px] font-black leading-none">EM</span> },
};

const STATUS_CONFIG_BASE: Record<ApprovalStatus, { color: string; bg: string; Icon: React.ElementType }> = {
  pending:  { color: '#ea580c', bg: '#fff7ed', Icon: Clock },
  approved: { color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 },
  rejected: { color: '#dc2626', bg: '#fef2f2', Icon: XCircle },
};

type FilterTab = 'all' | ApprovalStatus;
type FilterClient = 'all' | string;

interface PostComment {
  id: string;
  author_type: 'staff' | 'client';
  author_name: string;
  body: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapStatus(s: string): ApprovalStatus {
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffApprovalsPage() {
  const t = useTranslations('portal');
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');
  const [clientFilter, setClientFilter] = useState<FilterClient>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  const [filterMine, setFilterMine]   = useState(false);
  const [myPostIds, setMyPostIds]     = useState<Set<string>>(new Set());
  const [comments, setComments]       = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [myName, setMyName]           = useState('Equipo Azu');

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from('posts')
        .select('id, title, caption, scheduled_for, platform, status, client_id')
        .in('status', ['pending_approval', 'approved', 'rejected'])
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, initials, color'),
    ]).then(([postsRes, clientsRes]) => {
      const posts   = postsRes.data   ?? [];
      const clients = clientsRes.data ?? [];
      const clientMap = new Map(clients.map((c: { id: string; name: string; initials: string; color: string }) => [c.id, c]));

      const mapped: ApprovalItem[] = posts.map((r: {
        id: string; title: string; caption: string;
        scheduled_for: string | null; platform: string;
        status: string; client_id: string;
      }) => {
        const cl = clientMap.get(r.client_id) as { name: string; initials: string; color: string } | undefined;
        return {
          id: r.id,
          clientId: r.client_id,
          clientName: cl?.name ?? '—',
          clientColor: cl?.color ?? '#0A0F1C',
          clientInitials: cl?.initials ?? '??',
          platform: (r.platform ?? 'instagram') as Platform,
          title: r.title ?? '(sin título)',
          caption: r.caption ?? '',
          scheduled: formatShortDate(r.scheduled_for),
          scheduledRaw: r.scheduled_for,
          status: mapStatus(r.status),
        };
      });
      setItems(mapped);
      if (mapped.length > 0) setSelectedId(mapped[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('staff_members').select('id, name').eq('email', user.email).single()
        .then(({ data: sm }) => {
          if (!sm) return;
          if (sm.name) setMyName(sm.name);
          supabase.from('post_assignments').select('post_id').eq('staff_member_id', sm.id)
            .then(({ data }) => setMyPostIds(new Set((data ?? []).map((a: { post_id: string }) => a.post_id))));
        });
    });
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    const supabase = createClient();
    const [commentsRes, approvalsRes] = await Promise.all([
      supabase.from('post_comments').select('id, author_type, author_name, body, created_at').eq('post_id', postId).order('created_at'),
      supabase.from('approvals').select('id, action, comment, created_at').eq('post_id', postId).not('comment', 'is', null),
    ]);
    const internalComments: PostComment[] = (commentsRes.data ?? []);
    const clientApprovalComments: PostComment[] = (approvalsRes.data ?? [])
      .filter((a: { comment: string | null }) => a.comment)
      .map((a: { id: string; action: string; comment: string; created_at: string }) => ({
        id: `approval-${a.id}`,
        author_type: 'client' as const,
        author_name: 'Cliente',
        body: `[${a.action === 'approved' ? 'Aprobado' : 'Cambios solicitados'}] ${a.comment}`,
        created_at: a.created_at,
      }));
    const all = [...internalComments, ...clientApprovalComments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setComments(all);
  }, []);

  useEffect(() => {
    if (selectedId) loadComments(selectedId);
    else setComments([]);
    setCommentText('');
  }, [selectedId, loadComments]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedId || submitting) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('post_comments').insert({
      post_id:     selectedId,
      author_type: 'staff',
      author_name: myName,
      body:        commentText.trim(),
    });
    setCommentText('');
    setSubmitting(false);
    loadComments(selectedId);
  };

  const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    pending:  { ...STATUS_CONFIG_BASE.pending,  label: t('staffApprovals.statusAwaitingReview') },
    approved: { ...STATUS_CONFIG_BASE.approved, label: t('staffApprovals.statusApproved') },
    rejected: { ...STATUS_CONFIG_BASE.rejected, label: t('staffApprovals.statusChangesRequested') },
  };

  const pending  = items.filter((i) => i.status === 'pending');
  const approved = items.filter((i) => i.status === 'approved');
  const rejected = items.filter((i) => i.status === 'rejected');

  const uniqueClients = Array.from(
    new Map(items.map((i) => [i.clientId, { id: i.clientId, name: i.clientName, color: i.clientColor }])).values()
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const filtered = items
    .filter((i) => statusFilter === 'all' || i.status === statusFilter)
    .filter((i) => clientFilter === 'all' || i.clientId === clientFilter)
    .filter((i) => i.title.toLowerCase().includes(query.toLowerCase()) || i.clientName.toLowerCase().includes(query.toLowerCase()))
    .filter((i) => !filterToday || (i.scheduledRaw ? i.scheduledRaw.slice(0, 10) === todayStr : false))
    .filter((i) => !filterMine || myPostIds.has(i.id));

  const selected = items.find((i) => i.id === selectedId);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',      label: t('staffApprovals.tabAll'),      count: items.length },
    { key: 'pending',  label: t('staffApprovals.tabPending'),  count: pending.length },
    { key: 'approved', label: t('staffApprovals.tabApproved'), count: approved.length },
    { key: 'rejected', label: t('staffApprovals.tabRejected'), count: rejected.length },
  ];

  async function handleAction(action: 'approve' | 'reject') {
    if (!selected || actionLoading) return;
    setActionLoading(action);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const supabase = createClient();
    const { error } = await supabase.from('posts').update({ status: newStatus }).eq('id', selected.id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === selected.id ? { ...i, status: mapStatus(newStatus) } : i))
      );
    }
    setActionLoading(null);
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('staffApprovals.title')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
            {t('staffApprovals.subtitle')}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {[
            { count: pending.length,  label: t('staffApprovals.chipPending'),  color: '#ea580c', bg: '#fff7ed' },
            { count: approved.length, label: t('staffApprovals.chipApproved'), color: '#16a34a', bg: '#f0fdf4' },
            { count: rejected.length, label: t('staffApprovals.chipRejected'), color: '#dc2626', bg: '#fef2f2' },
          ].map(({ count, label, color, bg }) => (
            <span key={label} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: bg, color }}>
              <span className="font-black">{count}</span> {label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Two-column */}
      <motion.div
        className="grid lg:grid-cols-[340px_1fr] gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Left: list ── */}
        <div
          className="rounded-2xl overflow-hidden self-start"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
        >
          {/* Status tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(10,15,28,0.08)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="flex-1 py-3 text-[11px] font-semibold transition-all relative"
                style={{
                  color: statusFilter === tab.key ? '#0A0F1C' : '#8A9BB0',
                  background: statusFilter === tab.key ? '#F7F4EE' : 'transparent',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className="ml-1 text-[10px] font-black px-1 py-0.5 rounded-full"
                    style={{
                      background: statusFilter === tab.key ? '#0A0F1C' : 'rgba(10,15,28,0.08)',
                      color: statusFilter === tab.key ? '#fff' : '#5A6B80',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
                {statusFilter === tab.key && (
                  <motion.div layoutId="staff-approvals-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#0A0F1C' }} />
                )}
              </button>
            ))}
          </div>

          {/* Search + client filter */}
          <div className="p-3 flex flex-col gap-2" style={{ borderBottom: '1px solid rgba(10,15,28,0.06)' }}>
            {/* Quick filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl self-start" style={{ background: '#EDE9E1' }}>
              <button
                onClick={() => setFilterToday(f => !f)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                style={{ background: filterToday ? '#0A0F1C' : 'transparent', color: filterToday ? '#ffffff' : '#5A6B80' }}
              >
                Hoy
              </button>
              <button
                onClick={() => setFilterMine(f => !f)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                style={{ background: filterMine ? '#0A0F1C' : 'transparent', color: filterMine ? '#ffffff' : '#5A6B80' }}
              >
                <Filter size={10} /> Solo lo mío
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.08)' }}>
              <Search size={12} style={{ color: '#8A9BB0', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={t('staffApprovals.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none"
                style={{ color: '#334155', fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setClientFilter('all')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors"
                style={{
                  background: clientFilter === 'all' ? '#0A0F1C' : 'rgba(10,15,28,0.08)',
                  color: clientFilter === 'all' ? '#fff' : '#5A6B80',
                }}
              >
                {t('staffApprovals.allClients')}
              </button>
              {uniqueClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClientFilter(c.id)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors"
                  style={{
                    background: clientFilter === c.id ? c.color : c.color + '15',
                    color: clientFilter === c.id ? '#fff' : c.color,
                  }}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          {loading ? (
            <div className="py-10 text-center px-4">
              <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>Cargando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>{t('staffApprovals.noPostsFound')}</p>
            </div>
          ) : (
            <div className="max-h-[540px] overflow-y-auto divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
              {filtered.map((item) => {
                const plat = PLATFORM_CONFIG[item.platform] ?? PLATFORM_CONFIG.instagram;
                const PIcon = plat.Icon;
                const statusCfg = STATUS_CONFIG[item.status];
                const SIcon = statusCfg.Icon;
                const isSelected = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(10,15,28,0.04)]"
                    style={{
                      background: isSelected ? 'rgba(184,151,108,0.08)' : 'transparent',
                      borderLeft: isSelected ? '2.5px solid #B8976C' : '2.5px solid transparent',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0"
                      style={{ background: item.clientColor + '18', color: item.clientColor }}
                    >
                      {item.clientInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: '#0A0F1C' }}>{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold" style={{ color: item.clientColor }}>{item.clientName}</span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span style={{ color: plat.color }} className="text-[10px]">{plat.label}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <SIcon size={9} style={{ color: statusCfg.color }} />
                        <span className="text-[10px] font-semibold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span className="text-[10px]" style={{ color: '#8A9BB0' }}>{item.scheduled}</span>
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={11} style={{ color: '#0A0F1C', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: detail ── */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
            >
              {(() => {
                const plat = PLATFORM_CONFIG[selected.platform] ?? PLATFORM_CONFIG.instagram;
                const PIcon = plat.Icon;
                const statusCfg = STATUS_CONFIG[selected.status];
                const SIcon = statusCfg.Icon;

                return (
                  <>
                    {/* Detail header */}
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: selected.clientColor + '18', color: selected.clientColor }}
                        >
                          {selected.clientInitials}
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{selected.title}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold" style={{ color: selected.clientColor }}>{selected.clientName}</span>
                            <span style={{ color: '#e2e8f0' }}>·</span>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: plat.bg, color: plat.color }}
                            >
                              {plat.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                      >
                        <SIcon size={10} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col gap-5">
                      {/* Scheduled */}
                      <div className="flex items-center gap-2.5">
                        <CalendarDays size={14} style={{ color: '#5A6B80' }} />
                        <span className="text-sm font-medium" style={{ color: '#334155' }}>
                          Programado para {selected.scheduled}
                        </span>
                      </div>

                      {/* Caption */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('staffApprovals.captionLabel')}</p>
                        <div
                          className="px-4 py-4 rounded-xl text-sm leading-relaxed font-medium"
                          style={{ background: '#F7F4EE', color: '#334155', border: '1px solid rgba(10,15,28,0.07)' }}
                        >
                          {selected.caption || <span style={{ color: '#8A9BB0' }}>Sin caption</span>}
                        </div>
                      </div>

                      {/* Media */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('staffApprovals.mediaLabel')}</p>
                        <div
                          className="rounded-xl flex flex-col items-center justify-center gap-2"
                          style={{
                            height: '180px',
                            background: 'rgba(184,151,108,0.05)',
                            border: '1px solid rgba(184,151,108,0.18)',
                          }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(184,151,108,0.12)' }}>
                            <Camera size={18} style={{ color: '#B8976C' }} />
                          </div>
                          <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>{t('staffApprovals.mediaNotUploaded')}</p>
                        </div>
                      </div>

                      {/* Client comment on rejection */}
                      {selected.status === 'rejected' && selected.clientComment && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>
                            {t('staffApprovals.clientFeedback')}
                          </p>
                          <div
                            className="px-4 py-3.5 rounded-xl text-sm leading-relaxed"
                            style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                          >
                            <XCircle size={13} className="inline mr-2 flex-shrink-0" />
                            {selected.clientComment}
                          </div>
                        </div>
                      )}

                      {/* Status notice (approved or rejected) */}
                      {selected.status !== 'pending' && (
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium"
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${selected.status === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                          }}
                        >
                          <SIcon size={16} />
                          {selected.status === 'approved'
                            ? t('staffApprovals.clientApproved')
                            : t('staffApprovals.clientRequestedChanges')}
                        </div>
                      )}

                      {/* Approve / Reject actions */}
                      {selected.status === 'pending' && (
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleAction('approve')}
                            disabled={actionLoading !== null}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: '#16a34a', color: '#ffffff', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
                          >
                            <CheckCircle2 size={15} />
                            {actionLoading === 'approve' ? t('staffApprovals.approving') : t('staffApprovals.approve')}
                          </button>
                          <button
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading !== null}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: '#dc2626', color: '#ffffff', boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}
                          >
                            <XCircle size={15} />
                            {actionLoading === 'reject' ? t('staffApprovals.rejecting') : t('staffApprovals.reject')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Comments panel ── */}
                    <div style={{ borderTop: '1px solid rgba(10,15,28,0.08)' }}>
                      <div className="px-6 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(10,15,28,0.06)', background: '#fafbfc' }}>
                        <MessageSquare size={13} style={{ color: '#5A6B80' }} />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6B80' }}>Comentarios</span>
                        {comments.length > 0 && (
                          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                            {comments.length}
                          </span>
                        )}
                      </div>

                      {/* Comment list */}
                      {comments.length > 0 && (
                        <div className="px-6 py-3 flex flex-col gap-3 max-h-48 overflow-y-auto">
                          {comments.map(c => (
                            <div key={c.id} className="flex gap-2.5">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                                style={{
                                  background: c.author_type === 'client' ? 'rgba(184,151,108,0.15)' : 'rgba(10,15,28,0.08)',
                                  color: c.author_type === 'client' ? '#B8976C' : '#5A6B80',
                                }}
                              >
                                {c.author_type === 'client' ? 'C' : 'E'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[11px] font-bold" style={{ color: '#0A0F1C' }}>{c.author_name}</span>
                                  {c.author_type === 'staff' && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(10,15,28,0.07)', color: '#5A6B80' }}>
                                      <Lock size={7} /> interno
                                    </span>
                                  )}
                                  <span className="text-[10px] ml-auto" style={{ color: '#cbd5e1' }}>
                                    {new Date(c.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{c.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment */}
                      <div className="px-6 py-3" style={{ borderTop: comments.length > 0 ? '1px solid rgba(10,15,28,0.05)' : undefined }}>
                        <div className="flex items-end gap-2">
                          <textarea
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                            placeholder="Escribe un comentario interno… (solo visible para el equipo)"
                            rows={2}
                            className="flex-1 resize-none px-3 py-2 rounded-xl text-xs outline-none"
                            style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.1)', color: '#334155', fontFamily: 'inherit', lineHeight: 1.5 }}
                          />
                          <button
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || submitting}
                            className="p-2.5 rounded-xl transition-colors disabled:opacity-40"
                            style={{ background: '#0A0F1C', color: '#ffffff' }}
                          >
                            <Send size={13} />
                          </button>
                        </div>
                        <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: '#8A9BB0' }}>
                          <Lock size={9} /> Solo visible para el equipo
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl flex items-center justify-center"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', minHeight: '300px' }}
            >
              <p className="text-sm font-medium" style={{ color: '#8A9BB0' }}>
                {loading ? 'Cargando…' : t('staffApprovals.selectPost')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
