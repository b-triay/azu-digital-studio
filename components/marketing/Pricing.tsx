'use client';

import { useTranslations } from 'next-intl';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';

export function Pricing() {
  const t = useTranslations('pricing');

  const basePlan = {
    name: t('base.name'),
    price: t('base.price'),
    period: t('base.period'),
    features: [
      t('base.features.0'),
      t('base.features.1'),
      t('base.features.2'),
      t('base.features.3'),
      t('base.features.4'),
    ],
  };

  const strategicPlan = {
    name: t('strategic.name'),
    price: t('strategic.price'),
    period: t('strategic.period'),
    badge: t('strategic.badge'),
    features: [
      t('strategic.features.0'),
      t('strategic.features.1'),
      t('strategic.features.2'),
      t('strategic.features.3'),
      t('strategic.features.4'),
    ],
  };

  return (
    <section id="pricing" className="py-24 lg:py-32" style={{ background: '#EDE9E1' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: '#B8976C' }} />
            <span className="text-xs tracking-widest uppercase font-medium" style={{ color: '#B8976C' }}>
              {t('plansLabel')}
            </span>
            <div className="h-px w-10" style={{ background: '#B8976C' }} />
          </div>
          <h2
            className="text-4xl lg:text-5xl font-light tracking-tight"
            style={{ color: '#0A0F1C', fontFamily: 'var(--font-display)' }}
          >
            {t('title')}
          </h2>
          <p className="mt-4 text-lg font-normal" style={{ color: '#5A6B80' }}>
            {t('subtitle')}
          </p>
        </FadeIn>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto" id="pricing-cards">
          {/* Base Plan */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <PricingCard
              name={basePlan.name}
              price={basePlan.price}
              period={basePlan.period}
              features={basePlan.features}
              cta={t('cta')}
              featured={false}
            />
          </motion.div>

          {/* Strategic Plan */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <PricingCard
              name={strategicPlan.name}
              price={strategicPlan.price}
              period={strategicPlan.period}
              badge={strategicPlan.badge}
              features={strategicPlan.features}
              cta={t('cta')}
              featured={true}
            />
          </motion.div>
        </div>

        {/* Custom plan */}
        <motion.div
          className="mt-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="rounded-xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{
              background: 'rgba(10,15,28,0.05)',
              border: '1px solid rgba(10,15,28,0.1)',
            }}
          >
            <div className="text-center sm:text-left">
              <p className="text-base font-semibold" style={{ color: '#0A0F1C' }}>{t('custom.title')}</p>
              <p className="text-sm mt-1 font-normal" style={{ color: '#5A6B80' }}>{t('custom.desc')}</p>
            </div>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              style={{
                background: '#0A0F1C',
                color: '#F7F4EE',
              }}
            >
              {t('custom.cta')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  cta: string;
  featured: boolean;
}

function PricingCard({ name, price, period, badge, features, cta, featured }: PricingCardProps) {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <motion.div
      className="relative rounded-xl p-8 flex flex-col h-full"
      style={{
        background: featured ? '#0A0F1C' : '#ffffff',
        boxShadow: featured
          ? '0 24px 60px rgba(10,15,28,0.4)'
          : '0 2px 12px rgba(10,15,28,0.06)',
        border: featured ? '1px solid rgba(184,151,108,0.2)' : '1px solid rgba(10,15,28,0.08)',
      }}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ background: '#B8976C', color: '#ffffff' }}
          >
            <Zap size={10} fill="currentColor" />
            {badge}
          </span>
        </div>
      )}

      {/* Plan name */}
      <p
        className="text-sm font-medium mb-2"
        style={{ color: featured ? '#8A9BB0' : '#5A6B80' }}
      >
        {name}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-8">
        <span
          className="text-5xl font-light tracking-tight"
          style={{
            color: featured ? '#ffffff' : '#0A0F1C',
            fontFamily: 'var(--font-display)',
          }}
        >
          {price}
        </span>
        <span
          className="text-base font-normal"
          style={{ color: featured ? '#8A9BB0' : '#5A6B80' }}
        >
          {period}
        </span>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(184,151,108,0.15)',
                color: '#B8976C',
              }}
            >
              <Check size={11} strokeWidth={3} />
            </span>
            <span
              className="text-sm leading-relaxed"
              style={{ color: featured ? '#8A9BB0' : '#5A6B80' }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={scrollToContact}
        className="block w-full text-center py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        style={{
          background: featured ? '#B8976C' : '#0A0F1C',
          color: '#ffffff',
        }}
      >
        {cta}
      </button>
    </motion.div>
  );
}
