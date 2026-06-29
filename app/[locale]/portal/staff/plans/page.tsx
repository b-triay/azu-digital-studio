'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Check, DollarSign, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_usd: number | null;
  active: boolean;
  created_at: string;
}

interface PlanForm {
  name: string;
  description: string;
  price_usd: string;
  active: boolean;
}

const DEFAULT_FORM: PlanForm = { name: '', description: '', price_usd: '', active: true };

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50,
  background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
};

export default function PlansPage() {
  const [plans, setPlans]           = useState<Plan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [form, setForm]             = useState<PlanForm>(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);
  const [feedback, setFeedback]     = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('plans').select('*').order('name');
    setPlans(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const openCreate = () => { setForm(DEFAULT_FORM); setShowCreate(true); };
  const openEdit = (plan: Plan) => {
    setForm({ name: plan.name, description: plan.description ?? '', price_usd: plan.price_usd != null ? String(plan.price_usd) : '', active: plan.active });
    setEditTarget(plan);
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_usd: form.price_usd !== '' ? parseFloat(form.price_usd) : null,
      active: form.active,
    };
    if (editTarget) {
      await supabase.from('plans').update(payload).eq('id', editTarget.id);
      setEditTarget(null);
      setFeedback('Plan actualizado');
    } else {
      await supabase.from('plans').insert(payload);
      setShowCreate(false);
      setFeedback('Plan creado');
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 2500);
    loadPlans();
  };

  const handleDelete = async () => {
    if (!deleteTarget || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('plans').delete().eq('id', deleteTarget.id);
    setSaving(false);
    setDeleteTarget(null);
    setFeedback('Plan eliminado');
    setTimeout(() => setFeedback(null), 2500);
    loadPlans();
  };

  const isModalOpen = showCreate || !!editTarget;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>Planes</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
            {plans.filter(p => p.active).length} activos · {plans.filter(p => !p.active).length} inactivos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: '#0A0F1C', color: '#ffffff' }}
        >
          <Plus size={14} />
          Agregar plan
        </button>
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
          >
            <Check size={14} /> {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}>
          <Package size={36} style={{ color: '#cbd5e1' }} />
          <p className="text-sm font-semibold mt-3" style={{ color: '#8A9BB0' }}>No hay planes creados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#0A0F1C' + '12' }}>
                <DollarSign size={18} style={{ color: '#0A0F1C' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{plan.name}</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={plan.active
                      ? { background: '#f0fdf4', color: '#16a34a' }
                      : { background: '#F7F4EE', color: '#8A9BB0' }}>
                    {plan.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-xs truncate" style={{ color: '#5A6B80' }}>{plan.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>
                  {plan.price_usd != null ? `$${plan.price_usd}/mes` : '—'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(plan)}
                  className="p-2 rounded-lg transition-colors hover:bg-[rgba(10,15,28,0.07)]">
                  <Pencil size={14} style={{ color: '#5A6B80' }} />
                </button>
                <button onClick={() => setDeleteTarget(plan)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50">
                  <Trash2 size={14} style={{ color: '#ef4444' }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div style={overlayStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setEditTarget(null); } }}>
            <motion.div
              className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: '#ffffff', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>
                  {editTarget ? 'Editar plan' : 'Nuevo plan'}
                </h2>
                <button onClick={() => { setShowCreate(false); setEditTarget(null); }}
                  className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)]">
                  <X size={16} style={{ color: '#5A6B80' }} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  Nombre del plan *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Premium"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Descripción opcional del plan"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                />
              </div>

              {/* Price + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#8A9BB0' }}>
                    Precio USD/mes
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price_usd}
                    onChange={e => setForm(f => ({ ...f, price_usd: e.target.value }))}
                    placeholder="300"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'inherit' }}
                  />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm font-semibold" style={{ color: '#334155' }}>Plan activo</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditTarget(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[rgba(10,15,28,0.07)]"
                  style={{ color: '#5A6B80', border: '1.5px solid rgba(10,15,28,0.12)' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!form.name.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: '#0A0F1C', color: '#ffffff' }}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div style={overlayStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: '#ffffff', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            >
              <h2 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>Eliminar plan</h2>
              <p className="text-sm" style={{ color: '#5A6B80' }}>
                ¿Eliminar <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:bg-[rgba(10,15,28,0.07)]"
                  style={{ color: '#5A6B80', border: '1.5px solid rgba(10,15,28,0.12)' }}>
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: '#ef4444', color: '#ffffff' }}>
                  {saving ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
