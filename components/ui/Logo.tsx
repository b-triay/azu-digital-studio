'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const params = useParams();
  const locale = params.locale as string;

  const textPrimary   = variant === 'light' ? '#F7F4EE'              : '#0A0F1C';
  const textSecondary = variant === 'light' ? 'rgba(247,244,238,0.5)' : '#8A9BB0';

  return (
    <Link href={`/${locale}`} className={`inline-flex items-center gap-2.5 group ${className}`}>
      {/* Monograma */}
      <div
        className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          background: 'rgba(184,151,108,0.15)',
          border: '1px solid rgba(184,151,108,0.35)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontStyle: 'italic',
            fontWeight: 600,
            color: '#B8976C',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          A
        </span>
      </div>

      {/* Wordmark */}
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '19px',
            fontStyle: 'italic',
            fontWeight: 600,
            color: textPrimary,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          AZU
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: textSecondary,
            letterSpacing: '0.12em',
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
