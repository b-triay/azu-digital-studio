'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, Pencil, Circle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContentCalendar } from '@/components/portal/ContentCalendar';
import { createClient } from '@/lib/supabase/client';
import type { Post, PostStatus } from '@/lib/types';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG_BASE: Record<PostStatus, { color: string; bg: string; border: string; Icon: React.ElementType }> = {
  draft: { color: '#5A6B80', bg: '#EDE9E1', border: '#e2e8f0', Icon: Pencil },
  pending_approval: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', Icon: Clock },
  approved: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: CheckCircle2 },
  published: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', Icon: Circle },
  rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: XCircle },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  instagram: { label: 'Instagram', color: '#c026d3', bg: '#fdf4ff' },
  tiktok: { label: 'TikTok', color: '#0f0f0f', bg: '#f5f5f5' },
  youtube: { label: 'YouTube', color: '#dc2626', bg: '#fef2f2' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const t = useTranslations('portal');

  const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
    draft: { ...STATUS_CONFIG_BASE.draft, label: t('calendar.statusDraft') },
    pending_approval: { ...STATUS_CONFIG_BASE.pending_approval, label: t('calendar.statusNeedsApproval') },
    approved: { ...STATUS_CONFIG_BASE.approved, label: t('calendar.statusApproved') },
    published: { ...STATUS_CONFIG_BASE.published, label: t('calendar.statusPublished') },
    rejected: { ...STATUS_CONFIG_BASE.rejected, label: t('calendar.statusRejected') },
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setClientId(data.id);
          setLoading(false);
        });
    });
  }, []);

  const handlePostClick = (post: Post) => {
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6.5 h-6.5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">

      {/* ── Header ── */}
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

        {/* Status legend */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
          {(Object.entries(STATUS_CONFIG) as [PostStatus, typeof STATUS_CONFIG[PostStatus]][]).map(
            ([key, cfg]) => {
              const Icon = cfg.Icon;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                  <Icon size={10} />
                  {cfg.label}
                </span>
              );
            }
          )}
        </div>
      </motion.div>

      {/* ── Main area: Calendar + detail panel ── */}
      <motion.div
        className="grid gap-4"
        style={{ gridTemplateColumns: selectedPost ? '1fr 300px' : '1fr' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Calendar */}
        <div className="min-w-0">
          <ContentCalendar
            clientId={clientId || undefined}
            onPostClick={handlePostClick}
            selectedPostId={selectedPost?.id}
          />
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              key={selectedPost.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden self-start"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
            >
              {(() => {
                const statusCfg = STATUS_CONFIG[selectedPost.status];
                const platCfg = PLATFORM_CONFIG[selectedPost.platform] ?? PLATFORM_CONFIG.instagram;
                
                return (
                  <>
                    {/* Panel header */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5"
                      style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}
                    >
                      <span className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{t('calendar.postDetails')}</span>
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                        style={{ color: '#5A6B80' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-4">
                      {/* Platform + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: platCfg.bg, color: platCfg.color }}
                        >
                          {platCfg.label}
                        </span>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                          style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
                        >
                          <statusCfg.Icon size={10} />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Título</h4>
                        <p className="text-sm font-bold mt-0.5" style={{ color: '#0A0F1C' }}>{selectedPost.title}</p>
                      </div>

                      {/* Date */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Programado para</h4>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#5A6B80' }}>
                          {new Date(selectedPost.scheduled_for).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Caption */}
                      {selectedPost.caption && (
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descripción / Copy</h4>
                          <p className="text-xs font-medium mt-1 leading-relaxed whitespace-pre-wrap p-3 rounded-xl border border-slate-100 bg-slate-50" style={{ color: '#334155' }}>
                            {selectedPost.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
