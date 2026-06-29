'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Camera, Play, CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'email';
type Status = 'pending' | 'approved' | 'rejected';
type FilterTab = Status;

interface ApprovalItem {
  id: string;
  platform: Platform;
  title: string;
  caption: string | null;
  scheduled: string;
  status: Status;
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#c026d3', bg: '#fdf4ff', Icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#0f0f0f', bg: '#f5f5f5', Icon: () => <span className="text-[10px] font-black leading-none">TK</span> },
  youtube:   { label: 'YouTube',   color: '#dc2626', bg: '#fef2f2', Icon: Play },
  email:     { label: 'Email',     color: '#2563eb', bg: '#eff6ff', Icon: MessageSquare },
};

const STATUS_CONFIG_BASE: Record<Status, { color: string; bg: string; Icon: React.ElementType }> = {
  pending:  { color: '#ea580c', bg: '#fff7ed', Icon: Clock },
  approved: { color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 },
  rejected: { color: '#dc2626', bg: '#fef2f2', Icon: XCircle },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' });
}

function dbStatusToLocal(s: string): Status {
  if (s === 'pending_approval') return 'pending';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

export default function ApprovalsPage() {
  const t = useTranslations('portal');

  const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    pending:  { ...STATUS_CONFIG_BASE.pending,  label: t('approvals.statusNeedsReview') },
    approved: { ...STATUS_CONFIG_BASE.approved, label: t('approvals.statusApproved') },
    rejected: { ...STATUS_CONFIG_BASE.rejected, label: t('approvals.statusRejected') },
  };

  const [items, setItems]       = useState<ApprovalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!clientRow) { setLoading(false); return; }

    const { data: posts } = await supabase
      .from('posts')
      .select('id, platform, title, caption, scheduled_for, status')
      .eq('client_id', clientRow.id)
      .in('status', ['pending_approval', 'approved', 'rejected'])
      .order('scheduled_for', { ascending: true });

    const mapped: ApprovalItem[] = (posts ?? []).map((p) => ({
      id: p.id,
      platform: (p.platform ?? 'instagram') as Platform,
      title: p.title ?? '(sin título)',
      caption: p.caption ?? null,
      scheduled: formatDate(p.scheduled_for),
      status: dbStatusToLocal(p.status),
    }));

    setItems(mapped);
    const firstPending = mapped.find((i) => i.status === 'pending');
    setSelectedId(firstPending?.id ?? mapped[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = (s: Status) => items.filter((i) => i.status === s);
  const pending  = byStatus('pending');
  const approved = byStatus('approved');
  const rejected = byStatus('rejected');

  const listItems = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : rejected;
  const selected  = items.find((i) => i.id === selectedId);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const supabase = createClient();
    await supabase
      .from('posts')
      .update({ status: action })
      .eq('id', id);

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: action } : i)));
    const nextPending = items.find((i) => i.id !== id && i.status === 'pending');
    if (nextPending) {
      setSelectedId(nextPending.id);
      setActiveTab('pending');
    } else {
      setActiveTab(action);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'pending',  label: t('approvals.tabPending'),  count: pending.length },
    { key: 'approved', label: t('approvals.tabApproved'), count: approved.length },
    { key: 'rejected', label: t('approvals.tabRejected'), count: rejected.length },
  ];

  const allDone = pending.length === 0 && approved.length + rejected.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('approvals.title')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>{t('approvals.subtitle')}</p>
        </div>
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
        >
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-lg font-extrabold mb-1" style={{ color: '#0A0F1C' }}>Sin publicaciones todavía</h2>
          <p className="text-sm font-medium" style={{ color: '#5A6B80' }}>
            Tu equipo aún no subió contenido para aprobar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">

      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('approvals.title')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>{t('approvals.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {[
            { count: pending.length,  label: t('approvals.chipPending'),  color: '#ea580c', bg: '#fff7ed' },
            { count: approved.length, label: t('approvals.chipApproved'), color: '#16a34a', bg: '#f0fdf4' },
            { count: rejected.length, label: t('approvals.chipRejected'), color: '#dc2626', bg: '#fef2f2' },
          ].map(({ count, label, color, bg }) => (
            <span
              key={label}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: bg, color }}
            >
              <span className="font-black">{count}</span> {label}
            </span>
          ))}
        </div>
      </motion.div>

      {allDone ? (
        <motion.div
          className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-lg font-extrabold mb-1" style={{ color: '#0A0F1C' }}>{t('approvals.allCaughtUp')}</h2>
          <p className="text-sm font-medium" style={{ color: '#5A6B80' }}>
            {approved.length} aprobadas · {rejected.length} rechazadas
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid lg:grid-cols-[280px_1fr] gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Lista */}
          <div
            className="rounded-2xl overflow-hidden self-start"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div className="flex border-b" style={{ borderColor: 'rgba(10,15,28,0.08)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    const first = items.find((i) => i.status === tab.key);
                    if (first) setSelectedId(first.id);
                  }}
                  className="flex-1 py-3 text-xs font-semibold transition-all relative"
                  style={{
                    color: activeTab === tab.key ? '#0A0F1C' : '#8A9BB0',
                    background: activeTab === tab.key ? '#F7F4EE' : 'transparent',
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: activeTab === tab.key ? '#0A0F1C' : 'rgba(10,15,28,0.1)',
                        color: activeTab === tab.key ? '#fff' : '#5A6B80',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#0A0F1C' }} />
                  )}
                </button>
              ))}
            </div>

            {listItems.length === 0 ? (
              <div className="py-10 text-center px-4">
                <p className="text-xs font-medium" style={{ color: '#8A9BB0' }}>{t('approvals.noItems')}</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
                {listItems.map((item) => {
                  const plat = PLATFORM_CONFIG[item.platform] ?? PLATFORM_CONFIG.instagram;
                  const PIcon = plat.Icon;
                  const isSelected = item.id === selectedId;
                  const statusCfg = STATUS_CONFIG[item.status];
                  const SIcon = statusCfg.Icon;
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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: plat.bg, color: plat.color }}>
                        <PIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#0A0F1C' }}>{item.title}</p>
                        <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#8A9BB0' }}>
                          <SIcon size={10} style={{ color: statusCfg.color }} />
                          {plat.label} · {item.scheduled}
                        </p>
                      </div>
                      {isSelected && <ChevronRight size={12} style={{ color: '#0A0F1C', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel de detalle */}
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
                  return (
                    <>
                      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: plat.bg, color: plat.color }}>
                            <PIcon size={16} />
                          </div>
                          <div>
                            <h2 className="text-base font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{selected.title}</h2>
                            <p className="text-xs font-medium mt-0.5" style={{ color: '#5A6B80' }}>
                              {plat.label} · {selected.scheduled}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="p-6 flex flex-col gap-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('approvals.captionLabel')}</p>
                          <div
                            className="px-4 py-4 rounded-xl text-sm leading-relaxed font-medium"
                            style={{ background: '#F7F4EE', color: '#334155', border: '1px solid rgba(10,15,28,0.07)' }}
                          >
                            {selected.caption ?? <span style={{ color: '#8A9BB0', fontStyle: 'italic' }}>Sin caption</span>}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('approvals.mediaLabel')}</p>
                          <div
                            className="rounded-xl flex items-center justify-center"
                            style={{ height: '200px', background: 'linear-gradient(135deg, rgba(10,15,28,0.05) 0%, rgba(184,151,108,0.07) 100%)', border: '1.5px dashed rgba(10,15,28,0.15)' }}
                          >
                            <div className="text-center">
                              <p className="text-sm font-semibold" style={{ color: '#8A9BB0' }}>{t('approvals.mediaPreview')}</p>
                              <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>{t('approvals.mediaUploadHint')}</p>
                            </div>
                          </div>
                        </div>

                        {selected.status === 'pending' && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>
                              {t('approvals.commentLabel')} <span className="normal-case font-medium text-slate-400">{t('approvals.commentOptional')}</span>
                            </p>
                            <textarea
                              placeholder={t('approvals.commentPlaceholder')}
                              value={comments[selected.id] ?? ''}
                              onChange={(e) => setComments((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                              style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                            />
                          </div>
                        )}

                        {selected.status === 'pending' && (
                          <div className="flex gap-3 pt-1">
                            <motion.button
                              onClick={() => handleAction(selected.id, 'approved')}
                              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0' }}
                              whileHover={{ scale: 1.01, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              <Check size={15} strokeWidth={2.5} /> {t('approvals.approve')}
                            </motion.button>
                            <motion.button
                              onClick={() => handleAction(selected.id, 'rejected')}
                              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}
                              whileHover={{ scale: 1.01, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              <X size={15} strokeWidth={2.5} /> {t('approvals.requestChanges')}
                            </motion.button>
                          </div>
                        )}

                        {selected.status !== 'pending' && (
                          <div
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium"
                            style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${selected.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}
                          >
                            {selected.status === 'approved'
                              ? <><CheckCircle2 size={16} /> {t('approvals.postApproved')}</>
                              : <><XCircle size={16} /> {t('approvals.changesRequested')}</>
                            }
                          </div>
                        )}
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
                <p className="text-sm font-medium" style={{ color: '#8A9BB0' }}>{t('approvals.selectPost')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
