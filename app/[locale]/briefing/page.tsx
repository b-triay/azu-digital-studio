'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, Send, Laptop, Sparkles, Camera, Play, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BriefingPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  // Form states
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [styleTone, setStyleTone] = useState('');
  const [references, setReferences] = useState('');
  const [comments, setComments] = useState('');
  
  // Channels selection
  const [channels, setChannels] = useState<string[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableChannels = [
    { id: 'instagram', label: 'Instagram', icon: <Camera size={12} />, color: '#c026d3' },
    { id: 'tiktok', label: 'TikTok', icon: <span className="text-[10px] font-bold">TK</span>, color: '#ffffff' },
    { id: 'youtube', label: 'YouTube', icon: <Play size={12} />, color: '#dc2626' },
    { id: 'email', label: 'Email Marketing', icon: <Mail size={12} />, color: '#2563eb' },
    { id: 'web', label: 'Web / Landing', icon: <Laptop size={12} />, color: '#16a34a' },
    { id: 'other', label: 'Otros', icon: <FileText size={12} />, color: '#8a9bb0' },
  ];

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !contactName || !contactEmail || !projectGoal) {
      setError('Por favor, completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          contactName,
          contactEmail,
          projectGoal,
          targetAudience,
          competitors,
          styleTone,
          channels,
          references,
          comments,
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
      className="min-h-screen flex flex-col relative py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #141C2E 100%)' }}
    >
      {/* Background glow effects */}
      <div
        className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none filter blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(184,151,108,0.08) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none filter blur-[150px]"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)' }}
      />

      <div className="max-w-3xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
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

        {/* Success Card */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="rounded-3xl p-10 text-center flex flex-col items-center justify-center border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a' }}
              >
                <CheckCircle2 size={36} />
              </motion.div>

              <h2 className="text-2xl font-black text-white">¡Briefing Recibido!</h2>
              <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                Gracias por completar la información de tu marca. El equipo de **Azu Digital Studio** ha sido notificado y comenzará a revisar tus objetivos. Nos pondremos en contacto contigo a la brevedad.
              </p>

              <div className="mt-8 flex gap-3">
                <Link
                  href="https://www.azudigitalstudio.com"
                  className="px-6 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: '#B8976C', color: '#0A0F1C' }}
                >
                  Ir al sitio web
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Enviar otro briefing
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 sm:p-10 border flex flex-col gap-8"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Form title */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 inline-flex items-center gap-1" style={{ background: 'rgba(184,151,108,0.15)', color: '#B8976C' }}>
                  <Sparkles size={10} /> Planificación de Campaña
                </span>
                <h1 className="text-3xl font-black tracking-tight text-white mt-1">Briefing de Marca</h1>
                <p className="text-sm text-slate-400 mt-2">
                  Completa esta información para alinearnos con la identidad y objetivos de tu marca. El equipo utilizará este documento como guía creativa.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl text-xs font-medium text-red-400 bg-red-950/30 border border-red-900/30">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Seccion 1: Contacto */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">1. Información de Contacto</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">Nombre de la Marca / Empresa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Azu Digital Studio"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent"
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">Persona de Contacto *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ej. contacto@marca.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Seccion 2: Canales y Objetivos */}
                <div className="flex flex-col gap-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">2. Canales y Objetivos</h3>
                  
                  {/* Channels Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400">¿En qué canales operará la marca? (Selecciona todos los que apliquen)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availableChannels.map((ch) => {
                        const isSelected = channels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleChannel(ch.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                            style={{
                              background: isSelected ? `${ch.color}15` : 'rgba(255, 255, 255, 0.03)',
                              borderColor: isSelected ? ch.color : 'rgba(255, 255, 255, 0.1)',
                              color: isSelected ? '#ffffff' : '#8a9bb0',
                            }}
                          >
                            {ch.icon}
                            {ch.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">¿Cuáles son los objetivos principales del proyecto? *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Ej. Aumentar ventas online, posicionamiento de marca, generar leads, etc."
                      value={projectGoal}
                      onChange={(e) => setProjectGoal(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Público u Target Objetivo</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Emprendedores de 25-40 años, interesados en tecnología, ubicados en Latinoamérica."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Seccion 3: Estilo e Inspiracion */}
                <div className="flex flex-col gap-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">3. Estilo e Identidad</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Tono de Comunicación y Personalidad</label>
                    <input
                      type="text"
                      placeholder="Ej. Profesional pero cercano, disruptivo, corporativo, elegante."
                      value={styleTone}
                      onChange={(e) => setStyleTone(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent"
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Competidores de Referencia (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Marca Competidora A, Competidora B (links o nombres)"
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent"
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Links de Referencia o Inspiración Visual</label>
                    <textarea
                      rows={2}
                      placeholder="Pega links a carpetas de Drive, tableros de Pinterest, cuentas de Instagram que te gusten, etc."
                      value={references}
                      onChange={(e) => setReferences(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Seccion 4: Comentarios */}
                <div className="flex flex-col gap-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">4. Comentarios Adicionales</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Cualquier otra información relevante</label>
                    <textarea
                      rows={2}
                      placeholder="Comentarios adicionales, presupuesto estimado, fechas límites, etc."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-slate-400 focus:bg-transparent resize-none leading-relaxed"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black tracking-wide transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: '#B8976C', color: '#0A0F1C', boxShadow: '0 4px 20px rgba(184,151,108,0.25)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando Briefing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Briefing de Proyecto
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
