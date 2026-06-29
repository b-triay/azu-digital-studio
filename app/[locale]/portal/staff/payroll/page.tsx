'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, DollarSign, FileText, Users, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentRate { content_type: string; rate_usd: number }

interface AssignmentRow {
  id: string;
  staffId: string;
  staffName: string;
  staffColor: string;
  staffRole: string;
  contentType: string;
  rateUsd: number;
  postTitle: string;
  platform: string;
  status: string;
  scheduledFor: Date;
  clientName: string;
}


// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', email: 'Email',
};

const CONTENT_LABEL: Record<string, string> = {
  reel: 'Reel', story: 'Story', carousel: 'Carousel',
  youtube_long: 'YT Long', youtube_short: 'YT Short',
  email_campaign: 'Email Camp.', web_project: 'Web Project', social_post: 'Social Post',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const t = useTranslations('portal');
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth()); // 0-indexed
  const [rows, setRows]     = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const MONTHS = Array.from({ length: 12 }, (_, i) => t(`payroll.months.${i}` as Parameters<typeof t>[0]));

  const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    published:        { label: t('payroll.statusPublished'), color: '#16a34a', bg: '#f0fdf4' },
    approved:         { label: t('payroll.statusApproved'),  color: '#2563eb', bg: '#eff6ff' },
    pending_approval: { label: t('payroll.statusPending'),   color: '#d97706', bg: '#fffbeb' },
    draft:            { label: t('payroll.statusDraft'),     color: '#5A6B80', bg: '#F7F4EE' },
    rejected:         { label: t('payroll.statusRejected'),  color: '#dc2626', bg: '#fef2f2' },
  };

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('post_assignments').select('id, post_id, staff_member_id, created_at'),
      supabase.from('posts').select('id, title, platform, content_type, custom_rate_usd, status, scheduled_for, client_id'),
      supabase.from('staff_members').select('id, name, color, role'),
      supabase.from('clients').select('id, name'),
      supabase.from('content_rates').select('content_type, rate_usd'),
    ]).then(([assignRes, postRes, staffRes, clientRes, rateRes]) => {
      const assignments = assignRes.data ?? [];
      const posts       = postRes.data ?? [];
      const staff       = staffRes.data ?? [];
      const clients     = clientRes.data ?? [];
      const rates       = rateRes.data ?? [];

      if (assignments.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const postMap    = Object.fromEntries(posts.map(p => [p.id, p]));
      const staffMap   = Object.fromEntries(staff.map(s => [s.id, s]));
      const clientMap  = Object.fromEntries(clients.map(c => [c.id, c]));
      const rateMap    = Object.fromEntries(rates.map(r => [r.content_type, r.rate_usd]));

      const mapped: AssignmentRow[] = assignments
        .map(a => {
          const post  = postMap[a.post_id];
          const sm    = staffMap[a.staff_member_id];
          if (!post || !sm) return null;
          return {
            id:          a.id,
            staffId:     sm.id,
            staffName:   sm.name,
            staffColor:  sm.color,
            staffRole:   sm.role,
            contentType: post.content_type,
            rateUsd:     post.custom_rate_usd ?? rateMap[post.content_type] ?? 0,
            postTitle:   post.title,
            platform:    post.platform,
            status:      post.status,
            scheduledFor: new Date(post.scheduled_for),
            clientName:  clientMap[post.client_id]?.name ?? '—',
          } satisfies AssignmentRow;
        })
        .filter((r): r is AssignmentRow => r !== null);

      setRows(mapped);
      setLoading(false);
    }).catch(() => {
      setRows([]);
      setLoading(false);
    });
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const filtered = useMemo(() =>
    rows.filter((r) => {
      const d = r.scheduledFor;
      return d.getFullYear() === year && d.getMonth() === month;
    }),
  [rows, year, month]);

  const byStaff = useMemo(() => {
    const map = new Map<string, { info: Pick<AssignmentRow,'staffId'|'staffName'|'staffColor'|'staffRole'>; rows: AssignmentRow[] }>();
    filtered.forEach((r) => {
      if (!map.has(r.staffId)) {
        map.set(r.staffId, { info: { staffId: r.staffId, staffName: r.staffName, staffColor: r.staffColor, staffRole: r.staffRole }, rows: [] });
      }
      map.get(r.staffId)!.rows.push(r);
    });
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.rows.reduce((s, r) => s + r.rateUsd, 0);
      const tb = b.rows.reduce((s, r) => s + r.rateUsd, 0);
      return tb - ta;
    });
  }, [filtered]);

  const totalPayout  = filtered.reduce((s, r) => s + r.rateUsd, 0);
  const totalPosts   = filtered.length;
  const activeStaff  = byStaff.length;

  const toggleExpand = (staffId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(staffId) ? next.delete(staffId) : next.add(staffId);
      return next;
    });
  };

  const summaryCards = [
    { icon: DollarSign, label: t('payroll.totalPayout'),    value: `$${totalPayout}`, color: '#0A0F1C' },
    { icon: FileText,   label: t('payroll.postsCompleted'), value: totalPosts,         color: '#B8976C' },
    { icon: Users,      label: t('payroll.activeStaff'),    value: activeStaff,        color: '#10b981' },
  ];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('payroll.title')}</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
          {t('payroll.subtitle')}
        </p>
      </motion.div>

      {/* Month selector */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl transition-colors hover:bg-[rgba(10,15,28,0.07)]"
          style={{ border: '1.5px solid rgba(10,15,28,0.12)' }}
        >
          <ChevronLeft size={16} style={{ color: '#5A6B80' }} />
        </button>
        <div
          className="px-5 py-2 rounded-xl font-bold text-sm"
          style={{ background: '#0A0F1C', color: '#ffffff', minWidth: '160px', textAlign: 'center' }}
        >
          {MONTHS[month]} {year}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl transition-colors hover:bg-[rgba(10,15,28,0.07)]"
          style={{ border: '1.5px solid rgba(10,15,28,0.12)' }}
        >
          <ChevronRight size={16} style={{ color: '#5A6B80' }} />
        </button>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {summaryCards.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '12' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>{label}</p>
              <p className="text-xl font-extrabold leading-tight" style={{ color: '#0A0F1C' }}>{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Per-staff breakdown */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : byStaff.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
        >
          <TrendingUp size={36} style={{ color: '#cbd5e1' }} />
          <p className="text-sm font-semibold mt-3" style={{ color: '#8A9BB0' }}>{t('payroll.noPostsTitle')}</p>
          <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>{t('payroll.noPostsDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {byStaff.map(({ info, rows: staffRows }, idx) => {
            const total    = staffRows.reduce((s, r) => s + r.rateUsd, 0);
            const isOpen   = expanded.has(info.staffId);
            const byType   = staffRows.reduce<Record<string, { count: number; total: number }>>(
              (acc, r) => {
                if (!acc[r.contentType]) acc[r.contentType] = { count: 0, total: 0 };
                acc[r.contentType].count++;
                acc[r.contentType].total += r.rateUsd;
                return acc;
              }, {}
            );

            return (
              <motion.div
                key={info.staffId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
              >
                {/* Staff header row */}
                <button
                  onClick={() => toggleExpand(info.staffId)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgba(10,15,28,0.04)]"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: info.staffColor + '20', color: info.staffColor }}
                  >
                    {info.staffName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold" style={{ color: '#0A0F1C' }}>{info.staffName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8A9BB0' }}>{info.staffRole}</p>
                  </div>

                  {/* Type breakdown chips */}
                  <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-xs">
                    {Object.entries(byType).map(([type, { count }]) => (
                      <span
                        key={type}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: info.staffColor + '14', color: info.staffColor }}
                      >
                        {CONTENT_LABEL[type] ?? type} ×{count}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-extrabold" style={{ color: '#0A0F1C' }}>${total}</p>
                      <p className="text-[10px]" style={{ color: '#8A9BB0' }}>{staffRows.length} posts</p>
                    </div>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: '#8A9BB0' }} />
                      : <ChevronDown size={16} style={{ color: '#8A9BB0' }} />}
                  </div>
                </button>

                {/* Expanded: per-post table */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div style={{ borderTop: '1px solid rgba(10,15,28,0.06)' }}>
                        <div
                          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-2.5"
                          style={{
                            gridTemplateColumns: '1fr 100px 100px 80px 60px',
                            color: '#8A9BB0',
                            background: '#F7F4EE',
                          }}
                        >
                          <span>{t('payroll.tablePost')}</span>
                          <span>{t('payroll.tableClient')}</span>
                          <span>{t('payroll.tableContentType')}</span>
                          <span>{t('payroll.tableStatus')}</span>
                          <span className="text-right">{t('payroll.tableRate')}</span>
                        </div>
                        {staffRows
                          .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime())
                          .map((row) => {
                            const statusCfg = STATUS_LABEL[row.status] ?? STATUS_LABEL['draft'];
                            return (
                              <div
                                key={row.id}
                                className="grid items-center px-5 py-3"
                                style={{
                                  gridTemplateColumns: '1fr 100px 100px 80px 60px',
                                  borderTop: '1px solid rgba(10,15,28,0.05)',
                                }}
                              >
                                <div className="min-w-0 pr-3">
                                  <p className="text-xs font-semibold truncate" style={{ color: '#334155' }}>{row.postTitle}</p>
                                  <p className="text-[10px] mt-0.5" style={{ color: '#8A9BB0' }}>
                                    {PLATFORM_LABEL[row.platform] ?? row.platform} · {row.scheduledFor.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                                <p className="text-xs font-medium truncate" style={{ color: '#5A6B80' }}>{row.clientName}</p>
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
                                  style={{ background: info.staffColor + '14', color: info.staffColor }}
                                >
                                  {CONTENT_LABEL[row.contentType] ?? row.contentType}
                                </span>
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
                                  style={{ background: statusCfg.bg, color: statusCfg.color }}
                                >
                                  {statusCfg.label}
                                </span>
                                <p className="text-sm font-extrabold text-right" style={{ color: '#0A0F1C' }}>${row.rateUsd}</p>
                              </div>
                            );
                          })}
                        {/* Staff subtotal */}
                        <div
                          className="flex items-center justify-between px-5 py-3"
                          style={{ borderTop: '1px solid rgba(10,15,28,0.08)', background: '#F7F4EE' }}
                        >
                          <span className="text-xs font-bold" style={{ color: '#5A6B80' }}>
                            {info.staffName} — {MONTHS[month]} total
                          </span>
                          <span className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>${total}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Grand total */}
          <div
            className="flex items-center justify-between px-6 py-4 rounded-2xl mt-1"
            style={{ background: '#0A0F1C', color: '#ffffff' }}
          >
            <div>
              <p className="text-xs font-semibold opacity-70">Total payout — {MONTHS[month]} {year}</p>
              <p className="text-xs opacity-50 mt-0.5">{totalPosts} posts · {activeStaff} staff members</p>
            </div>
            <p className="text-2xl font-extrabold">${totalPayout}</p>
          </div>
        </div>
      )}
    </div>
  );
}
