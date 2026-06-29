'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, CheckSquare, MessageSquare, ArrowRight,
  Check, X, Camera, Play, Clock, FolderOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PLATFORM_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#c026d3', Icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#0f0f0f', Icon: () => <span className="text-[10px] font-black">TK</span> },
  youtube:   { label: 'YouTube',   color: '#dc2626', Icon: Play },
  email:     { label: 'Email',     color: '#2563eb', Icon: MessageSquare },
};

interface PendingPost {
  id: string;
  platform: string;
  title: string;
  scheduled_for: string;
}

interface UpcomingPost {
  id: string;
  platform: string;
  title: string;
  scheduled_for: string;
}

interface Stats {
  postsWeek: number;
  approvals: number;
  unreadMessages: number;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DashboardOverviewPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [storageUrl, setStorageUrl]   = useState<string | null>(null);
  const [stats, setStats]             = useState<Stats>({ postsWeek: 0, approvals: 0, unreadMessages: 0 });
  const [approvals, setApprovals]     = useState<PendingPost[]>([]);
  const [upcoming, setUpcoming]       = useState<UpcomingPost[]>([]);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: client } = await supabase
      .from('clients')
      .select('id, storage_url')
      .eq('user_id', user.id)
      .single();

    if (!client) { setLoading(false); return; }

    setStorageUrl(client.storage_url ?? null);

    const now = new Date();
    const monday = getMondayOfWeek(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const [
      { data: weekPosts },
      { data: pendingPosts },
      { data: upcomingPosts },
      { count: unreadCount },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .gte('scheduled_for', monday.toISOString())
        .lte('scheduled_for', sunday.toISOString()),
      supabase
        .from('posts')
        .select('id, platform, title, scheduled_for')
        .eq('client_id', client.id)
        .eq('status', 'pending_approval')
        .order('scheduled_for', { ascending: true })
        .limit(6),
      supabase
        .from('posts')
        .select('id, platform, title, scheduled_for')
        .eq('client_id', client.id)
        .gt('scheduled_for', now.toISOString())
        .neq('status', 'published')
        .order('scheduled_for', { ascending: true })
        .limit(5),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('read_by_client', false),
    ]);

    setStats({
      postsWeek:      (weekPosts as unknown as { length?: number })?.length ?? 0,
      approvals:      pendingPosts?.length ?? 0,
      unreadMessages: unreadCount ?? 0,
    });
    setApprovals(pendingPosts ?? []);
    setUpcoming(upcomingPosts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (postId: string, action: 'approved' | 'rejected') => {
    const supabase = createClient();
    await supabase.from('posts').update({ status: action }).eq('id', postId);
    setApprovals((prev) => prev.filter((p) => p.id !== postId));
    setStats((prev) => ({ ...prev, approvals: Math.max(0, prev.approvals - 1) }));
  };

  const STATS = [
    {
      label: 'Posts esta semana',
      value: loading ? '—' : String(stats.postsWeek),
      icon: CalendarDays,
      color: '#0A0F1C',
      bg: 'rgba(10,15,28,0.08)',
      href: `/${locale}/portal/dashboard/calendar`,
      urgent: false,
    },
    {
      label: 'Aprobaciones pendientes',
      value: loading ? '—' : String(stats.approvals),
      icon: CheckSquare,
      color: '#ea580c',
      bg: '#fff7ed',
      href: `/${locale}/portal/dashboard/approvals`,
      urgent: stats.approvals > 0,
    },
    {
      label: 'Mensajes sin leer',
      value: loading ? '—' : String(stats.unreadMessages),
      icon: MessageSquare,
      color: '#0A0F1C',
      bg: 'rgba(10,15,28,0.08)',
      href: `/${locale}/portal/dashboard/messages`,
      urgent: stats.unreadMessages > 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── Stats ── */}
      <motion.div className="grid grid-cols-3 gap-4" {...fadeUp(0)}>
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <motion.div
                className="rounded-2xl p-5 relative overflow-hidden cursor-pointer"
                style={{
                  background: stat.urgent ? '#fffbf7' : '#ffffff',
                  border: stat.urgent ? '1.5px solid rgba(234,88,12,0.2)' : '1px solid rgba(10,15,28,0.07)',
                  boxShadow: stat.urgent ? '0 2px 12px rgba(234,88,12,0.08)' : '0 1px 4px rgba(10,15,28,0.05)',
                }}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(10,15,28,0.1)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                {stat.urgent && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#ea580c' }} />}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg, color: stat.color }}>
                  <Icon size={16} />
                </div>
                <div className="text-3xl font-black mb-0.5 tracking-tight" style={{ color: '#0A0F1C' }}>
                  {loading ? (
                    <span className="inline-block w-8 h-7 rounded-lg animate-pulse" style={{ background: 'rgba(10,15,28,0.08)' }} />
                  ) : stat.value}
                </div>
                <div className="text-xs font-medium" style={{ color: '#5A6B80' }}>{stat.label}</div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Main content ── */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">

        {/* Aprobaciones pendientes */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          {...fadeUp(0.1)}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
            <div className="flex items-center gap-2.5">
              <CheckSquare size={14} style={{ color: approvals.length > 0 ? '#ea580c' : '#8A9BB0' }} />
              <span className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Aprobaciones pendientes</span>
              {approvals.length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#ea580c', color: '#fff' }}>
                  {approvals.length}
                </span>
              )}
            </div>
            <Link
              href={`/${locale}/portal/dashboard/approvals`}
              className="flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: '#5A6B80' }}
            >
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: 'rgba(10,15,28,0.06)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background: 'rgba(10,15,28,0.06)', width: '55%' }} />
                    <div className="h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.04)', width: '35%' }} />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="w-20 h-7 rounded-xl" style={{ background: 'rgba(10,15,28,0.04)' }} />
                    <div className="w-20 h-7 rounded-xl" style={{ background: 'rgba(10,15,28,0.04)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <div className="py-14 text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: '#f0fdf4' }}
              >
                <Check size={20} style={{ color: '#16a34a' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Todo al día</p>
              <p className="text-xs mt-1" style={{ color: '#8A9BB0' }}>No hay publicaciones pendientes de revisión</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
                {approvals.map((item) => {
                  const cfg = PLATFORM_CONFIG[item.platform] ?? PLATFORM_CONFIG.instagram;
                  const { Icon } = cfg;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 py-4 flex items-center gap-4"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(10,15,28,0.06)', color: cfg.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{item.title}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#8A9BB0' }}>
                          <Clock size={10} />
                          {cfg.label} · {formatDate(item.scheduled_for)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(item.id, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0' }}
                        >
                          <Check size={11} strokeWidth={2.5} /> Aprobar
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}
                        >
                          <X size={11} strokeWidth={2.5} /> Rechazar
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Próximas publicaciones */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
            {...fadeUp(0.18)}
          >
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
              <div className="flex items-center gap-2">
                <CalendarDays size={13} style={{ color: '#B8976C' }} />
                <span className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Próximas</span>
              </div>
              <Link
                href={`/${locale}/portal/dashboard/calendar`}
                className="flex items-center gap-1 text-xs font-semibold hover:underline"
                style={{ color: '#5A6B80' }}
              >
                Ver calendario <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(10,15,28,0.06)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded" style={{ background: 'rgba(10,15,28,0.06)', width: '70%' }} />
                      <div className="h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.04)', width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center px-4">
                <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>
                  No hay publicaciones programadas próximamente
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
                {upcoming.map((post) => {
                  const cfg = PLATFORM_CONFIG[post.platform] ?? PLATFORM_CONFIG.instagram;
                  const { Icon } = cfg;
                  return (
                    <div key={post.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(10,15,28,0.06)', color: cfg.color }}
                      >
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#0A0F1C' }}>{post.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#8A9BB0' }}>
                          {cfg.label} · {formatDate(post.scheduled_for)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Accesos rápidos */}
          <motion.div className="grid grid-cols-2 gap-3" {...fadeUp(0.26)}>
            {storageUrl ? (
              <a
                href={storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', color: '#0A0F1C', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
              >
                <FolderOpen size={18} style={{ color: '#B8976C' }} />
                Mis archivos
              </a>
            ) : (
              <Link
                href={`/${locale}/portal/dashboard/files`}
                className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', color: '#0A0F1C', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
              >
                <FolderOpen size={18} style={{ color: '#B8976C' }} />
                Archivos
              </Link>
            )}
            <Link
              href={`/${locale}/portal/dashboard/messages`}
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5 relative"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', color: '#0A0F1C', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
            >
              <MessageSquare size={18} style={{ color: '#B8976C' }} />
              Mensajes
              {!loading && stats.unreadMessages > 0 && (
                <span
                  className="absolute top-3 right-3 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#B8976C', color: '#fff' }}
                >
                  {stats.unreadMessages}
                </span>
              )}
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
