'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  useEffect(() => {
    // Check if user already accepted cookie policy
    const consent = localStorage.getItem('azu-cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('azu-cookie-consent', 'accepted');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999] rounded-2xl p-5 border shadow-2xl"
          style={{
            background: 'rgba(10, 15, 28, 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(184, 151, 108, 0.2)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(184, 151, 108, 0.15)', color: '#B8976C' }}
            >
              <ShieldCheck size={20} />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-bold text-white">Política de Cookies & Privacidad</h4>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Utilizamos cookies técnicas obligatorias para iniciar sesión y cookies analíticas de rendimiento para entender cómo se usa el portal. Al continuar navegando, aceptas su uso.
              </p>

              <div className="mt-4 flex items-center gap-3.5">
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all hover:opacity-90 cursor-pointer"
                  style={{ background: '#B8976C', color: '#0A0F1C' }}
                >
                  Aceptar todo
                </button>
                <Link
                  href={`/${locale}/legal/privacy`}
                  onClick={() => setVisible(false)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white underline transition-colors"
                >
                  Leer más
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
