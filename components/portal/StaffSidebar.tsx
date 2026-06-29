'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CheckSquare, FolderOpen, LogOut, X, Zap, DollarSign, UserCog, CalendarDays, FileText, Package, MessageSquare, Kanban } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

interface StaffSidebarProps {
  onClose?: () => void;
}

export function StaffSidebar({ onClose }: StaffSidebarProps) {
  const t = useTranslations('portal');
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount]   = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval')
      .then(({ count }) => { if (count !== null) setPendingCount(count); });
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('read_by_staff', false)
      .then(({ count }) => { if (count !== null) setMessagesCount(count); });
  }, [pathname]);

  const NAV_ITEMS = [
    { key: 'dashboard',  label: t('nav.dashboard'),    icon: LayoutDashboard, href: 'staff/dashboard' },
    { key: 'clients',    label: t('nav.clients'),      icon: Users,           href: 'staff/clients' },
    { key: 'calendar',  label: t('nav.calendar'),     icon: CalendarDays,    href: 'staff/calendar' },
    { key: 'posts',      label: t('nav.posts'),        icon: FileText,        href: 'staff/posts' },
    { key: 'approvals',  label: t('nav.allApprovals'), icon: CheckSquare,     href: 'staff/approvals', badge: pendingCount },
    { key: 'files',      label: t('nav.files'),        icon: FolderOpen,      href: 'staff/files' },
    { key: 'tickets',    label: 'Tickets',              icon: Kanban,          href: 'staff/tickets' },
    { key: 'plans',      label: 'Planes',               icon: Package,         href: 'staff/plans' },
    { key: 'messages',   label: 'Mensajes',             icon: MessageSquare,   href: 'staff/messages', badge: messagesCount },
    { key: 'payroll',    label: t('nav.payroll'),      icon: DollarSign,      href: 'staff/payroll' },
    { key: 'settings',   label: t('nav.users'),        icon: UserCog,         href: 'staff/settings' },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/portal/login`);
  };

  return (
    <aside
      className="w-60 h-full flex flex-col"
      style={{ background: '#0A0F1C', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo variant="light" className="scale-90 origin-left" />
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'rgba(215,224,231,0.5)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Staff badge */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: 'rgba(184,151,108,0.12)', border: '1px solid rgba(184,151,108,0.2)' }}
        >
          <Zap size={13} style={{ color: '#B8976C', flexShrink: 0 }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'rgba(184,151,108,0.7)' }}>{t('common.staffPanel')}</p>
            <p className="text-sm font-bold text-white mt-0.5 leading-none">{t('common.azuTeam')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}/portal/${item.href}`;
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={item.key}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? 'rgba(184,151,108,0.15)' : 'transparent',
                color: isActive ? '#B8976C' : 'rgba(215,224,231,0.6)',
              }}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{ background: '#B8976C', color: '#ffffff' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: 'rgba(215,224,231,0.5)' }}
        >
          <LogOut size={16} />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
