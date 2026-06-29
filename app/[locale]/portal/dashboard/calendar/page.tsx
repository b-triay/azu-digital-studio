'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, Pencil, Circle, XCircle, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContentCalendar } from '@/components/portal/ContentCalendar';
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

  const handlePostClick = (post: Post) => {
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  };

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
                const SIcon = statusCfg.Icon;

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
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
                        >
                          <SIcon size={10} />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>{t('calendar.titleLabel')}</p>
                        <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{selectedPost.title}</p>
                      </div>

                      {/* Scheduled date */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>{t('calendar.scheduledLabel')}</p>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={13} style={{ color: '#5A6B80' }} />
                          <p className="text-sm font-medium" style={{ color: '#334155' }}>
                            {new Date(selectedPost.scheduled_for).toLocaleDateString('en', {
                              weekday: 'long', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Caption */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>{t('calendar.captionLabel')}</p>
                        <div
                          className="px-3 py-3 rounded-xl text-sm leading-relaxed font-medium"
                          style={{ background: '#F7F4EE', color: '#334155', border: '1px solid rgba(10,15,28,0.07)' }}
                        >
                          {selectedPost.caption}
                        </div>
                      </div>

                      {/* CTA if pending */}
                      {selectedPost.status === 'pending_approval' && (
                        <a
                          href="../approvals"
                          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: '#fff7ed', color: '#ea580c', border: '1.5px solid #fed7aa' }}
                        >
                          <Clock size={12} />
                          {t('calendar.goToApprovals')}
                        </a>
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
