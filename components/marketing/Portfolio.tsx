'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';
import { useParams } from 'next/navigation';

type FilterKey = 'all' | 'social' | 'video' | 'email' | 'web';

interface PortfolioItem {
  client: string;
  types: FilterKey[];
  image: string;
  initials: string;
  link?: string;
  desc: Record<string, string>;
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    client: 'GloveTZ',
    types: ['web', 'social'],
    image: '/portfolio/glovetz.jpg',
    initials: 'GT',
    link: 'https://glovetz.com',
    desc: {
      es: 'Rediseño completo de su plataforma de e-commerce y desarrollo a medida. Además, gestionamos sus campañas en Meta Ads y contenido estratégico en redes sociales.',
      en: 'Complete redesign of their e-commerce platform and custom development. We also manage their Meta Ads campaigns and strategic social media content.',
      pt: 'Redesenho completo de sua plataforma de e-commerce e desenvolvimento personalizado. Também gerenciamos suas campanhas de Meta Ads e conteúdo estratégico de mídia social.',
    }
  },
  {
    client: 'Jeanette Balkanli',
    types: ['social', 'video'],
    image: '/portfolio/jeanette.png',
    initials: 'JB',
    link: 'https://instagram.com',
    desc: {
      es: 'Dirección creativa de contenido y edición de videos de alto impacto (Reels/TikToks) para su marca personal de coaching.',
      en: 'Creative content direction and editing of high-impact videos (Reels/TikToks) for her personal coaching brand.',
      pt: 'Direção criativa de conteúdo e edição de vídeos de alto impacto (Reels/TikToks) para sua marca pessoal de coaching.',
    }
  },
  {
    client: 'Claudia Karon',
    types: ['social'],
    image: '/portfolio/claudia.png',
    initials: 'CK',
    link: 'https://instagram.com',
    desc: {
      es: 'Estrategia de crecimiento orgánico y branding digital en Instagram, enfocada en bienestar y estilo de vida.',
      en: 'Organic growth strategy and digital branding on Instagram, focused on wellness and lifestyle.',
      pt: 'Estratégia de crescimento orgânico e branding digital no Instagram, focada em bem-estar e estilo de vida.',
    }
  },
  {
    client: 'Maika Prevosti',
    types: ['video'],
    image: '/portfolio/maika.png',
    initials: 'MP',
    link: 'https://instagram.com',
    desc: {
      es: 'Edición de video cinematográfico y diseño de sonido para sus campañas y presentaciones de marca premium.',
      en: 'Cinematographic video editing and sound design for her premium brand campaigns and presentations.',
      pt: 'Edição de vídeo cinematográfico e sound design para suas campanhas e apresentações de marca premium.',
    }
  },
  {
    client: 'TBM 3D',
    types: ['web', 'social'],
    image: '/portfolio/tbm3d.png',
    initials: 'TB',
    link: 'https://tbm3d.com',
    desc: {
      es: 'Desarrollo de catálogo web interactivo 3D y posicionamiento orgánico en redes a través de reels demostrativos de impresión 3D.',
      en: 'Development of the interactive 3D web catalog and organic search positioning through demonstrative 3D printing reels.',
      pt: 'Desenvolvimento do catálogo web interativo 3D e posicionamento orgânico de busca através de reels demonstrativos de impressão 3D.',
    }
  },
  {
    client: 'Obed Abbo',
    types: ['social'],
    image: '/portfolio/obedabbo.png',
    initials: 'OA',
    link: 'https://instagram.com',
    desc: {
      es: 'Gestión integral de contenidos para redes sociales, copywriting y diseño gráfico orientado a liderazgo y negocios.',
      en: 'Comprehensive social media content management, copywriting, and graphic design oriented to leadership and business.',
      pt: 'Gerenciamento abrangente de conteúdo de mídia social, copywriting e design gráfico orientado para liderança e negócios.',
    }
  },
  {
    client: "Ana's Crochet",
    types: ['social', 'web'],
    image: '/portfolio/anascrochet.jpg',
    initials: 'AC',
    link: 'https://anascrochet.com',
    desc: {
      es: 'Desarrollo de tienda online para crochet y diseño de contenido visual de alta estética para Instagram y Pinterest.',
      en: 'Online crochet store development and highly aesthetic visual content design for Instagram and Pinterest.',
      pt: 'Desenvolvimento de loja online de crochê e design de conteúdo visual altamente estético para o Instagram e Pinterest.',
    }
  },
  {
    client: 'Astromama',
    types: ['email'],
    image: '/portfolio/astromama.jpg',
    initials: 'AS',
    link: 'https://astromama.com.ar',
    desc: {
      es: 'Diseño y automatización de campañas de email marketing (newsletters) con flujos segmentados de astrología y tarot.',
      en: 'Design and automation of email marketing campaigns (newsletters) with segmented astrology and tarot flows.',
      pt: 'Design e automação de campanhas de email marketing (newsletters) com fluxos segmentados de astrologia e tarot.',
    }
  },
];

const TYPE_LABELS: Record<string, string> = {
  social: 'Social Media',
  video:  'Video',
  email:  'Email',
  web:    'Web Dev',
};

export function Portfolio() {
  const t = useTranslations('portfolio');
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all',    label: t('filters.all') },
    { key: 'social', label: t('filters.social') },
    { key: 'video',  label: t('filters.video') },
    { key: 'email',  label: t('filters.email') },
    { key: 'web',    label: t('filters.web') },
  ];

  const filtered = activeFilter === 'all'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter(item => item.types.includes(activeFilter));

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
                <PortfolioCard
                  item={item}
                  viewLabel={t('viewProject')}
                  onSelect={() => setSelectedProject(item)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Lightbox Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Banner */}
              <div className="relative w-full h-64 sm:h-80 bg-slate-100">
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.client}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white backdrop-blur-md transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.types.map(type => (
                      <span
                        key={type}
                        className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md"
                        style={{ background: 'rgba(184,151,108,0.12)', color: '#B8976C' }}
                      >
                        {TYPE_LABELS[type]}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-extrabold" style={{ color: '#0A0F1C' }}>
                    {selectedProject.client}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: '#5A6B80' }}>
                  {selectedProject.desc[locale] || selectedProject.desc.es}
                </p>

                {selectedProject.link && (
                  <div className="flex pt-2">
                    <a
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: '#0A0F1C' }}
                    >
                      Ver Proyecto <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface PortfolioCardProps {
  item: PortfolioItem;
  viewLabel: string;
  onSelect: () => void;
}

function PortfolioCard({ item, viewLabel, onSelect }: PortfolioCardProps) {
  const displayLabel = item.types.map(type => TYPE_LABELS[type]).join(' · ');

  return (
    <motion.div
      onClick={onSelect}
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
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: 'rgba(10,15,28,0.65)',
            color: '#F7F4EE',
            backdropFilter: 'blur(6px)',
          }}
        >
          {displayLabel}
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
          {displayLabel}
        </p>
        <h3 className="text-base font-semibold text-white mb-3">{item.client}</h3>
        <button
          className="inline-flex items-center gap-1.5 text-sm font-medium text-left"
          style={{ color: 'rgba(247,244,238,0.75)' }}
        >
          {viewLabel} <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
