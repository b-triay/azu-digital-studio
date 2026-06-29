'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/Logo';

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/azudigitalstudio?igsh=NTF6bzBhaXFlY3Vn',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
];

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

export function Footer() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const navLinks = [
    { href: `/${locale}#services`, label: t('nav.services') },
    { href: `/${locale}#portfolio`, label: t('nav.portfolio') },
    { href: `/${locale}#about`, label: t('nav.about') },
    { href: `/${locale}/portal/login`, label: t('nav.clientPortal') },
  ];

  return (
    <footer
      className="py-12 px-6 lg:px-8"
      style={{ background: '#0A0F1C', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <Logo variant="light" />

          {/* Nav links */}
          <div className="flex flex-wrap gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-[#B8976C]"
                style={{ color: 'rgba(215,224,231,0.5)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(184,151,108,0.1)',
                  color: '#8A9BB0',
                }}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(215,224,231,0.4)' }}>
            {t('footer.rights')}
          </p>

          {/* Language switcher */}
          <div className="flex items-center gap-1">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={`/${l.code}`}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  color: l.code === locale ? '#ffffff' : 'rgba(215,224,231,0.4)',
                  background: l.code === locale ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
