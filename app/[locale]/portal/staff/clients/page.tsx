'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clock, CheckCircle2, PauseCircle, Search, PenLine, Loader2,
  Plus, Pencil, Trash2, X, Check, ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

type ClientStatus = 'active' | 'paused';
type FilterStatus = 'all' | 'attention' | 'active' | 'paused';

interface StaffClient {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: ClientStatus;
  plan: string;
  subscription_status: string;
  pending: number;
  postsWeek: number;
  publishedMonth: number;
  lastActivity: string;
  platforms: string[];
  user_id: string | null;
  staff_member_id: string | null;
  storage_url: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface ClientFormData {
  name: string;
  initials: string;
  color: string;
  plan: string;
  status: ClientStatus;
  subscription_status: string;
  storage_url: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  const weeks = Math.floor(days / 7);
  return `Hace ${weeks} sem`;
}

const COLOR_PALETTE = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#8b5cf6', '#06b6d4', '#f43f5e', '#5A6B80',
  '#0ea5e9', '#84cc16', '#f97316', '#a855f7',
];

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: '📸', tiktok: '🎵', youtube: '▶',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

const DEFAULT_FORM: ClientFormData = {
  name: '', initials: '', color: COLOR_PALETTE[0], plan: 'Base', status: 'active', subscription_status: 'inactive', storage_url: '',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffClientsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('portal');

  const [filter, setFilter]   = useState<FilterStatus>('all');
  const [query, setQuery]     = useState('');
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string; color: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [linking, setLinking] = useState<string | null>(null);

  // ABM state
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffClient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffClient | null>(null);
  const [form, setForm] = useState<ClientFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load clients from Supabase with real stats from posts
  const loadClients = useCallback(async () => {
    setLoadError(null);
    const supabase = createClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [clientsRes, staffRes, plansRes] = await Promise.all([
        supabase.from('clients').select('id, name, initials, color, status, plan, subscription_status, user_id, staff_member_id, storage_url').order('name'),
        supabase.from('staff_members').select('id, name, color'),
        supabase.from('plans').select('id, name').eq('active', true).order('name'),
      ]);
      setStaffMembers(staffRes.data ?? []);
      setPlans(plansRes.data ?? []);

      if (clientsRes.error) {
        setLoadError(`Error cargando clientes: ${clientsRes.error.message ?? String(clientsRes.error)}`);
        return;
      }
      if (!clientsRes.data || clientsRes.data.length === 0) {
        setClients([]);
        return;
      }

      const [recentPostsRes, pendingPostsRes] = await Promise.all([
        supabase.from('posts').select('id, client_id, platform, status, created_at').gte('created_at', thirtyDaysAgo),
        supabase.from('posts').select('id, client_id, created_at').eq('status', 'pending_approval'),
      ]);

      type PostRow = { id: string; client_id: string; platform?: string; status?: string; created_at: string };
      const recentPosts: PostRow[] = recentPostsRes.data ?? [];
      const pendingPosts: PostRow[] = pendingPostsRes.data ?? [];

      const recentByClient: Record<string, PostRow[]> = {};
      for (const p of recentPosts) {
        (recentByClient[p.client_id] ??= []).push(p);
      }

      const pendingCountByClient: Record<string, number> = {};
      for (const p of pendingPosts) {
        pendingCountByClient[p.client_id] = (pendingCountByClient[p.client_id] ?? 0) + 1;
      }

      setClients(
        clientsRes.data.map((c) => {
          const recent = recentByClient[c.id] ?? [];
          const postsWeek = recent.filter((p) => p.created_at >= sevenDaysAgo).length;
          const publishedMonth = recent.filter((p) => p.status === 'published').length;
          const platforms = [...new Set(recent.map((p) => p.platform as string).filter(Boolean))];
          const latestPost = recent.reduce<string | null>((acc, p) => (!acc || p.created_at > acc ? p.created_at : acc), null);

          return {
            id: c.id,
            name: c.name,
            initials: c.initials ?? getInitials(c.name),
            color: c.color ?? '#6366f1',
            status: (c.status ?? 'active') as ClientStatus,
            plan: c.plan ?? 'Base',
            subscription_status: c.subscription_status ?? 'inactive',
            pending: pendingCountByClient[c.id] ?? 0,
            postsWeek,
            publishedMonth,
            lastActivity: latestPost ? relativeTime(latestPost) : '—',
            platforms,
            user_id: c.user_id ?? null,
            staff_member_id: c.staff_member_id ?? null,
            storage_url: c.storage_url ?? null,
          };
        })
      );
    } catch (err) {
      setLoadError(`Excepción inesperada: ${String(err)}`);
    }
  }, []);

  const loadAuthUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) return;
    const data = await res.json();
    setAuthUsers(
      (data.users ?? [])
        .filter((u: { role: string }) => u.role === 'client')
        .map((u: { id: string; email: string; name: string }) => ({
          id: u.id, email: u.email, name: u.name || u.email,
        }))
    );
  }, []);

  useEffect(() => {
    loadClients();
    loadAuthUsers();
  }, [loadClients, loadAuthUsers]);

  const handleLinkUser = async (clientId: string, userId: string | null) => {
    const prevClients = clients;
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, user_id: userId } : c));
    setLinking(clientId);
    const supabase = createClient();
    const { error } = await supabase
      .from('clients')
      .update({ user_id: userId || null })
      .eq('id', clientId);
    setLinking(null);
    if (error) {
      setClients(prevClients);
      setLoadError(`Error asignando usuario: ${error.message}`);
      setTimeout(() => setLoadError(null), 4000);
    }
  };

  const handleLinkStaff = async (clientId: string, staffId: string | null) => {
    const prevClients = clients;
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, staff_member_id: staffId } : c));
    const supabase = createClient();
    const { error } = await supabase
      .from('clients')
      .update({ staff_member_id: staffId || null })
      .eq('id', clientId);
    if (error) setClients(prevClients);
  };

  // ── ABM handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setShowCreate(true);
  };

  const openEdit = (client: StaffClient) => {
    setForm({
      name:                client.name,
      initials:            client.initials,
      color:               client.color,
      plan:                client.plan,
      status:              client.status,
      subscription_status: client.subscription_status,
      storage_url:         client.storage_url ?? '',
    });
    setEditTarget(client);
  };

  const handleFormName = (name: string) => {
    setForm(f => ({ ...f, name, initials: getInitials(name) }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('clients').insert({
      name:                form.name.trim(),
      initials:            form.initials || getInitials(form.name),
      color:               form.color,
      plan:                form.plan,
      status:              form.status,
      subscription_status: form.subscription_status,
      storage_url:         form.storage_url.trim() || null,
    });
    setSaving(false);
    setShowCreate(false);
    setFeedback(t('clients.clientAdded'));
    setTimeout(() => setFeedback(null), 2500);
    loadClients();
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('clients').update({
      name:                form.name.trim(),
      initials:            form.initials || getInitials(form.name),
      color:               form.color,
      plan:                form.plan,
      status:              form.status,
      subscription_status: form.subscription_status,
      storage_url:         form.storage_url.trim() || null,
    }).eq('id', editTarget.id);
    setSaving(false);
    setEditTarget(null);
    setFeedback(t('clients.clientUpdated'));
    setTimeout(() => setFeedback(null), 2500);
    loadClients();
  };

  const handleDelete = async () => {
    if (!deleteTarget || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('clients').delete().eq('id', deleteTarget.id);
    setSaving(false);
    setDeleteTarget(null);
    setFeedback(t('clients.clientDeleted'));
    setTimeout(() => setFeedback(null), 2500);
    loadClients();
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = clients
    .filter((c) => {
      if (filter === 'attention') return c.pending > 0;
      if (filter === 'active')    return c.status === 'active' && c.pending === 0;
      if (filter === 'paused')    return c.status === 'paused';
      return true;
    })
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all',       label: t('clients.tabAll'),       count: clients.length },
    { key: 'attention', label: t('clients.tabAttention'), count: clients.filter((c) => c.pending > 0).length },
    { key: 'active',    label: t('clients.tabActive'),    count: clients.filter((c) => c.status === 'active' && c.pending === 0).length },
    { key: 'paused',    label: t('clients.tabPaused'),    count: clients.filter((c) => c.status === 'paused').length },
  ];

  const isModalOpen = showCreate || !!editTarget;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">

      {/* Error diagnóstico — eliminar cuando funcione */}
      {loadError && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          ⚠ {loadError}
        </div>
      )}

      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('clients.title')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
            {clients.filter((c) => c.status === 'active').length} activos · {clients.filter((c) => c.status === 'paused').length} en pausa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(184,151,108,0.08)', color: '#0A0F1C', border: '1px solid rgba(10,15,28,0.15)' }}
          >
            <Plus size={14} />
            {t('clients.addClient')}
          </button>
          <Link
            href={`/${locale}/portal/staff/content/new`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: '#0A0F1C', color: '#ffffff', boxShadow: '0 2px 8px rgba(10,15,28,0.2)' }}
          >
            <PenLine size={14} />
            {t('clients.newPost')}
          </Link>
        </div>
      </motion.div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0' }}
          >
            <Check size={14} /> {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List card */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'rgba(10,15,28,0.08)' }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-3 text-xs font-semibold whitespace-nowrap flex-shrink-0 relative transition-colors"
              style={{ color: filter === tab.key ? '#0A0F1C' : '#8A9BB0', background: filter === tab.key ? '#F7F4EE' : 'transparent' }}>
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: filter === tab.key ? '#0A0F1C' : 'rgba(10,15,28,0.08)', color: filter === tab.key ? '#fff' : '#5A6B80' }}>
                  {tab.count}
                </span>
              )}
              {filter === tab.key && (
                <motion.div layoutId="clients-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#0A0F1C' }} />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(10,15,28,0.06)' }}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.08)' }}>
            <Search size={13} style={{ color: '#8A9BB0', flexShrink: 0 }} />
            <input type="text" placeholder={t('clients.searchPlaceholder')} value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none" style={{ color: '#334155', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold" style={{ color: '#8A9BB0' }}>{t('clients.noClients')}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
            {filtered.map((client, index) => (
              <motion.div key={client.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(10,15,28,0.04)] transition-colors">

                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: client.color + '18', color: client.color }}>
                  {client.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{client.name}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: '#eff6ff', color: '#2563eb' }}>
                      {client.plan}
                    </span>
                    {(() => {
                      const s = client.subscription_status;
                      const cfg: Record<string, { bg: string; color: string; label: string }> = {
                        active:   { bg: '#f0fdf4', color: '#16a34a', label: 'Activo' },
                        trialing: { bg: '#eff6ff', color: '#2563eb', label: 'Prueba' },
                        past_due: { bg: '#fff7ed', color: '#ea580c', label: 'Vencido' },
                        canceled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelado' },
                        inactive: { bg: '#EDE9E1', color: '#5A6B80', label: 'Inactivo' },
                      };
                      const c = cfg[s] ?? cfg.inactive;
                      return (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: c.bg, color: c.color }}>
                          {c.label}
                        </span>
                      );
                    })()}
                    {client.storage_url && (
                      <a href={client.storage_url} target="_blank" rel="noopener noreferrer"
                        title="Abrir carpeta de archivos"
                        className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                        style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <ExternalLink size={9} /> Archivos
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px]" style={{ color: '#8A9BB0' }}>
                      {client.postsWeek} posts/sem · {client.publishedMonth} este mes
                    </span>
                    <span className="text-[11px]" style={{ color: '#cbd5e1' }}>·</span>
                    <span className="text-[11px]" style={{ color: '#8A9BB0' }}>
                      {client.platforms.map((p) => PLATFORM_EMOJI[p]).join(' ')}
                    </span>
                  </div>
                </div>

                {/* Portal user link */}
                <div className="hidden md:flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: '#8A9BB0' }}>{t('clients.portalUser')}:</span>
                  <div className="relative">
                    <select
                      value={client.user_id ?? ''}
                      onChange={(e) => handleLinkUser(client.id, e.target.value || null)}
                      disabled={linking === client.id}
                      className="text-xs pl-2.5 pr-7 py-1.5 rounded-lg outline-none appearance-none disabled:opacity-50"
                      style={{ border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', background: '#F7F4EE', fontFamily: 'inherit' }}
                    >
                      <option value="">{t('clients.noUser')}</option>
                      {authUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {linking === client.id && (
                      <Loader2 size={10} className="animate-spin absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#8A9BB0' }} />
                    )}
                  </div>
                </div>

                {/* Staff responsable */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: '#8A9BB0' }}>Responsable:</span>
                  <select
                    value={client.staff_member_id ?? ''}
                    onChange={(e) => handleLinkStaff(client.id, e.target.value || null)}
                    className="text-xs pl-2.5 pr-7 py-1.5 rounded-lg outline-none appearance-none"
                    style={{ border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', background: '#F7F4EE', fontFamily: 'inherit' }}
                  >
                    <option value="">Sin responsable</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2">
                  {client.status === 'paused' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                      <PauseCircle size={10} /> {t('clients.statusPaused')}
                    </span>
                  ) : client.pending > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                      <Clock size={10} /> {client.pending} pendientes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      <CheckCircle2 size={10} /> {t('clients.statusAllGood')}
                    </span>
                  )}
                  <span className="text-[11px] hidden sm:block flex-shrink-0" style={{ color: '#8A9BB0' }}>{client.lastActivity}</span>
                  <Link href={`/${locale}/portal/staff/content/new`}
                    className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(184,151,108,0.08)', color: '#0A0F1C', border: '1px solid rgba(10,15,28,0.1)' }}>
                    <PenLine size={10} /> {t('clients.post')}
                  </Link>
                  <button
                    onClick={() => openEdit(client)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                    title={t('clients.editClient')}
                  >
                    <Pencil size={13} style={{ color: '#8A9BB0' }} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(client)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    title={t('clients.deleteClient')}
                  >
                    <Trash2 size={13} style={{ color: '#fca5a5' }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setEditTarget(null); } }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: '#ffffff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>
                  {editTarget ? t('clients.editClient') : t('clients.addClient')}
                </h2>
                <button
                  onClick={() => { setShowCreate(false); setEditTarget(null); }}
                  className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)] transition-colors"
                >
                  <X size={16} style={{ color: '#8A9BB0' }} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  {t('clients.formName')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormName(e.target.value)}
                  placeholder="ej. GloveTZ"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                />
              </div>

              {/* Initials */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  {t('clients.formInitials')}
                </label>
                <input
                  type="text"
                  value={form.initials}
                  onChange={(e) => setForm(f => ({ ...f, initials: e.target.value.toUpperCase().slice(0, 3) }))}
                  maxLength={3}
                  placeholder="GT"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>
                  {t('clients.formColor')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                    >
                      {form.color === c && <Check size={12} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                    {t('clients.formPlan')}
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                  >
                    {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                    {t('clients.formStatus')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                  >
                    <option value="active">{t('clients.formStatusActive')}</option>
                    <option value="paused">{t('clients.formStatusPaused')}</option>
                  </select>
                </div>
              </div>

              {/* Billing */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  Estado de suscripción
                </label>
                <select
                  value={form.subscription_status}
                  onChange={(e) => setForm(f => ({ ...f, subscription_status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                >
                  <option value="inactive">Inactivo</option>
                  <option value="trialing">En prueba</option>
                  <option value="active">Activo</option>
                  <option value="past_due">Pago vencido</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>

              {/* Storage URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  URL de archivos
                </label>
                <input
                  type="url"
                  value={form.storage_url}
                  onChange={(e) => setForm(f => ({ ...f, storage_url: e.target.value }))}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                />
              </div>

              {/* Preview */}
              {form.name && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#F7F4EE', border: '1px solid rgba(10,15,28,0.07)' }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: form.color + '18', color: form.color }}
                  >
                    {form.initials || getInitials(form.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{form.name}</p>
                    <p className="text-[11px]" style={{ color: '#8A9BB0' }}>
                      {form.plan} · {form.status === 'active' ? t('clients.formStatusActive') : t('clients.formStatusPaused')}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowCreate(false); setEditTarget(null); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: '#EDE9E1', color: '#5A6B80' }}
                >
                  {t('clients.cancel')}
                </button>
                <button
                  onClick={editTarget ? handleEdit : handleCreate}
                  disabled={!form.name.trim() || saving}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: '#0A0F1C', color: '#ffffff', boxShadow: '0 2px 8px rgba(10,15,28,0.25)' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t('clients.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: '#ffffff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                  <Trash2 size={16} style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold" style={{ color: '#0A0F1C' }}>{t('clients.confirmDelete')}</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#8A9BB0' }}>{deleteTarget.name}</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: '#5A6B80' }}>{t('clients.confirmDeleteDesc')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#EDE9E1', color: '#5A6B80' }}
                >
                  {t('clients.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: '#dc2626', color: '#ffffff' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t('clients.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
