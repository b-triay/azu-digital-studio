'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Menu, ChevronDown, KeyRound, LogOut,
  CheckCircle2, Loader2,
  CheckSquare, FileText, MessageCircle, Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  approval: CheckSquare,
  file:     FileText,
  message:  MessageCircle,
  system:   Settings,
};

const NOTIF_COLORS: Record<string, { bg: string; color: string }> = {
  approval: { bg: '#f0fdf4', color: '#16a34a' },
  file:     { bg: '#eff6ff', color: '#2563eb' },
  message:  { bg: '#fdf4ff', color: '#9333ea' },
  system:   { bg: 'rgba(184,151,108,0.1)', color: '#B8976C' },
};

interface TopBarProps {
  onMenuToggle?: () => void;
  userName?: string;
}

export function TopBar({ onMenuToggle, userName: userNameProp = 'Client' }: TopBarProps) {
  const t = useTranslations('portal');
  const tb = useTranslations('portal.topbar');
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();
  const router = useRouter();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? tb('morning') : hour < 18 ? tb('afternoon') : tb('evening');

  const PAGE_TITLES: Record<string, string> = {
    'dashboard':              t('nav.overview'),
    'dashboard/calendar':     t('nav.calendar'),
    'dashboard/approvals':    t('nav.approvals'),
    'dashboard/files':        t('nav.files'),
    'dashboard/messages':     t('nav.messages'),
    'dashboard/billing':      'Facturación',
    'staff':                  t('nav.dashboard'),
    'staff/dashboard':        t('nav.dashboard'),
    'staff/approvals':        t('nav.approvals'),
    'staff/calendar':         t('nav.calendar'),
    'staff/clients':          t('nav.clients'),
    'staff/content/new':      t('nav.newPost'),
    'staff/files':            t('nav.files'),
    'staff/messages':         t('nav.messages'),
    'staff/payroll':          t('nav.payroll'),
    'staff/posts':            t('nav.posts'),
    'staff/plans':            'Planes',
    'staff/settings':         'Configuración',
    'staff/tickets':          'Tickets',
  };

  const pageSection = (() => {
    const parts = pathname.split('/portal/');
    const section = parts[1] ?? '';
    return PAGE_TITLES[section] ?? '';
  })();

  const getLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    return segments.join('/');
  };

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [userName, setUserName]   = useState(userNameProp);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.name as string | undefined;
      setUserName(name || user.email?.split('@')[0] || userNameProp);
      setUserEmail(user.email ?? '');
    });
  }, [userNameProp]);

  // ── Profile dropdown ─────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-profile-dropdown]');
      if (!el) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/portal/login`);
  };

  // ── Change password ───────────────────────────────────────────────────────────
  const [changingPw, setChangingPw]   = useState(false);
  const [pwForm, setPwForm]           = useState({ next: '', confirm: '' });
  const [pwError, setPwError]         = useState('');
  const [pwSuccess, setPwSuccess]     = useState(false);
  const [pwSaving, setPwSaving]       = useState(false);

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwError(tb('pwMismatch')); return; }
    if (pwForm.next.length < 8) { setPwError(tb('pwTooShort')); return; }
    setPwError('');
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
  };

  // ── Notifications ────────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);

  useEffect(() => {
    const loadNotifs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data ?? []);
    };
    loadNotifs();
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const close = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-notif-dropdown]');
      if (!el) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const fieldStyle: React.CSSProperties = {
    background: '#F7F4EE',
    border: '1.5px solid rgba(10,15,28,0.12)',
    color: '#5A6B80',
    fontFamily: 'inherit',
  };

  return (
    <>
      <header
        className="h-14 px-4 sm:px-6 flex items-center justify-between flex-shrink-0"
        style={{ background: '#F7F4EE', borderBottom: '1px solid rgba(10,15,28,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5 rounded-lg transition-colors hover:bg-[rgba(10,15,28,0.07)]"
            onClick={onMenuToggle} style={{ color: '#0A0F1C' }}>
            <Menu size={18} />
          </button>
          <div>
            <span className="text-sm font-semibold" style={{ color: '#0A0F1C' }}>
              {greeting}, {userName}
            </span>
            {pageSection && (
              <span className="hidden sm:inline text-sm ml-1" style={{ color: '#8A9BB0' }}>
                — {pageSection}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="hidden sm:flex items-center rounded-xl overflow-hidden"
            style={{ border: '1.5px solid rgba(10,15,28,0.1)', background: '#F7F4EE' }}>
            {LOCALES.map((l) => {
              const isActive = l.code === locale;
              return (
                <Link key={l.code} href={getLocalePath(l.code)}
                  className="px-2.5 py-1 text-xs font-bold transition-all"
                  style={{ background: isActive ? '#0A0F1C' : 'transparent', color: isActive ? '#ffffff' : 'rgba(10,15,28,0.4)' }}>
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Notifications */}
          <div className="relative" data-notif-dropdown>
            <button onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 rounded-xl flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)]"
              style={{ color: '#8A9BB0' }}>
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#B8976C', color: '#fff' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
                  style={{ background: '#F7F4EE', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(10,15,28,0.08)' }}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{tb('notifications')}</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: '#0A0F1C' }}>
                        {tb('markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <BellOff size={28} style={{ color: '#e2e8f0' }} />
                        <p className="text-xs font-medium mt-2" style={{ color: '#8A9BB0' }}>{tb('noNotifications')}</p>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const Icon = NOTIF_ICONS[n.type] ?? Settings;
                        const colors = NOTIF_COLORS[n.type] ?? { bg: '#EDE9E1', color: '#8A9BB0' };
                        return (
                          <button key={n.id} onClick={() => markRead(n.id)}
                            className="flex gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-[rgba(10,15,28,0.04)]"
                            style={{ borderBottom: '1px solid rgba(10,15,28,0.04)', background: n.read ? '#F7F4EE' : '#EDE9E1' }}>
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                              style={{ background: colors.bg, color: colors.color }}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight" style={{ color: '#5A6B80' }}>{n.title}</p>
                              {n.body && <p className="text-xs mt-0.5 leading-snug" style={{ color: '#8A9BB0' }}>{n.body}</p>}
                              <p className="text-[10px] mt-1" style={{ color: '#cbd5e1' }}>
                                {new Date(n.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#B8976C' }} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" data-profile-dropdown>
            <button onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-[rgba(10,15,28,0.07)]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#0A0F1C', color: '#fff' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={13} style={{ color: '#8A9BB0' }} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div className="absolute right-0 top-full mt-2 w-64 rounded-2xl py-2 z-50"
                  style={{ background: '#F7F4EE', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(10,15,28,0.08)' }}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
                    <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{userName}</p>
                    <p className="text-xs truncate" style={{ color: '#8A9BB0' }}>{userEmail}</p>
                  </div>
                  <button onClick={() => { setChangingPw(true); setProfileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(10,15,28,0.04)]"
                    style={{ color: '#5A6B80' }}>
                    <KeyRound size={14} /> {tb('changePassword')}
                  </button>
                  <div className="my-1 border-t" style={{ borderColor: 'rgba(10,15,28,0.06)' }} />
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                    style={{ color: '#dc2626' }}>
                    <LogOut size={14} /> {t('common.logout')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Change password modal ── */}
      <AnimatePresence>
        {changingPw && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setChangingPw(false); }}>
            <motion.div className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: '#F7F4EE', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}>
              {pwSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: '#16a34a' }} />
                  <p className="font-bold" style={{ color: '#0A0F1C' }}>{tb('pwChanged')}</p>
                  <button onClick={() => { setChangingPw(false); setPwSuccess(false); setPwForm({ next: '', confirm: '' }); }}
                    className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#0A0F1C', color: '#fff' }}>
                    OK
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-bold mb-4" style={{ color: '#0A0F1C' }}>{tb('changePassword')}</h2>
                  <form onSubmit={handleChangePw} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: '#8A9BB0' }}>{tb('newPassword')}</label>
                      <input type="password" required minLength={8} value={pwForm.next}
                        onChange={(e) => setPwForm(p => ({ ...p, next: e.target.value }))}
                        className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle}
                        onFocus={(e) => { e.target.style.borderColor = '#B8976C'; e.target.style.boxShadow = '0 0 0 3px rgba(184,151,108,0.12)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(10,15,28,0.12)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: '#8A9BB0' }}>{tb('confirmPassword')}</label>
                      <input type="password" required minLength={8} value={pwForm.confirm}
                        onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle}
                        onFocus={(e) => { e.target.style.borderColor = '#B8976C'; e.target.style.boxShadow = '0 0 0 3px rgba(184,151,108,0.12)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(10,15,28,0.12)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    {pwError && (
                      <div className="px-4 py-3 rounded-xl text-xs font-medium"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        {pwError}
                      </div>
                    )}
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={() => { setChangingPw(false); setPwError(''); setPwForm({ next: '', confirm: '' }); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#EDE9E1', color: '#8A9BB0' }}>
                        {t('settings.cancel')}
                      </button>
                      <button type="submit" disabled={pwSaving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                        style={{ background: '#0A0F1C', color: '#ffffff' }}>
                        {pwSaving && <Loader2 size={13} className="animate-spin" />}
                        {t('settings.save')}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
