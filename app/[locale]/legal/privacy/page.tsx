'use client';

import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Mail, FileText, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PrivacyPolicyPage() {
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
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Política de Privacidad</h1>
              <p className="text-xs text-slate-400 mt-1">Última actualización: Julio 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed flex flex-col gap-6">
            <p>
              En **Azu Digital Studio** nos tomamos muy en serio la seguridad y confidencialidad de tus datos personales. Esta Política de Privacidad detalla la información que recopilamos a través de nuestro portal de clientes y de qué manera la utilizamos, protegemos y compartimos.
            </p>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <FileText size={16} className="text-[#B8976C]" /> 1. Datos que recopilamos
              </h2>
              <p>
                Al utilizar nuestro portal de clientes, recopilamos ciertos datos necesarios para proveer nuestros servicios de gestión de redes, edición de video y desarrollo web:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li><strong>Información de Registro:</strong> Nombre, correo electrónico, y contraseña de acceso (encriptada de forma segura mediante Supabase Auth).</li>
                <li><strong>Material Multimedia:</strong> Videos, imágenes y assets creativos que subes para su revisión o programación en redes sociales. Estos archivos se almacenan de forma segura en Google Drive a través de nuestra cuenta de servicio restringida.</li>
                <li><strong>Datos de Facturación:</strong> Procesados de forma segura a través de plataformas externas de pago (como Takenos, Mercado Pago o transferencias bancarias). Nosotros no almacenamos ni tenemos acceso a los datos de tu tarjeta de crédito o claves bancarias.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <Globe size={16} className="text-[#B8976C]" /> 2. Finalidad del tratamiento
              </h2>
              <p>
                Tratamos tus datos exclusivamente para los siguientes fines:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>Gestionar tu cuenta de cliente y brindarte acceso al portal de aprobaciones y calendario de publicaciones.</li>
                <li>Facilitar la subida, procesamiento y descarga de archivos de material multimedia asignados a tus publicaciones.</li>
                <li>Procesar los cobros de tus planes de forma segura utilizando los métodos de pago provistos.</li>
                <li>Enviarte alertas y notificaciones críticas del portal por correo electrónico (como solicitudes de cambios o confirmaciones de publicaciones aprobadas) mediante Resend.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <Lock size={16} className="text-[#B8976C]" /> 3. Seguridad de los datos
              </h2>
              <p>
                Implementamos medidas de seguridad técnicas para proteger tu información:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-400">
                <li>Toda la comunicación de datos viaja de forma cifrada mediante protocolos seguros HTTPS.</li>
                <li>La autenticación y base de datos son gestionadas por **Supabase**, utilizando políticas estrictas de seguridad a nivel de base de datos (RLS) para evitar accesos no autorizados.</li>
                <li>El material de trabajo se resguarda en directorios aislados de **Google Drive API** asociados únicamente a tu cuenta.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-4">
                <Mail size={16} className="text-[#B8976C]" /> 4. Tus Derechos (Derechos ARCO)
              </h2>
              <p>
                Tienes el derecho de acceder, rectificar, cancelar u oponerte al uso de tus datos personales en cualquier momento. Para ejercer estos derechos o solicitar la baja total de tu cuenta y la eliminación de tus archivos, puedes ponerte en contacto con nuestro equipo escribiendo a:
              </p>
              <p className="font-bold text-white text-center py-2 bg-white/5 rounded-xl border border-white/10 mt-2">
                staff@azudigitalstudio.com
              </p>
            </div>

            <p className="text-xs text-slate-400 mt-6 border-t border-slate-800 pt-6">
              Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento para adaptarla a novedades legislativas o jurisprudenciales. Cualquier cambio importante te será notificado a través del portal de clientes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
