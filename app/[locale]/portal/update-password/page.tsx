'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UpdatePasswordPage() {
  const t = useTranslations('portal');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('topbar.pwTooShort')); return; }
    if (password !== confirm) { setError(t('topbar.pwMismatch')); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push(`/${locale}/portal/dashboard`), 2500);
  };

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1.5px solid rgba(10,15,28,0.15)',
    color: '#334155',
    fontFamily: 'inherit',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #141C2E 100%)' }}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-3"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-xl font-black text-white tracking-tight">Azu</span>
            <span className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.7)' }}>Digital Studio</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{t('updatePassword.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(215,224,231,0.7)' }}>{t('updatePassword.desc')}</p>
        </div>

        <div
          className="rounded-3xl p-7"
          style={{ background: '#ffffff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
        >
          {done ? (
            <motion.div
              className="flex flex-col items-center gap-3 py-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle2 size={48} style={{ color: '#16a34a' }} />
              <p className="text-base font-bold text-center" style={{ color: '#0A0F1C' }}>
                {t('topbar.pwChanged')}
              </p>
              <p className="text-sm text-center" style={{ color: '#5A6B80' }}>
                {t('updatePassword.redirecting')}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>
                  {t('topbar.newPassword')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A9BB0' }}>
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#0A0F1C'; e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.07)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(10,15,28,0.15)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgba(10,15,28,0.07)]"
                    style={{ color: '#8A9BB0' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>
                  {t('topbar.confirmPassword')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A9BB0' }}>
                    <Lock size={14} />
                  </span>
                  <input
                    type={showCf ? 'text' : 'password'}
                    required
                    placeholder="repetí la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-9 pr-11 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#0A0F1C'; e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.07)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(10,15,28,0.15)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgba(10,15,28,0.07)]"
                    style={{ color: '#8A9BB0' }}>
                    {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-xs font-medium"
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-all hover:-translate-y-0.5"
                style={{ background: '#0A0F1C', color: '#ffffff', boxShadow: '0 4px 16px rgba(10,15,28,0.3)' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t('updatePassword.submit')}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
