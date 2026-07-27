'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'es';

  const textPrimary = variant === 'light' ? '#FFFFFF' : '#0A0F1C';
  const textSecondary = variant === 'light' ? '#7AB2F3' : '#004CFF';

  return (
    <Link href={`/${locale}`} className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Icono del Logo AZU */}
      <div
        className="w-9 h-9 flex items-center justify-center rounded-xl p-1.5 transition-transform duration-300 group-hover:scale-105 shadow-sm"
        style={{
          background: variant === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 76, 255, 0.08)',
          border: variant === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 76, 255, 0.2)',
        }}
      >
        <Image
          src="/AZU.png"
          alt="AZU Digital Studio Logo"
          width={36}
          height={36}
          className="object-contain w-full h-full filter drop-shadow-sm"
          priority
        />
      </div>

      {/* Wordmark */}
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '20px',
            fontWeight: 800,
            color: textPrimary,
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          AZU
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: textSecondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Digital Studio
        </span>
      </div>
    </Link>
  );
}
