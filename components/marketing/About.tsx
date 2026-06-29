'use client';

import { useTranslations } from 'next-intl';
import { Zap, BookOpen, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';

const TEAM_MEMBERS = [
  { initials: 'AD', name: 'Ana D.',           role: 'sm1' },
  { initials: 'OA', name: 'Oriana A.',        role: 'sm2' },
  { initials: 'JM', name: 'Jesus Miguel A.',  role: 'sm3' },
  { initials: 'BT', name: 'Bruno T.',         role: 'dev' },
  { initials: 'AC', name: 'Andres C.',        role: 'translator' },
];

export function About() {
  const t = useTranslations('about');

  return (
    <section
      id="about"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ background: '#0A0F1C' }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <FadeIn x={-30} y={0}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: '#B8976C' }} />
              <span
                className="text-xs tracking-widest uppercase font-medium"
                style={{ color: '#B8976C' }}
              >
                {t('team.title')}
              </span>
            </div>

            <h2
              className="text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('title')}
            </h2>
            <p
              className="text-lg font-normal leading-relaxed mb-10"
              style={{ color: '#8A9BB0' }}
            >
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              {[
                { value: t('stats.years'),       label: t('stats.yearsLabel') },
                { value: t('stats.specialists'), label: t('stats.specialistsLabel') },
                { value: t('stats.clients'),     label: t('stats.clientsLabel') },
              ].map(stat => (
                <div key={stat.label}>
                  <div
                    className="text-3xl font-light text-white mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: '#5A6B80' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Differentiators */}
            <div className="flex flex-col gap-4">
              {[
                { icon: <Zap size={15} />,      text: t('differentiators.ai') },
                { icon: <BookOpen size={15} />, text: t('differentiators.notion') },
                { icon: <Globe size={15} />,    text: t('differentiators.multilingual') },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(184,151,108,0.12)', color: '#B8976C' }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-normal" style={{ color: '#8A9BB0' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Right: team cards */}
          <FadeIn x={30} y={0} delay={0.15} className="grid grid-cols-2 gap-3">
            {TEAM_MEMBERS.map((member, index) => (
              <motion.div
                key={member.role}
                className={`p-5 rounded-xl ${index === TEAM_MEMBERS.length - 1 ? 'col-span-2' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                whileHover={{ background: 'rgba(184,151,108,0.06)', borderColor: 'rgba(184,151,108,0.2)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{
                      background: 'rgba(184,151,108,0.12)',
                      color: '#B8976C',
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight mb-0.5">
                      {member.name}
                    </p>
                    <p className="text-xs font-normal" style={{ color: '#5A6B80' }}>
                      {t(`team.roles.${member.role}`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
