'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

export function Navbar() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const getLocalePath = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    return segments.join('/');
  };

  const navLinks = [
    { href: `/${locale}#services`, label: t('services') },
    { href: `/${locale}#portfolio`, label: t('portfolio') },
    { href: `/${locale}#about`, label: t('about') },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(247,244,238,0.94)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(10,15,28,0.08)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Logo variant={scrolled ? 'dark' : 'light'} />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors duration-150"
                style={{
                  color: scrolled ? '#0A0F1C' : 'rgba(247,244,238,0.85)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language pills */}
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{
                background: scrolled ? 'rgba(10,15,28,0.06)' : 'rgba(255,255,255,0.1)',
                border: scrolled ? '1px solid rgba(10,15,28,0.1)' : '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {LOCALES.map((l) => {
                const isActive = l.code === locale;
                return (
                  <Link
                    key={l.code}
                    href={getLocalePath(l.code)}
                    className="text-xs font-bold px-3 py-1.5 transition-all duration-150"
                    style={{
                      color: isActive
                        ? scrolled ? '#F7F4EE' : '#ffffff'
                        : scrolled ? 'rgba(10,15,28,0.45)' : 'rgba(255,255,255,0.5)',
                      background: isActive
                        ? scrolled ? '#0A0F1C' : 'rgba(184,151,108,0.35)'
                        : 'transparent',
                      borderRadius: '10px',
                    }}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>

            {/* Portal button */}
            <Link
              href={`/${locale}/portal/login`}
              className="text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-150 hover:border-[#B8976C] hover:text-[#B8976C]"
              style={{
                color: scrolled ? '#0A0F1C' : '#F7F4EE',
                borderColor: scrolled ? 'rgba(10,15,28,0.25)' : 'rgba(247,244,238,0.4)',
                background: 'transparent',
              }}
            >
              {t('clientPortal')}
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: scrolled ? '#0A0F1C' : '#F7F4EE' }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden py-4 border-t"
            style={{
              background: 'rgba(247,244,238,0.97)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(10,15,28,0.08)',
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 px-2 text-sm font-medium"
                style={{ color: '#0A0F1C' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 flex items-center gap-3 border-t" style={{ borderColor: 'rgba(10,15,28,0.08)' }}>
              {LOCALES.map((l) => (
                <Link
                  key={l.code}
                  href={getLocalePath(l.code)}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    color: l.code === locale ? '#F7F4EE' : '#0A0F1C',
                    background: l.code === locale ? '#0A0F1C' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={`/${locale}/portal/login`}
                className="ml-auto text-sm font-semibold px-4 py-2 rounded-lg border"
                style={{ color: '#0A0F1C', borderColor: 'rgba(10,15,28,0.3)' }}
                onClick={() => setMenuOpen(false)}
              >
                {t('clientPortal')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
