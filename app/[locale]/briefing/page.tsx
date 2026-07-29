'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Video,
  Eye,
  Mic,
  Palette,
  FileCheck,
  FileX,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PriorityItem {
  id: string;
  title: string;
  desc: string;
}

export default function BriefingPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  // Basic Contact Info
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // 1️⃣ Marca Personal y Diferenciación
  const [brandThreeWords, setBrandThreeWords] = useState('');
  const [differentiation, setDifferentiation] = useState('');
  const [avoidTopics, setAvoidTopics] = useState('');
  const [growthBlockers, setGrowthBlockers] = useState('');
  const [hasBrandManual, setHasBrandManual] = useState<'yes' | 'basic' | 'no' | ''>('');
  const [brandManualLink, setBrandManualLink] = useState('');

  // 2️⃣ Productos / Servicios
  const [productsServices, setProductsServices] = useState('');
  const [mainProductToBoost, setMainProductToBoost] = useState('');
  const [priceRange, setPriceRange] = useState('');

  // 3️⃣ Público Objetivo
  const [targetAudience, setTargetAudience] = useState('');
  const [productAttractiveness, setProductAttractiveness] = useState('');

  // 4️⃣ Comunicación
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [customTone, setCustomTone] = useState('');
  const [referents, setReferents] = useState('');
  const [competitors, setCompetitors] = useState('');

  // 5️⃣ ¿Qué queremos lograr? (Prioridades ordenables)
  const [priorities, setPriorities] = useState<PriorityItem[]>([
    { id: 'visibilidad', title: 'Visibilidad', desc: 'Llegar a gente nueva que no me conoce.' },
    { id: 'engagement', title: 'Engagement', desc: 'Conectar más con mi comunidad actual.' },
    { id: 'leads', title: 'Generar Leads', desc: 'Que me pregunten por mis servicios/productos.' },
    { id: 'venta', title: 'Venta Directa', desc: 'Cerrar ventas de un producto específico.' },
    { id: 'educar', title: 'Educar', desc: 'Que entiendan qué hago y por qué me necesitan.' },
  ]);

  // 6️⃣ Logística de Contenido
  const [contentRole, setContentRole] = useState<'embajador' | 'supervisor' | ''>('');
  const [videosPerWeek, setVideosPerWeek] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableTones = [
    { id: 'educativo', label: 'Educativo' },
    { id: 'inspirador', label: 'Inspirador' },
    { id: 'cercano', label: 'Cercano / Humano' },
    { id: 'aspiracional', label: 'Aspiracional' },
    { id: 'profesional', label: 'Profesional / Corporativo' },
    { id: 'disruptivo', label: 'Disruptivo / Audaz' },
  ];

  const toggleTone = (toneLabel: string) => {
    setSelectedTones((prev) =>
      prev.includes(toneLabel)
        ? prev.filter((t) => t !== toneLabel)
        : [...prev, toneLabel]
    );
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...priorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPriorities.length) return;
    const temp = newPriorities[index];
    newPriorities[index] = newPriorities[targetIndex];
    newPriorities[targetIndex] = temp;
    setPriorities(newPriorities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError('Por favor, llena todos los datos de contacto obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    // Format tones string
    const tonesList = [...selectedTones];
    if (customTone.trim()) {
      tonesList.push(`Otro: ${customTone.trim()}`);
    }
    const communicationTones = tonesList.join(', ');

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          contactName,
          contactEmail,
          brandThreeWords,
          differentiation,
          avoidTopics,
          growthBlockers,
          hasBrandManual,
          brandManualLink,
          productsServices,
          mainProductToBoost,
          priceRange,
          targetAudience,
          productAttractiveness,
          communicationTones,
          referents,
          competitors,
          priorities,
          contentRole,
          videosPerWeek,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al enviar el briefing.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  };

  return (
    <div
      className="min-h-screen flex flex-col relative py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #141C2E 100%)' }}
    >
      {/* Dynamic Ambient Background Glows */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none filter blur-[140px] opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(184,151,108,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[550px] h-[550px] rounded-full pointer-events-none filter blur-[160px] opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-3xl w-full mx-auto relative z-10">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/${locale}/portal/login`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <ArrowLeft size={14} />
            Volver al Portal
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">Azu</span>
            <span className="text-[10px] font-bold tracking-widest text-amber-500/80 uppercase">
              DIGITAL STUDIO
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            /* Success State Card */
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'rgba(22,163,74,0.15)', color: '#22c55e' }}
              >
                <CheckCircle2 size={44} />
              </motion.div>

              <h2 className="text-3xl font-black text-white tracking-tight">¡Briefing Recibido con Éxito!</h2>
              <p className="text-slate-300 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                Muchas gracias por completar la información estratégica de tu marca. El equipo de <strong className="text-amber-400">Azu Digital Studio</strong> analizará tus respuestas para diseñar una propuesta a tu medida.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="https://www.azudigitalstudio.com"
                  className="px-6 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90 shadow-lg shadow-amber-500/10"
                  style={{ background: '#B8976C', color: '#0A0F1C' }}
                >
                  Ir al sitio web
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold transition-all hover:bg-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Enviar otro briefing
                </button>
              </div>
            </motion.div>
          ) : (
            /* Main Briefing Form Card */
            <motion.div
              key="briefing-form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 sm:p-10 border backdrop-blur-md flex flex-col gap-10 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {/* Form Header */}
              <div className="border-b border-white/10 pb-6">
                <span
                  className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3"
                  style={{ background: 'rgba(184,151,108,0.15)', color: '#B8976C' }}
                >
                  <Sparkles size={12} /> Onboarding & Estrategia
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  Briefing de Marca
                </h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Completa este formulario con los detalles clave de tu marca para que el equipo creativo de Azu Digital Studio entienda a fondo tus objetivos y audiencia.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl text-xs font-semibold text-red-300 bg-red-950/40 border border-red-800/40">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-10">

                {/* 📌 SECCIÓN DE CONTACTO */}
                <div className="flex flex-col gap-5 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Datos de Contacto
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">
                        Nombre de la Marca / Empresa <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Azu Digital Studio"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                        style={inputStyle}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">
                        Persona de Contacto <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. María García"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      Correo Electrónico <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ej. contacto@mimarca.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 1️⃣ SECCIÓN 1: Marca Personal y Diferenciación */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <span className="text-lg">1️⃣</span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Marca Personal y Diferenciación
                    </h2>
                  </div>

                  {/* 1.1 Tres palabras */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Cómo describirías tu marca en tres palabras?
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Disruptiva, Elegante, Innovadora"
                      value={brandThreeWords}
                      onChange={(e) => setBrandThreeWords(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                      style={inputStyle}
                    />
                  </div>

                  {/* 1.2 Diferenciación */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Qué es lo que te diferencia hoy en tu nicho?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe qué hace único a tu negocio, tu metodología o tu producto..."
                      value={differentiation}
                      onChange={(e) => setDifferentiation(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 1.3 Temas NO deseados */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Hay temas, palabras o estilos que NO quieres comunicar o con los que no quieres que te asocien?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. No usar tono agresivo, evitar polémicas, no usar cierto tipo de colores o lenguaje informal..."
                      value={avoidTopics}
                      onChange={(e) => setAvoidTopics(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 1.4 Qué te frena */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Qué sientes que te está frenando hoy para poder llevar tu negocio/marca al siguiente nivel?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Falta de tiempo para crear contenido constante, falta de estrategia clara, imagen desactualizada..."
                      value={growthBlockers}
                      onChange={(e) => setGrowthBlockers(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 1.5 Manual de Identidad */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Tienes un Manual de Identidad de tu marca donde tengas establecido un logo, paleta de colores, tipografía, etc?
                    </label>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasBrandManual('yes')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          hasBrandManual === 'yes'
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <FileCheck size={18} className={hasBrandManual === 'yes' ? 'text-amber-400' : 'text-slate-500'} />
                        <span className="text-xs font-bold">Sí, completo</span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Tengo logo, paleta, fuentes y guía definida.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHasBrandManual('basic')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          hasBrandManual === 'basic'
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <Palette size={18} className={hasBrandManual === 'basic' ? 'text-amber-400' : 'text-slate-500'} />
                        <span className="text-xs font-bold">Algo básico</span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Solo logo o colores informales.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHasBrandManual('no')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          hasBrandManual === 'no'
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <FileX size={18} className={hasBrandManual === 'no' ? 'text-amber-400' : 'text-slate-500'} />
                        <span className="text-xs font-bold">No lo tengo</span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Requiero ayuda para construirlo.
                        </span>
                      </button>
                    </div>

                    {(hasBrandManual === 'yes' || hasBrandManual === 'basic') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col gap-1.5 mt-2"
                      >
                        <label className="text-[11px] font-semibold text-slate-400">
                          Enlace a tu Manual o Recursos (Drive / Figma / Canva / Web)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={brandManualLink}
                          onChange={(e) => setBrandManualLink(e.target.value)}
                          className="px-4 py-3 rounded-xl text-xs outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                          style={inputStyle}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 2️⃣ SECCIÓN 2: Productos / Servicios */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <span className="text-lg">2️⃣</span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Productos / Servicios
                    </h2>
                  </div>

                  {/* 2.1 Qué productos ofreces */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Qué productos o servicios ofreces? Descríbelos brevemente.
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Consultoría 1 a 1, Cursos online, Servicios de agencias, Venta de prendas..."
                      value={productsServices}
                      onChange={(e) => setProductsServices(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 2.2 Cuál impulsar más */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Cuál producto / servicio es el que más quieres impulsar en este momento?
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Indica la oferta estrella o producto prioritario..."
                      value={mainProductToBoost}
                      onChange={(e) => setMainProductToBoost(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 2.3 Rango de precio */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿En qué rango de precio se encuentran?
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Entre $100 - $500 USD / Servicio High-Ticket de $1,500 USD"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 3️⃣ SECCIÓN 3: Público Objetivo */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <span className="text-lg">3️⃣</span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Público Objetivo
                    </h2>
                  </div>

                  {/* 3.1 Cliente Ideal */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Quién es tu cliente ideal? (Edad, ubicación, intereses, etc).
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Hombres y mujeres de 28 a 45 años, emprendedores, ubicados en Latinoamérica o España, con interés en tecnología..."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 3.2 Qué lo hace atractivo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Qué hace atractivo tu producto o servicio para tus clientes?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. La rapidez de entrega, el soporte personalizado, la exclusividad, los resultados probados..."
                      value={productAttractiveness}
                      onChange={(e) => setProductAttractiveness(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 4️⃣ SECCIÓN 4: Comunicación */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <span className="text-lg">4️⃣</span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Comunicación
                    </h2>
                  </div>

                  {/* 4.1 Tono */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Buscas un tono educativo, inspirador, cercano, aspiracional u otro?
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {availableTones.map((tone) => {
                        const isSelected = selectedTones.includes(tone.label);
                        return (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => toggleTone(tone.label)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{tone.label}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="Si buscas otro tono, especifícalo aquí..."
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      className="px-4 py-3 rounded-xl text-xs outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] mt-1"
                      style={inputStyle}
                    />
                  </div>

                  {/* 4.2 Referentes */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Coloca a continuación tus referentes en tu nicho cuyo estilo visual o de comunicación te guste:</span>
                    </label>
                    <div className="text-[11px] text-amber-400/90 italic flex items-center gap-1">
                      <Sparkles size={12} /> Nota: esta información será utilizada para análisis de datos.
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Escribe nombres de usuarios, marcas o pega enlaces (Instagram, TikTok, YouTube)..."
                      value={referents}
                      onChange={(e) => setReferents(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  {/* 4.3 Competencia directa */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Coloca a continuación tu competencia directa en tu nicho:
                    </label>
                    <div className="text-[11px] text-amber-400/90 italic flex items-center gap-1">
                      <Sparkles size={12} /> Nota: esta información será utilizada para análisis de datos.
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Escribe nombres o cuentas de tu competencia directa..."
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      className="px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05] resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 5️⃣ SECCIÓN 5: Objetivos por Prioridad */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">5️⃣</span>
                      <h2 className="text-lg font-bold text-white tracking-wide">
                        ¿Qué queremos lograr?
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
                      Reordena por prioridad (1 = Mayor prioridad)
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Ordena estas opciones por prioridad utilizando las flechas <ChevronUp size={12} className="inline" /> <ChevronDown size={12} className="inline" /> según lo que más te interesa lograr en esta etapa:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {priorities.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="flex items-center justify-between p-4 rounded-xl border transition-all"
                        style={{
                          background: idx === 0 ? 'rgba(184,151,108,0.08)' : 'rgba(255, 255, 255, 0.02)',
                          borderColor: idx === 0 ? 'rgba(184,151,108,0.3)' : 'rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                            style={{
                              background: idx === 0 ? '#B8976C' : 'rgba(255,255,255,0.08)',
                              color: idx === 0 ? '#0A0F1C' : '#ffffff',
                            }}
                          >
                            {idx + 1}º
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => movePriority(idx, 'up')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-all"
                            title="Subir prioridad"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === priorities.length - 1}
                            onClick={() => movePriority(idx, 'down')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-all"
                            title="Bajar prioridad"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 6️⃣ SECCIÓN 6: Logística de Contenido */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <span className="text-lg">6️⃣</span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Logística de Contenido
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-slate-300">
                      ¿Qué papel prefieres tener en la creación de contenido?
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Option 1: Embajador */}
                      <button
                        type="button"
                        onClick={() => setContentRole('embajador')}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 cursor-pointer ${
                          contentRole === 'embajador'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-amber-400">
                          <Mic size={20} />
                          <span className="text-sm font-bold text-white">Embajador de mi marca</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Estoy listo para ser la voz y el rostro de mi proyecto. Ustedes me dan la estrategia y los guiones listos, y yo me encargo de la grabación para el contenido que lo amerite.
                        </p>
                      </button>

                      {/* Option 2: Supervisor */}
                      <button
                        type="button"
                        onClick={() => setContentRole('supervisor')}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 cursor-pointer ${
                          contentRole === 'supervisor'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-amber-400">
                          <Eye size={20} />
                          <span className="text-sm font-bold text-white">Supervisor de contenido</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          No apareceré en pantalla. El equipo creará contenido enfocado puramente en el producto/servicio mediante diseño y recursos visuales, y mi rol será validar y aprobar el material.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Videos per week input (Only if Embajador) */}
                  {contentRole === 'embajador' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-2 p-5 rounded-2xl mt-2"
                      style={{ background: 'rgba(184,151,108,0.06)', border: '1px solid rgba(184,151,108,0.2)' }}
                    >
                      <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <Video size={14} />
                        ¿Cuántos videos por semana puedes grabar de manera realista?
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 2 a 3 videos por semana / 1 video por semana"
                        value={videosPerWeek}
                        onChange={(e) => setVideosPerWeek(e.target.value)}
                        className="px-4 py-3 rounded-xl text-xs outline-none transition-all focus:border-amber-400/60 focus:bg-white/[0.05]"
                        style={inputStyle}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black tracking-wide transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xl"
                  style={{
                    background: '#B8976C',
                    color: '#0A0F1C',
                    boxShadow: '0 8px 25px rgba(184,151,108,0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando Briefing Estratégico...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar Briefing de Marca
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
