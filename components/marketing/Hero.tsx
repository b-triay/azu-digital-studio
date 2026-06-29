'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Hero() {
  const t = useTranslations('hero');
  const { scrollY } = useScroll();
  const contentParallaxY = useTransform(scrollY, [0, 600], [0, 40]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0F1C' }}
    >
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.035,
        }}
      />

      {/* Very subtle radial glow — not a blob, just depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(184,151,108,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center"
        style={{ y: contentParallaxY }}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span
            className="text-xs tracking-[0.35em] uppercase font-medium"
            style={{ color: '#8A9BB0' }}
          >
            Digital Marketing Studio
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="mt-7 font-light leading-[0.92] tracking-tight text-white"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(4rem, 10vw, 9rem)',
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('headline')}
          <br />
          <span className="italic" style={{ color: '#B8976C' }}>
            {t('headlineAccent')}
          </span>
        </motion.h1>

        {/* Brass rule */}
        <motion.div
          className="mx-auto mt-8 h-px"
          style={{ background: '#B8976C', originX: 0.5 }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-20 mx-auto" />
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="mt-8 max-w-lg mx-auto text-lg font-normal leading-relaxed"
          style={{ color: '#8A9BB0' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('subheadline')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.78, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={() => scrollTo('contact')}
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:gap-3.5 cursor-pointer"
            style={{
              background: '#F7F4EE',
              color: '#0A0F1C',
            }}
          >
            {t('ctaPrimary')}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => scrollTo('portfolio')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: '#F7F4EE',
              border: '1px solid rgba(247,244,238,0.25)',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#B8976C';
              (e.currentTarget as HTMLButtonElement).style.color = '#B8976C';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(247,244,238,0.25)';
              (e.currentTarget as HTMLButtonElement).style.color = '#F7F4EE';
            }}
          >
            {t('ctaSecondary')}
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator — thin vertical line */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <motion.div
          className="w-px h-14"
          style={{ background: 'linear-gradient(to bottom, transparent, #B8976C)' }}
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
