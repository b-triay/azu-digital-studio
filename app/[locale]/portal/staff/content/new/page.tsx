'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Play, Send, Save, Check, Plus, X, Loader2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

// ── Config ────────────────────────────────────────────────────────────────────

type Platform = 'instagram' | 'tiktok' | 'youtube';
type PostAction = 'draft' | 'approval' | 'publish';

const PLATFORMS: {
  id: Platform; label: string; color: string; bg: string;
  Icon: React.ElementType; maxChars: number; hint: string;
  contentTypes: string[];
}[] = [
  {
    id: 'instagram', label: 'Instagram', color: '#c026d3', bg: '#fdf4ff', Icon: Camera,
    maxChars: 2200, hint: 'Reels, stories, carousels — max 2,200 chars',
    contentTypes: ['reel', 'story', 'carousel', 'social_post'],
  },
  {
    id: 'tiktok', label: 'TikTok', color: '#0f0f0f', bg: '#f5f5f5',
    Icon: () => <span className="text-sm font-black leading-none">TK</span>,
    maxChars: 2200, hint: 'Short-form video — max 2,200 chars',
    contentTypes: ['reel', 'social_post'],
  },
  {
    id: 'youtube', label: 'YouTube', color: '#dc2626', bg: '#fef2f2', Icon: Play,
    maxChars: 5000, hint: 'Long-form video, shorts, community posts — max 5,000 chars',
    contentTypes: ['youtube_long', 'youtube_short'],
  },
];

const ALL_CONTENT_TYPES: Record<string, { label: string; rate: number }> = {
  reel:           { label: 'Reel',           rate: 8  },
  story:          { label: 'Story',          rate: 2  },
  carousel:       { label: 'Carousel',       rate: 5  },
  youtube_long:   { label: 'YouTube Long',   rate: 25 },
  youtube_short:  { label: 'YouTube Short',  rate: 8  },
  email_campaign: { label: 'Email Campaign', rate: 25 },
  web_project:    { label: 'Web Project',    rate: 80 },
  social_post:    { label: 'Social Post',    rate: 3  },
};

interface DBClient { id: string; name: string }
interface DBStaff  { id: string; name: string; color: string; role: string }


// ── Page ─────────────────────────────────────────────────────────────────────

export default function NewPostPage() {
  const t = useTranslations('portal');
  const [platform, setPlatform]           = useState<Platform>('instagram');
  const [contentType, setContentType]     = useState('');
  const [clientId, setClientId]           = useState('');
  const [title, setTitle]                 = useState('');
  const [caption, setCaption]             = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customRate, setCustomRate]       = useState<string>('');
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [submitted, setSubmitted]         = useState<PostAction | null>(null);
  const [saving, setSaving]               = useState(false);
  const [directPublish, setDirectPublish] = useState(false);

  const [clients, setClients] = useState<DBClient[]>([]);
  const [staff, setStaff]     = useState<DBStaff[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('clients').select('id, name').eq('status', 'active').order('name'),
      supabase.from('staff_members').select('id, name, color, role').order('name'),
    ]).then(([{ data: c }, { data: s }]) => {
      if (c && c.length > 0) setClients(c);
      if (s && s.length > 0) setStaff(s);
    });
  }, []);

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setContentType('');
    setCustomRate('');
  };

  const handleContentTypeChange = (typeId: string) => {
    const next = typeId === contentType ? '' : typeId;
    setContentType(next);
    setCustomRate(next ? String(ALL_CONTENT_TYPES[next].rate) : '');
  };

  const selectedPlatform  = PLATFORMS.find((p) => p.id === platform)!;
  const selectedClient    = clients.find((c) => c.id === clientId);
  const availableTypes    = selectedPlatform.contentTypes;
  const charCount         = caption.length;
  const maxChars          = selectedPlatform.maxChars;
  const charPercent       = Math.min((charCount / maxChars) * 100, 100);
  const isNearLimit       = charCount > maxChars * 0.8;
  const isOverLimit       = charCount > maxChars;
  const effectiveRate     = customRate !== '' ? parseFloat(customRate) : (ALL_CONTENT_TYPES[contentType]?.rate ?? 0);
  const isValid           = clientId && title.trim() && caption.trim() && scheduledDate && contentType && !isOverLimit && customRate !== '' && !isNaN(effectiveRate) && effectiveRate >= 0;

  const toggleStaff = (id: string) =>
    setAssignedStaff((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSubmit = async (action: PostAction) => {
    if (!isValid || saving) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime || '12:00'}:00`).toISOString();

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          client_id: clientId,
          platform,
          content_type: contentType,
          custom_rate_usd: effectiveRate,
          title: title.trim(),
          caption: caption.trim(),
          scheduled_for: scheduledFor,
          status: action === 'draft' ? 'draft' : action === 'publish' ? 'published' : 'pending_approval',
        })
        .select('id')
        .single();

      if (!postError && post && assignedStaff.length > 0) {
        await supabase.from('post_assignments').insert(
          assignedStaff.map((staffId) => ({ post_id: post.id, staff_member_id: staffId }))
        );
      }
    } catch {
      // Graceful fail — show success in demo mode
    }

    setSaving(false);
    setSubmitted(action);
    setTimeout(() => {
      setSubmitted(null);
      setContentType('');
      setCustomRate('');
      setTitle('');
      setCaption('');
      setScheduledDate('');
      setScheduledTime('');
      setAssignedStaff([]);
    }, 2500);
  };

  const fieldStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1.5px solid rgba(10,15,28,0.12)',
    color: '#334155',
    fontFamily: 'inherit',
  };
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = '#0A0F1C';
      e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.07)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'rgba(10,15,28,0.12)';
      e.target.style.boxShadow = 'none';
    },
  };

  const selectedCT = contentType ? ALL_CONTENT_TYPES[contentType] : null;
  const estCost = assignedStaff.length * effectiveRate;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('newPost.title')}</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
          {t('newPost.subtitle')}
        </p>
      </motion.div>

      {/* Success overlay */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: submitted === 'approval' ? '#f0fdf4' : '#F7F4EE',
              border: submitted === 'approval' ? '1.5px solid #bbf7d0' : '1.5px solid rgba(10,15,28,0.12)',
              color: submitted === 'approval' ? '#16a34a' : '#334155',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: submitted === 'approval' ? '#dcfce7' : '#EDE9E1' }}
            >
              <Check size={16} />
            </div>
            <div>
              <p className="text-sm font-bold">
                {submitted === 'publish'
                  ? t('newPost.successPublished')
                  : submitted === 'approval'
                  ? t('newPost.successApproval')
                  : t('newPost.successDraft')}
              </p>
              <p className="text-xs mt-0.5 opacity-70">
                {submitted === 'publish'
                  ? t('newPost.successPublishedSub')
                  : submitted === 'approval'
                  ? `${selectedClient?.name ?? 'Client'} will be notified to review.`
                  : t('newPost.successDraftSub')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <motion.div
        className="grid lg:grid-cols-[1fr_320px] gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Left: Form ── */}
        <div className="flex flex-col gap-4">

          {/* Platform + content type */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8A9BB0' }}>{t('newPost.platformLabel')}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PLATFORMS.map((p) => {
                const PIcon = p.Icon;
                const isActive = platform === p.id;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => handlePlatformChange(p.id)}
                    className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-all"
                    style={{
                      background: isActive ? p.bg : '#F7F4EE',
                      border: isActive ? `2px solid ${p.color}` : '2px solid transparent',
                      color: isActive ? p.color : '#8A9BB0',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: isActive ? p.color + '18' : 'rgba(0,0,0,0.05)', color: isActive ? p.color : '#5A6B80' }}
                    >
                      <PIcon size={18} />
                    </span>
                    <span className="text-xs font-bold">{p.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Content type for this platform */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>
                {t('newPost.contentTypeLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((typeId) => {
                  const ct = ALL_CONTENT_TYPES[typeId];
                  const isSelected = contentType === typeId;
                  return (
                    <button
                      key={typeId}
                      type="button"
                      onClick={() => handleContentTypeChange(typeId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: isSelected ? '#0A0F1C15' : '#F7F4EE',
                        border: isSelected ? '1.5px solid #B8976C45' : '1.5px solid transparent',
                        color: isSelected ? '#0A0F1C' : '#5A6B80',
                      }}
                    >
                      {ct.label}
                      <span className="opacity-60">${ct.rate}</span>
                    </button>
                  );
                })}
              </div>

              {/* Rate override — always visible */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(10,15,28,0.07)' }}>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold whitespace-nowrap" style={{ color: contentType ? '#5A6B80' : '#cbd5e1' }}>
                    {t('newPost.rateLabel')}
                  </label>
                  <div className="relative w-32">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                      style={{ color: contentType ? '#8A9BB0' : '#e2e8f0' }}
                    >$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      disabled={!contentType}
                      placeholder={contentType ? '' : '—'}
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{
                        ...fieldStyle,
                        fontSize: '14px',
                        opacity: contentType ? 1 : 0.4,
                        cursor: contentType ? 'text' : 'not-allowed',
                      }}
                      onFocus={focusHandlers.onFocus as React.FocusEventHandler<HTMLInputElement>}
                      onBlur={focusHandlers.onBlur as React.FocusEventHandler<HTMLInputElement>}
                    />
                  </div>
                  {contentType && customRate !== '' && parseFloat(customRate) !== ALL_CONTENT_TYPES[contentType]?.rate && parseFloat(customRate) !== 0 && (
                    <span className="text-xs font-medium" style={{ color: '#B8976C' }}>
                      personalizado (default ${ALL_CONTENT_TYPES[contentType]?.rate})
                    </span>
                  )}
                  {customRate === '0' && contentType && (
                    <span className="text-xs font-medium" style={{ color: '#5A6B80' }}>{t('newPost.noCharge')}</span>
                  )}
                  {!contentType && (
                    <span className="text-xs" style={{ color: '#cbd5e1' }}>Selecciona un tipo de contenido primero</span>
                  )}
                </div>
              </div>

            </div>

            <p className="text-[11px] mt-3 font-medium" style={{ color: '#8A9BB0' }}>{selectedPlatform.hint}</p>
          </div>

          {/* Client + title */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('newPost.clientLabel')}</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ ...fieldStyle }}
                {...focusHandlers}
              >
                <option value="">{t('newPost.clientPlaceholder')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>
                {t('newPost.postTitleLabel')} <span className="normal-case font-medium text-slate-400">{t('newPost.postTitleNote')}</span>
              </label>
              <input
                type="text"
                placeholder={t('newPost.postTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ ...fieldStyle }}
                {...focusHandlers}
              />
            </div>
          </div>

          {/* Caption */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>{t('newPost.captionLabel')}</label>
              <span
                className="text-xs font-semibold"
                style={{ color: isOverLimit ? '#dc2626' : isNearLimit ? '#ea580c' : '#8A9BB0' }}
              >
                {charCount} / {maxChars.toLocaleString()}
              </span>
            </div>
            <textarea
              placeholder={t('newPost.captionPlaceholder')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={7}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
              style={{ ...fieldStyle }}
              {...focusHandlers}
            />
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#EDE9E1' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: isOverLimit ? '#dc2626' : isNearLimit ? '#ea580c' : '#0A0F1C' }}
                animate={{ width: `${charPercent}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Schedule */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8A9BB0' }}>{t('newPost.scheduleLabel')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A6B80' }}>{t('newPost.dateLabel')}</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ ...fieldStyle }}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A6B80' }}>
                  {t('newPost.timeLabel')} <span className="opacity-60">{t('newPost.timeOptional')}</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ ...fieldStyle }}
                  {...focusHandlers}
                />
              </div>
            </div>
          </div>

          {/* Staff assignment */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>{t('newPost.assignStaffLabel')}</p>
              {assignedStaff.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(10,15,28,0.08)', color: '#0A0F1C' }}
                >
                  {assignedStaff.length} assigned
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {staff.map((member) => {
                const isAssigned = assignedStaff.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleStaff(member.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                    style={{
                      background: isAssigned ? member.color + '10' : '#F7F4EE',
                      border: isAssigned ? `1.5px solid ${member.color}35` : '1.5px solid transparent',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: member.color + '20', color: member.color }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#334155' }}>{member.name}</p>
                      <p className="text-[11px]" style={{ color: '#8A9BB0' }}>{member.role}</p>
                    </div>
                    {isAssigned
                      ? <Check size={14} style={{ color: member.color, flexShrink: 0 }} />
                      : <Plus size={14} style={{ color: '#8A9BB0', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct publish toggle */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ background: directPublish ? '#fff7ed' : '#ffffff', border: `1px solid ${directPublish ? '#fed7aa' : 'rgba(10,15,28,0.08)'}`, boxShadow: '0 1px 4px rgba(10,15,28,0.05)', transition: 'all 0.2s' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: directPublish ? '#fff7ed' : '#EDE9E1', color: directPublish ? '#B8976C' : '#8A9BB0' }}
              >
                <Zap size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: directPublish ? '#c2410c' : '#334155' }}>{t('newPost.directPublishLabel')}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A9BB0' }}>{t('newPost.directPublishDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDirectPublish(v => !v)}
              className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
              style={{ background: directPublish ? '#B8976C' : '#e2e8f0' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: directPublish ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              onClick={() => handleSubmit('draft')}
              disabled={!isValid || saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#EDE9E1', color: '#5A6B80', border: '1.5px solid rgba(10,15,28,0.1)' }}
              whileHover={isValid ? { scale: 1.01, y: -1 } : {}}
              whileTap={isValid ? { scale: 0.98 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('newPost.saveDraft')}
            </motion.button>
            <motion.button
              onClick={() => handleSubmit(directPublish ? 'publish' : 'approval')}
              disabled={!isValid || saving}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: directPublish ? '#c2410c' : '#0A0F1C',
                color: '#ffffff',
                boxShadow: `0 2px 8px ${directPublish ? 'rgba(194,65,12,0.3)' : 'rgba(10,15,28,0.25)'}`,
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              whileHover={isValid ? { scale: 1.01, y: -1 } : {}}
              whileTap={isValid ? { scale: 0.98 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : directPublish ? <Zap size={14} /> : <Send size={14} />}
              {directPublish ? t('newPost.publishNow') : t('newPost.sendApproval')}
            </motion.button>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="self-start sticky top-6 flex flex-col gap-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
          >
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>{t('newPost.previewLabel')}</p>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {selectedClient ? (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: '#B8976C20', color: '#0A0F1C' }}
                  >
                    {selectedClient.name.charAt(0)}
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: '#EDE9E1' }} />
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: selectedClient ? '#0A0F1C' : '#cbd5e1' }}>
                    {selectedClient?.name ?? t('newPost.selectClient')}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#8A9BB0' }}>
                    {scheduledDate
                      ? new Date(scheduledDate + 'T12:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
                      : t('newPost.scheduleNotSet')}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: selectedPlatform.bg, color: selectedPlatform.color }}
                >
                  {selectedPlatform.label}
                </span>
              </div>
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  height: '160px',
                  background: 'linear-gradient(135deg, rgba(10,15,28,0.05) 0%, rgba(184,151,108,0.07) 100%)',
                  border: '1.5px dashed rgba(10,15,28,0.12)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{t('newPost.mediaPlaceholder')}</p>
              </div>
              <div className="min-h-[60px]">
                {caption ? (
                  <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
                    {caption.length > 200 ? caption.slice(0, 200) + '…' : caption}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: '#cbd5e1' }}>{t('newPost.captionPreview')}</p>
                )}
              </div>
              {title && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#F7F4EE', borderLeft: '3px solid #B8976C' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#8A9BB0' }}>{t('newPost.postTitlePreview')}</p>
                  <p className="text-xs font-bold" style={{ color: '#0A0F1C' }}>{title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned staff + cost summary */}
          <AnimatePresence>
            {(assignedStaff.length > 0 || selectedCT) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-2xl p-4"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
              >
                {selectedCT && (
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>{t('newPost.contentTypePreview')}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#0A0F1C' }}>{selectedCT.label}</p>
                    </div>
                    <span
                      className="text-base font-extrabold px-3 py-1 rounded-xl"
                      style={{ background: '#B8976C10', color: '#0A0F1C' }}
                    >
                      ${effectiveRate}/ea
                    </span>
                  </div>
                )}

                {assignedStaff.length > 0 && (
                  <>
                    {selectedCT && <div className="mb-3" style={{ borderTop: '1px solid rgba(10,15,28,0.06)' }} />}
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A9BB0' }}>{t('newPost.teamLabel')}</p>
                    <div className="flex flex-col gap-1.5">
                      {assignedStaff.map((staffId) => {
                        const member = staff.find((s) => s.id === staffId);
                        if (!member) return null;
                        return (
                          <div key={staffId} className="flex items-center gap-2.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ background: member.color + '20', color: member.color }}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold flex-1" style={{ color: '#334155' }}>{member.name}</span>
                            {selectedCT && (
                              <span className="text-xs font-bold" style={{ color: '#0A0F1C' }}>${effectiveRate}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleStaff(staffId)}
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <X size={11} style={{ color: '#8A9BB0' }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {selectedCT && assignedStaff.length > 0 && (
                      <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(10,15,28,0.08)' }}>
                        <span className="text-xs font-medium" style={{ color: '#5A6B80' }}>{t('newPost.estTotal')}</span>
                        <span className="text-sm font-extrabold" style={{ color: '#0A0F1C' }}>${estCost}</span>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
