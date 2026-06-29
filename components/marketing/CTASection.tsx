'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Check, ArrowRight, Send } from 'lucide-react';
import { FadeIn } from '@/components/ui/FadeIn';

type FormState = 'idle' | 'sending' | 'success' | 'error';

export function CTASection() {
  const t = useTranslations('cta');
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({ name: '', email: '', brand: '', service: '', message: '' });
  const [state, setState] = useState<FormState>('idle');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isValid = form.name.trim() && form.email.trim() && form.message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, meetingDate: meetingDate || undefined, meetingTime: meetingTime || undefined, locale }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  };

  const inputBase = {
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    color: '#ffffff',
    fontFamily: 'inherit',
  } as React.CSSProperties;

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#B8976C';
    e.target.style.boxShadow = '0 0 0 3px rgba(184,151,108,0.12)';
    e.target.style.background = 'rgba(255,255,255,0.09)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.12)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255,255,255,0.06)';
  };

  const SERVICES = ['social', 'reels', 'youtube', 'email', 'web', 'other'] as const;

  const TIME_SLOTS = ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const CAL_DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const CAL_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const todayIso = new Date().toISOString().slice(0, 10);
  const calFirstDay = new Date(calMonth.y, calMonth.m, 1).getDay();
  const calDaysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const prevCalMonth = () => setCalMonth(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const nextCalMonth = () => setCalMonth(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

  return (
    <section
      id="contact"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ background: '#0A0F1C' }}
    >
      {/* Subtle brass glow top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(184,151,108,0.12) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* ── Left: copy ── */}
          <FadeIn x={-30} y={0} className="lg:pt-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-wide"
              style={{ background: 'rgba(184,151,108,0.15)', color: '#B8976C', border: '1px solid rgba(184,151,108,0.3)' }}
            >
              <CalendarCheck size={12} />
              {t('badge')}
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              {t('title')}
            </h2>
            <p className="text-lg font-medium mb-12" style={{ color: 'rgba(215,224,231,0.8)' }}>
              {t('subtitle')}
            </p>

            {/* Social proof bullets */}
            <div className="flex flex-col gap-4">
              {(['proof1', 'proof2', 'proof3'] as const).map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(184,151,108,0.2)', color: '#B8976C' }}
                  >
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(215,224,231,0.85)' }}>
                    {t(key)}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* ── Right: form ── */}
          <FadeIn x={30} y={0} delay={0.15}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <AnimatePresence mode="wait">
                {state === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-10 text-center flex flex-col items-center gap-4"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(22,163,74,0.2)', color: '#4ade80' }}
                    >
                      <Check size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-extrabold text-white">{t('form.successTitle')}</h3>
                    <p className="text-sm font-medium" style={{ color: 'rgba(215,224,231,0.7)' }}>
                      {t('form.successText')}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 lg:p-8 flex flex-col gap-4"
                  >
                    {/* Name + Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>
                          {t('form.name')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('form.namePlaceholder')}
                          value={form.name}
                          onChange={set('name')}
                          className="px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                          style={{ ...inputBase }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>
                          {t('form.email')}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder={t('form.emailPlaceholder')}
                          value={form.email}
                          onChange={set('email')}
                          className="px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                          style={{ ...inputBase }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    </div>

                    {/* Brand + Service */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>
                          {t('form.brand')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('form.brandPlaceholder')}
                          value={form.brand}
                          onChange={set('brand')}
                          className="px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                          style={{ ...inputBase }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>
                          {t('form.service')}
                        </label>
                        <select
                          value={form.service}
                          onChange={set('service')}
                          className="px-4 py-3 rounded-xl text-sm outline-none transition-all cursor-pointer"
                          style={{ ...inputBase }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        >
                          <option value="" style={{ background: '#1a2e3f' }}>{t('form.servicePlaceholder')}</option>
                          {SERVICES.map((s) => (
                            <option key={s} value={s} style={{ background: '#1a2e3f' }}>
                              {t(`form.services.${s}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>
                        {t('form.message')}
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder={t('form.messagePlaceholder')}
                        value={form.message}
                        onChange={set('message')}
                        className="px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none placeholder:opacity-30"
                        style={{ ...inputBase }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>

                    {/* Meeting scheduler */}
                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'rgba(215,224,231,0.7)' }}>
                        <CalendarCheck size={12} style={{ color: '#B8976C' }} />
                        Agenda una reunión (opcional)
                      </label>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                      >
                        {/* Mini calendar header */}
                        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <button type="button" onClick={prevCalMonth} className="p-1 rounded opacity-60 hover:opacity-100 text-white text-xs">‹</button>
                          <span className="text-xs font-semibold text-white">{CAL_MONTHS[calMonth.m]} {calMonth.y}</span>
                          <button type="button" onClick={nextCalMonth} className="p-1 rounded opacity-60 hover:opacity-100 text-white text-xs">›</button>
                        </div>
                        {/* Day labels */}
                        <div className="grid grid-cols-7 px-3 pt-2">
                          {CAL_DAYS.map(d => (
                            <div key={d} className="text-center text-[9px] font-bold uppercase pb-1" style={{ color: 'rgba(215,224,231,0.4)' }}>{d}</div>
                          ))}
                        </div>
                        {/* Days grid */}
                        <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                          {Array.from({ length: calFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                          {Array.from({ length: calDaysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isoDate = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dow = new Date(calMonth.y, calMonth.m, day).getDay();
                            const isWeekend = dow === 0 || dow === 6;
                            const isPast = isoDate <= todayIso;
                            const isSelected = meetingDate === isoDate;
                            const disabled = isWeekend || isPast;
                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={disabled}
                                onClick={() => setMeetingDate(isSelected ? '' : isoDate)}
                                className="w-full aspect-square rounded-lg text-[11px] font-semibold transition-all"
                                style={{
                                  background: isSelected ? '#B8976C' : 'transparent',
                                  color: isSelected ? '#ffffff' : disabled ? 'rgba(215,224,231,0.2)' : 'rgba(215,224,231,0.8)',
                                  cursor: disabled ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        {/* Time slots */}
                        {meetingDate && (
                          <div className="px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] font-semibold pt-3 pb-2" style={{ color: 'rgba(215,224,231,0.5)' }}>Hora (UTC-3)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {TIME_SLOTS.map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setMeetingTime(meetingTime === t ? '' : t)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                  style={{
                                    background: meetingTime === t ? '#B8976C' : 'rgba(255,255,255,0.08)',
                                    color: meetingTime === t ? '#ffffff' : 'rgba(215,224,231,0.7)',
                                    border: meetingTime === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                  }}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Summary */}
                        {meetingDate && meetingTime && (
                          <div className="px-4 pb-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(184,151,108,0.15)', color: '#B8976C' }}>
                              <CalendarCheck size={12} />
                              Reunión: {meetingDate} a las {meetingTime} (UTC-3)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error */}
                    {state === 'error' && (
                      <p className="text-xs font-medium px-3 py-2 rounded-xl" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
                        {t('form.errorText')}
                      </p>
                    )}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={!isValid || state === 'sending'}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                      style={{ background: '#B8976C', color: '#ffffff', boxShadow: '0 4px 20px rgba(184,151,108,0.35)' }}
                      whileHover={isValid ? { scale: 1.01, y: -1 } : {}}
                      whileTap={isValid ? { scale: 0.98 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {state === 'sending' ? (
                        <>{t('form.sending')}</>
                      ) : (
                        <>
                          <Send size={14} />
                          {t('form.submit')}
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
