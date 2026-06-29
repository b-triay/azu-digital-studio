'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, LayoutGrid, Film, Play, Mail, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';

const SERVICE_ICONS = [LayoutGrid, Film, Play, Mail, Globe];
const SERVICE_KEYS = ['social', 'reels', 'youtube', 'email', 'web'] as const;

const SERVICE_EXAMPLES: Record<string, string[]> = {
  social:   ['GloveTZ', 'Jeanette Balkanji', 'Claudia Karon'],
  reels:    ['Maika Prevosti', "Ana's Crochet", 'Astromama'],
  youtube:  ['Omar Jimenez-Cano', 'TBM 3D'],
  email:    ['Claudia Karon', 'Jeanette Balkanji'],
  web:      ['TBM 3D', 'Azu Digital Studio'],
};

export function Services() {
  const t = useTranslations('services');
  const params = useParams();
  const locale = params.locale as string;
  const learnMore = t('learnMore');

  return (
    <section id="services" className="py-24 lg:py-32" style={{ background: '#F7F4EE' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="max-w-2xl mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: '#B8976C' }} />
            <span
              className="text-xs tracking-widest uppercase font-medium"
              style={{ color: '#B8976C' }}
            >
              {t('title')}
            </span>
          </div>
          <h2
            className="text-4xl lg:text-5xl font-light tracking-tight leading-tight"
            style={{ color: '#0A0F1C', fontFamily: 'var(--font-display)' }}
          >
            {t('subtitle')}
          </h2>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICE_KEYS.map((key, index) => {
            const Icon = SERVICE_ICONS[index];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={index === SERVICE_KEYS.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''}
              >
                <ServiceCard
                  icon={<Icon size={18} style={{ color: '#B8976C' }} />}
                  name={t(`items.${key}.name`)}
                  description={t(`items.${key}.description`)}
                  price={t(`items.${key}.price`)}
                  examples={SERVICE_EXAMPLES[key]}
                  learnMore={learnMore}
                  href={`/${locale}#contact`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  examples: string[];
  learnMore: string;
  href: string;
}

function ServiceCard({ icon, name, description, price, examples, learnMore, href }: ServiceCardProps) {
  return (
    <motion.div
      className="group relative p-6 rounded-xl border cursor-default h-full flex flex-col"
      style={{
        background: '#ffffff',
        borderColor: 'rgba(10,15,28,0.07)',
        boxShadow: '0 1px 3px rgba(10,15,28,0.04)',
      }}
      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(184,151,108,0.14)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
        style={{ background: 'rgba(184,151,108,0.1)' }}
      >
        {icon}
      </div>

      {/* Content */}
      <h3
        className="text-base font-semibold mb-2 leading-snug"
        style={{ color: '#0A0F1C' }}
      >
        {name}
      </h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#5A6B80' }}>
        {description}
      </p>

      {/* Examples */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {examples.map(ex => (
          <span
            key={ex}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(10,15,28,0.05)', color: '#5A6B80' }}
          >
            {ex}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: 'rgba(184,151,108,0.1)', color: '#8B6F40' }}
        >
          {price}
        </span>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2"
          style={{ color: '#B8976C' }}
        >
          {learnMore}
          <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}
