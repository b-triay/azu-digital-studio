'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';

type FilterKey = 'all' | 'social' | 'video' | 'email' | 'web';

interface PortfolioItem {
  client: string;
  type: FilterKey;
  image: string;
  initials: string;
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  { client: 'GloveTZ',          type: 'web',    image: '/portfolio/glovetz.png',     initials: 'GT' },
  { client: 'Jeanette Balkanli', type: 'social', image: '/portfolio/jeanette.png',    initials: 'JB' },
  { client: 'Claudia Karon',     type: 'social', image: '/portfolio/claudia.png',     initials: 'CK' },
  { client: 'Maika Prevosti',    type: 'video',  image: '/portfolio/maika.png',       initials: 'MP' },
  { client: 'TBM 3D',            type: 'web',    image: '/portfolio/tbm3d.png',       initials: 'TB' },
  { client: 'Obed Abbo',         type: 'social', image: '/portfolio/obedabbo.png',    initials: 'OA' },
  { client: "Ana's Crochet",     type: 'social', image: '/portfolio/anascrochet.png', initials: 'AC' },
  { client: 'Astromama',         type: 'email',  image: '/portfolio/astromama.png',   initials: 'AS' },
];

const TYPE_LABELS: Record<string, string> = {
  social: 'Social Media',
  video:  'Video',
  email:  'Email',
  web:    'Web Dev',
};

export function Portfolio() {
  const t = useTranslations('portfolio');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all',    label: t('filters.all') },
    { key: 'social', label: t('filters.social') },
    { key: 'video',  label: t('filters.video') },
    { key: 'email',  label: t('filters.email') },
    { key: 'web',    label: t('filters.web') },
  ];

  const filtered = activeFilter === 'all'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter(item => item.type === activeFilter);

  return (
    <section id="portfolio" className="py-24 lg:py-32" style={{ background: '#F7F4EE' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
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
              className="text-4xl lg:text-5xl font-light tracking-tight"
              style={{ color: '#0A0F1C', fontFamily: 'var(--font-display)' }}
            >
              {t('subtitle')}
            </h2>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: activeFilter === filter.key ? '#0A0F1C' : 'rgba(10,15,28,0.06)',
                  color: activeFilter === filter.key ? '#F7F4EE' : '#5A6B80',
                  border: 'none',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((item, index) => (
              <motion.div
                key={item.client}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <PortfolioCard item={item} viewLabel={t('viewProject')} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </section>
  );
}

interface PortfolioCardProps {
  item: PortfolioItem;
  viewLabel: string;
}

function PortfolioCard({ item, viewLabel }: PortfolioCardProps) {
  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: '4/3' }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {/* Real client image */}
      <Image
        src={item.image}
        alt={item.client}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Type badge (always visible) */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-md"
          style={{
            background: 'rgba(10,15,28,0.65)',
            color: '#F7F4EE',
            backdropFilter: 'blur(6px)',
          }}
        >
          {TYPE_LABELS[item.type]}
        </span>
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-5 transition-all duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: 'linear-gradient(to top, rgba(10,15,28,0.92) 0%, rgba(10,15,28,0.3) 60%, transparent 100%)' }}
      >
        <p
          className="text-xs font-semibold tracking-wider uppercase mb-1"
          style={{ color: '#B8976C' }}
        >
          {TYPE_LABELS[item.type]}
        </p>
        <h3 className="text-base font-semibold text-white mb-3">{item.client}</h3>
        <button
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'rgba(247,244,238,0.75)' }}
        >
          {viewLabel} <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
