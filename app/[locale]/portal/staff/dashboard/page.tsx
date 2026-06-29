'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, CheckSquare, CalendarDays, TrendingUp, ArrowRight, Clock, Camera, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashClient {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: 'active' | 'paused';
  pending: number;
  postsWeek: number;
}

interface UpcomingPost {
  id: string;
  client: string;
  clientColor: string;
  clientInitials: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'email';
  title: string;
  date: string;
}

interface Stats {
  clients: number;
  pausedClients: number;
  approvals: number;
  postsWeek: number;
  publishedMonth: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Camera,
  tiktok: () => <span className="text-[10px] font-black leading-none">TK</span>,
  youtube: Play,
  email: () => <span className="text-[10px] font-black leading-none">EM</span>,
};
const PLATFORM_COLORS: Record<string, { color: string; bg: string }> = {
  instagram: { color: '#c026d3', bg: '#fdf4ff' },
  tiktok:    { color: '#0f0f0f', bg: '#f5f5f5' },
  youtube:   { color: '#dc2626', bg: '#fef2f2' },
  email:     { color: '#2563eb', bg: '#eff6ff' },
};

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('portal');

  const [stats, setStats] = useState<Stats>({ clients: 0, pausedClients: 0, approvals: 0, postsWeek: 0, publishedMonth: 0 });
  const [dashClients, setDashClients] = useState<DashClient[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const now = new Date();
      const monday = getMondayOfWeek(now);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        { data: allClients },
        { data: pendingPosts },
        { data: weekPosts },
        { data: publishedPosts },
        { data: upcoming },
      ] = await Promise.all([
        supabase.from('clients').select('id, name, initials, color, status').order('name'),
        supabase.from('posts').select('client_id').eq('status', 'pending_approval'),
        supabase.from('posts')
          .select('client_id')
          .gte('scheduled_for', monday.toISOString())
          .lte('scheduled_for', sunday.toISOString()),
        supabase.from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('created_at', firstOfMonth.toISOString()),
        supabase.from('posts')
          .select('id, title, platform, scheduled_for, client_id, clients(name, color, initials)')
          .gt('scheduled_for', now.toISOString())
          .neq('status', 'published')
          .order('scheduled_for', { ascending: true })
          .limit(5),
      ]);

      const clients = allClients ?? [];
      const pending = pendingPosts ?? [];
      const week = weekPosts ?? [];

      // Count pending and week-posts per client
      const pendingMap: Record<string, number> = {};
      for (const p of pending) pendingMap[p.client_id] = (pendingMap[p.client_id] ?? 0) + 1;
      const weekMap: Record<string, number> = {};
      for (const p of week) weekMap[p.client_id] = (weekMap[p.client_id] ?? 0) + 1;

      const active = clients.filter((c) => c.status === 'active');
      const paused = clients.filter((c) => c.status === 'paused');

      setStats({
        clients: active.length,
        pausedClients: paused.length,
        approvals: pending.length,
        postsWeek: week.length,
        publishedMonth: publishedPosts?.length ?? 0,
      });

      setDashClients(
        clients.map((c) => ({
          id: c.id,
          name: c.name,
          initials: c.initials ?? c.name.slice(0, 2).toUpperCase(),
          color: c.color ?? '#0A0F1C',
          status: c.status as 'active' | 'paused',
          pending: pendingMap[c.id] ?? 0,
          postsWeek: weekMap[c.id] ?? 0,
        }))
      );

      type PostRow = {
        id: string;
        title: string;
        platform: string;
        scheduled_for: string;
        client_id: string;
        clients: { name: string; color: string; initials: string } | null;
      };

      setUpcomingPosts(
        ((upcoming ?? []) as unknown as PostRow[]).map((p) => ({
          id: p.id,
          title: p.title ?? '(sin título)',
          platform: (p.platform ?? 'instagram') as UpcomingPost['platform'],
          date: formatShortDate(p.scheduled_for),
          client: p.clients?.name ?? '—',
          clientColor: p.clients?.color ?? '#0A0F1C',
          clientInitials: p.clients?.initials ?? '??',
        }))
      );

      setLoading(false);
    }

    load();
  }, []);

  const needsAttention = dashClients.filter((c) => c.pending > 0);
  const upToDate = dashClients.filter((c) => c.pending === 0);

  const STATS = [
    {
      label: t('staffDashboard.statClients'),
      value: loading ? '—' : String(stats.clients),
      icon: Users,
      color: '#0A0F1C',
      bg: 'rgba(10,15,28,0.08)',
      trend: loading ? '' : stats.pausedClients > 0 ? `${stats.pausedClients} en pausa` : '',
      urgent: false,
    },
    {
      label: t('staffDashboard.statApprovals'),
      value: loading ? '—' : String(stats.approvals),
      icon: CheckSquare,
      color: '#ea580c',
      bg: '#fff7ed',
      trend: t('staffDashboard.statApprovalsTrend'),
      urgent: stats.approvals > 0,
    },
    {
      label: t('staffDashboard.statPosts'),
      value: loading ? '—' : String(stats.postsWeek),
      icon: CalendarDays,
      color: '#2563eb',
      bg: '#eff6ff',
      trend: t('staffDashboard.statPostsTrend'),
      urgent: false,
    },
    {
      label: t('staffDashboard.statPublished'),
      value: loading ? '—' : String(stats.publishedMonth),
      icon: TrendingUp,
      color: '#16a34a',
      bg: '#f0fdf4',
      trend: t('staffDashboard.statPublishedTrend'),
      urgent: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── Stats ── */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" {...fadeUp(0)}>
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="rounded-2xl p-5 relative overflow-hidden"
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
              <div className="text-xs font-medium mb-2" style={{ color: '#5A6B80' }}>{stat.label}</div>
              {stat.trend ? (
                <span className="text-[11px] font-semibold" style={{ color: stat.urgent ? '#ea580c' : '#5A6B80' }}>{stat.trend}</span>
              ) : null}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Two columns ── */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">

        {/* Clients needing attention */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          {...fadeUp(0.1)}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{t('staffDashboard.needsAttention')}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>
                {loading ? '...' : `${needsAttention.length} ${needsAttention.length === 1 ? 'cliente espera' : 'clientes esperan'} aprobación`}
              </p>
            </div>
            <Link
              href={`/${locale}/portal/staff/approvals`}
              className="flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: '#0A0F1C' }}
            >
              {t('staffDashboard.allApprovals')} <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'rgba(10,15,28,0.06)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background: 'rgba(10,15,28,0.06)', width: '50%' }} />
                    <div className="h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.04)', width: '35%' }} />
                  </div>
                  <div className="w-20 h-6 rounded-full" style={{ background: 'rgba(10,15,28,0.04)' }} />
                </div>
              ))}
            </div>
          ) : needsAttention.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>No hay aprobaciones pendientes</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
              {needsAttention.map((client) => (
                <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(10,15,28,0.04)] transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: client.color + '18', color: client.color }}
                  >
                    {client.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{client.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>
                      {client.postsWeek} {client.postsWeek === 1 ? 'post' : 'posts'} esta semana
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#fff7ed', color: '#ea580c' }}
                    >
                      <Clock size={10} />
                      {client.pending} {client.pending === 1 ? 'pendiente' : 'pendientes'}
                    </span>
                    <Link
                      href={`/${locale}/portal/staff/approvals`}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                      style={{ color: '#0A0F1C' }}
                    >
                      {t('staffDashboard.review')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All clients compact list */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(10,15,28,0.05)', background: '#F7F4EE' }}>
            <div className="flex -space-x-2">
              {upToDate.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 border-white"
                  style={{ background: c.color + '20', color: c.color }}
                  title={c.name}
                >
                  {c.initials}
                </div>
              ))}
            </div>
            <Link
              href={`/${locale}/portal/staff/clients`}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#5A6B80' }}
            >
              {t('staffDashboard.viewAllClients')}
            </Link>
          </div>
        </motion.div>

        {/* Upcoming posts */}
        <motion.div
          className="rounded-2xl overflow-hidden self-start"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          {...fadeUp(0.18)}
        >
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(10,15,28,0.07)' }}>
            <div className="flex items-center gap-2">
              <CalendarDays size={13} style={{ color: '#B8976C' }} />
              <span className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{t('staffDashboard.upcomingPosts')}</span>
            </div>
            <Link
              href={`/${locale}/portal/staff/calendar`}
              className="flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: '#0A0F1C' }}
            >
              {t('staffDashboard.calendar')} <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(10,15,28,0.06)' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded" style={{ background: 'rgba(10,15,28,0.06)', width: '65%' }} />
                    <div className="h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.04)', width: '45%' }} />
                  </div>
                  <div className="w-12 h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.04)' }} />
                </div>
              ))}
            </div>
          ) : upcomingPosts.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>No hay posts próximos</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
              {upcomingPosts.map((post) => {
                const platCfg = PLATFORM_COLORS[post.platform] ?? PLATFORM_COLORS.instagram;
                const PIcon = PLATFORM_ICONS[post.platform] ?? Camera;
                return (
                  <div key={post.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[rgba(10,15,28,0.04)] transition-colors">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(10,15,28,0.06)', color: platCfg.color }}
                    >
                      <PIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#0A0F1C' }}>{post.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: post.clientColor }}
                        />
                        <p className="text-[11px] truncate" style={{ color: '#8A9BB0' }}>{post.client}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#5A6B80' }}>{post.date}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* New post CTA */}
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(10,15,28,0.05)' }}>
            <Link
              href={`/${locale}/portal/staff/content/new`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{ background: '#0A0F1C', color: '#ffffff' }}
            >
              {t('staffDashboard.newPost')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
