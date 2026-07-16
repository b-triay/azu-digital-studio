'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/ui/FadeIn';

export function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [
    { q: t('items.q1'), a: t('items.a1') },
    { q: t('items.q2'), a: t('items.a2') },
    { q: t('items.q3'), a: t('items.a3') },
    { q: t('items.q4'), a: t('items.a4') },
    { q: t('items.q5'), a: t('items.a5') },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 lg:py-32" style={{ background: '#F7F4EE' }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: '#B8976C' }} />
            <span
              className="text-xs tracking-widest uppercase font-medium"
              style={{ color: '#B8976C' }}
            >
              FAQ
            </span>
            <div className="h-px w-10" style={{ background: '#B8976C' }} />
          </div>
          <h2
            className="text-4xl lg:text-5xl font-light tracking-tight"
            style={{ color: '#0A0F1C', fontFamily: 'var(--font-display)' }}
          >
            {t('title')}
          </h2>
          <p className="mt-4 text-base font-normal leading-relaxed" style={{ color: '#5A6B80' }}>
            {t('subtitle')}
          </p>
        </FadeIn>

        {/* Accordion list */}
        <div className="flex flex-col gap-3 max-w-3xl mx-auto">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(10,15,28,0.06)',
                  boxShadow: isOpen ? '0 10px 30px rgba(10,15,28,0.04)' : '0 2px 8px rgba(10,15,28,0.02)',
                }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left transition-colors duration-150 hover:bg-slate-50/50 cursor-pointer"
                >
                  <div className="flex gap-3 items-start min-w-0">
                    <HelpCircle
                      size={18}
                      className="flex-shrink-0 mt-0.5 transition-colors"
                      style={{ color: isOpen ? '#B8976C' : '#8A9BB0' }}
                    />
                    <span className="text-sm sm:text-base font-bold" style={{ color: '#0A0F1C' }}>
                      {item.q}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={18} style={{ color: isOpen ? '#0A0F1C' : '#5A6B80' }} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                    >
                      <div
                        className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed"
                        style={{ color: '#5A6B80', borderTop: '1px solid rgba(10,15,28,0.04)' }}
                      >
                        <p className="pl-0 sm:pl-7 pt-3">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
