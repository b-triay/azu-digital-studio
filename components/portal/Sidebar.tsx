'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, CheckSquare, FolderOpen, MessageSquare, CreditCard, LogOut, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const t = useTranslations('portal');
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();
  const router = useRouter();
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [messagesCount, setMessagesCount]   = useState(0);
  const [clientName, setClientName]         = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      if (!clientRow) return;
      const cid = clientRow.id;
      if (clientRow.name) setClientName(clientRow.name);
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', cid)
        .eq('status', 'pending_approval')
        .then(({ count }) => { if (count !== null) setApprovalsCount(count); });
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', cid)
        .eq('read_by_client', false)
        .then(({ count }) => { if (count !== null) setMessagesCount(count); });
    });
  }, [pathname]);

  const NAV_ITEMS = [
    { key: 'overview',   label: t('nav.overview'),  icon: LayoutDashboard, href: 'dashboard' },
    { key: 'calendar',   label: t('nav.calendar'),  icon: CalendarDays,    href: 'dashboard/calendar' },
    { key: 'approvals',  label: t('nav.approvals'), icon: CheckSquare,     href: 'dashboard/approvals', badge: approvalsCount },
    { key: 'files',      label: t('nav.files'),     icon: FolderOpen,      href: 'dashboard/files' },
    { key: 'messages',   label: t('nav.messages'),  icon: MessageSquare,   href: 'dashboard/messages', badge: messagesCount },
    { key: 'billing',    label: 'Facturación',       icon: CreditCard,      href: 'dashboard/billing' },
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

      {/* Client badge */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-semibold" style={{ color: 'rgba(215,224,231,0.5)' }}>
            {t('common.clientPortal')}
          </p>
          <p className="text-sm font-bold text-white mt-0.5">{clientName || t('common.myBrand')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}/portal/${item.href}`;
          const isActive = pathname === href || (item.href === 'dashboard' && pathname === `/${locale}/portal/dashboard`);

          return (
            <Link
              key={item.key}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
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
