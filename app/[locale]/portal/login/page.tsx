'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, Loader2, CalendarDays, CheckSquare, FolderOpen, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('portal');
  const params = useParams();

  const PORTAL_FEATURES = [
    { icon: CalendarDays, label: t('login.feature1Label'), desc: t('login.feature1Desc') },
    { icon: CheckSquare, label: t('login.feature2Label'), desc: t('login.feature2Desc') },
    { icon: FolderOpen, label: t('login.feature3Label'), desc: t('login.feature3Desc') },
    { icon: BarChart3, label: t('login.feature4Label'), desc: t('login.feature4Desc') },
  ];
  const locale = params.locale as string;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const baseUrl = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/${locale}/portal/staff/dashboard`,
      },
    });
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseConfigured = supabaseUrl && supabaseUrl.startsWith('http');

    if (!supabaseConfigured) {
      if (email === 'demo@azudigitalstudio.com' && password === 'demo1234') {
        router.push(`/${locale}/portal/dashboard`);
        return;
      }
      if (email === 'staff@azudigitalstudio.com' && password === 'staff1234') {
        router.push(`/${locale}/portal/staff/dashboard`);
        return;
      }
      setError('Demo: cliente → demo@azudigitalstudio.com / demo1234 · staff → staff@azudigitalstudio.com / staff1234');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(t('login.errorInvalid'));
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;
    if (role === 'staff' || role === 'admin') {
      router.push(`/${locale}/portal/staff/dashboard`);
    } else {
      router.push(`/${locale}/portal/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: brand ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: '#0A0F1C' }}
      >
        {/* Brass glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(184,151,108,0.12) 0%, transparent 65%)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <Logo variant="light" />

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#B8976C' }}>
                {t('common.clientPortal')}
              </p>
              <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                {t('login.tagline')}
              </h2>
              <p className="text-base font-medium mb-12" style={{ color: 'rgba(215,224,231,0.7)' }}>
                {t('login.taglineDesc')}
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.div
              className="flex flex-col gap-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {PORTAL_FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(184,151,108,0.15)', color: '#B8976C' }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(215,224,231,0.55)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom strip */}
          <motion.div
            className="pt-8 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <p className="text-xs" style={{ color: 'rgba(215,224,231,0.4)' }}>
              {t('login.footer')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col" style={{ background: '#F7F4EE' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-6">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo variant="dark" />
          </div>
          <div className="hidden lg:block" />

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-slate-900"
            style={{ color: '#8A9BB0' }}
          >
            <ArrowLeft size={14} />
            {t('login.backToSite')}
          </Link>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#0A0F1C' }}>
                {t('login.welcomeBack')}
              </h1>
              <p className="text-sm font-medium" style={{ color: '#8A9BB0' }}>
                {t('login.signInSubtitle')}
              </p>
            </div>

            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.15)', color: '#0A0F1C', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
              <span className="text-xs font-medium" style={{ color: '#8A9BB0' }}>o</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#5A6B80' }}>
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#F7F4EE',
                    border: '1.5px solid rgba(10,15,28,0.12)',
                    color: '#0A0F1C',
                    fontFamily: 'inherit',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#B8976C';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(10,15,28,0.12)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#5A6B80' }}>
                    {t('login.password')}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold transition-colors hover:underline"
                    style={{ color: '#0A0F1C' }}
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: '#F7F4EE',
                      border: '1.5px solid rgba(10,15,28,0.12)',
                      color: '#0A0F1C',
                      fontFamily: 'inherit',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#B8976C';
                      e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(10,15,28,0.12)';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                    style={{ color: '#8A9BB0' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={{
                  background: '#0A0F1C',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(10,15,28,0.25)',
                }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
              <span className="text-xs font-medium" style={{ color: '#8A9BB0' }}>{t('login.secureAccess')}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: '#8A9BB0' }}>
              {t('login.noAccess')}{' '}
              <Link
                href={`/${locale}#contact`}
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#0A0F1C' }}
              >
                {t('login.contactManager')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
