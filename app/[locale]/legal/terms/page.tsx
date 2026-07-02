'use client';

import { motion } from 'framer-motion';
import { Scale, ArrowLeft, CreditCard, ShieldAlert, Award, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TermsAndConditionsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  return (
    <div
      className="min-h-screen flex flex-col relative py-16 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #141C2E 100%)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none filter blur-[150px]"
        style={{ background: 'radial-gradient(circle, rgba(184,151,108,0.06) 0%, transparent 70%)' }}
      />

      <div className="max-w-3xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href={`/${locale}/portal/login`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={12} />
            Volver al Portal
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white tracking-tight">Azu</span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400">DIGITAL STUDIO</span>
          </div>
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-10 border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(184, 151, 108, 0.15)', color: '#B8976C' }}
            >
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Términos y Condiciones</h1>
              <p className="text-xs text-slate-400 mt-1">Última actualización: Julio 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed flex flex-col gap-6">
            <p>
              Bienvenido al portal de clientes de **Azu Digital Studio**. Al acceder o utilizar nuestro sitio web y los servicios integrados en él, aceptas cumplir y estar sujeto a los siguientes Términos y Condiciones. Si no estás de acuerdo con alguna parte, por favor abstente de utilizar el portal.
            </p>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <CreditCard size={16} className="text-[#B8976C]" /> 1. Suscripción y Pagos
              </h2>
              <p>
                Azu Digital Studio ofrece sus servicios bajo modelos de suscripción periódica o tarifas acordadas:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>Los pagos se procesan de forma recurrente y segura a través de **Stripe** conforme al plan seleccionado.</li>
                <li>Es responsabilidad del cliente mantener un método de pago válido. La falta de pago resultará en la suspensión del acceso al portal y la pausa de los entregables y publicaciones.</li>
                <li>Puedes cancelar tu suscripción en cualquier momento desde tu panel de facturación. La cancelación evitará el cobro del próximo período, pero no da derecho a reembolsos por períodos ya facturados o transcurridos.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <Award size={16} className="text-[#B8976C]" /> 2. Propiedad Intelectual de Entregables
              </h2>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li><strong>Derechos del Cliente:</strong> Una vez completado y liquidado el pago correspondiente al servicio, la propiedad intelectual y los derechos de uso de los videos editados, creatividades de diseño y copys creados por Azu Digital Studio se transfieren en su totalidad al cliente.</li>
                <li><strong>Portafolio:</strong> Salvo acuerdo expreso de confidencialidad por escrito, Azu Digital Studio se reserva el derecho de exhibir el material realizado (videos, publicaciones y diseños) en sus portafolios, sitio web y redes sociales con fines promocionales.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <ShieldAlert size={16} className="text-[#B8976C]" /> 3. Uso Aceptable del Portal
              </h2>
              <p>
                Al utilizar el portal te comprometes a:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>No subir archivos maliciosos, virus, o cualquier tipo de software dañino a través de la integración de archivos de Google Drive.</li>
                <li>No compartir tus credenciales de inicio de sesión con terceros. Eres responsable de toda actividad que ocurra bajo tu usuario.</li>
                <li>No subir material multimedia que infrinja derechos de autor de terceros o que contenga material ilegal, ofensivo o abusivo.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <HelpCircle size={16} className="text-[#B8976C]" /> 4. Limitación de Responsabilidad
              </h2>
              <p>
                Azu Digital Studio se compromete a realizar sus entregas y programaciones con la máxima calidad y diligencia profesional. Sin embargo, no nos hacemos responsables de:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>Interrupciones o caídas temporales del servicio del portal debido a fallos de hosting o base de datos de terceros (Supabase, Vercel, Google Drive).</li>
                <li>Penalizaciones, bloqueos, o cambios de algoritmos realizados directamente por plataformas externas de redes sociales (Instagram, TikTok, YouTube).</li>
              </ul>
            </div>

            <p className="text-xs text-slate-400 mt-6 border-t border-slate-800 pt-6">
              Para consultas legales relacionadas con estos términos, contáctanos en **staff@azudigitalstudio.com**.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
