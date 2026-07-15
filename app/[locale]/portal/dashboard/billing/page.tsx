'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle, X, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface BillingData {
  planName: string | null;
  planPrice: number | null;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'Activo',      color: '#16a34a', bg: 'rgba(22,163,74,0.08)',   icon: CheckCircle },
  trialing: { label: 'Prueba',      color: '#0284c7', bg: 'rgba(2,132,199,0.08)',   icon: Clock },
  past_due: { label: 'Vencido',     color: '#d97706', bg: 'rgba(217,119,6,0.08)',   icon: AlertCircle },
  canceled: { label: 'Cancelado',   color: '#dc2626', bg: 'rgba(220,38,38,0.08)',   icon: XCircle },
  inactive: { label: 'Sin plan',    color: '#5A6B80', bg: 'rgba(100,116,139,0.08)', icon: CreditCard },
};

export default function BillingPage() {
  const params       = useParams();
  const locale       = params.locale as string;
  const searchParams = useSearchParams();

  const [billing, setBilling]   = useState<BillingData | null>(null);
  const [plans, setPlans]       = useState<{ id: string; name: string; price_usd: number | null; stripe_price_id: string | null }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price_usd: number | null } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: client }, { data: plansData }] = await Promise.all([
      supabase
        .from('clients')
        .select('plan, stripe_customer_id, subscription_status')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('plans')
        .select('id, name, price_usd, stripe_price_id')
        .eq('active', true)
        .order('price_usd'),
    ]);

    setPlans(plansData ?? []);

    if (client) {
      const matched = (plansData ?? []).find((p) => p.name === client.plan);
      setBilling({
        planName: client.plan ?? null,
        planPrice: matched?.price_usd ?? null,
        subscriptionStatus: client.subscription_status ?? 'inactive',
        stripeCustomerId: client.stripe_customer_id ?? null,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (searchParams.get('success') === '1') showToast('success', '¡Pago exitoso! Tu suscripción está activa.');
    if (searchParams.get('canceled') === '1') showToast('error', 'Pago cancelado. Puedes intentarlo nuevamente.');
  }, [load, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  const status = billing?.subscriptionStatus ?? 'inactive';
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  const StatusIcon = statusCfg.icon;
  const isActive = status === 'active' || status === 'trialing';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{
            background: toast.type === 'success' ? '#16a34a' : '#dc2626',
            color: '#fff',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-extrabold" style={{ color: '#0A0F1C' }}>Facturación</h1>
        <p className="text-sm mt-1" style={{ color: '#5A6B80' }}>Gestiona tu plan y pagos.</p>
      </div>

      {/* Estado actual */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#8A9BB0' }}>
              Plan actual
            </p>
            <p className="text-2xl font-extrabold" style={{ color: '#0A0F1C' }}>
              {billing?.planName ?? 'Sin plan asignado'}
            </p>
            {billing?.planPrice && (
              <p className="text-sm mt-1" style={{ color: '#5A6B80' }}>
                USD ${billing.planPrice}/mes
              </p>
            )}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            <StatusIcon size={13} />
            {statusCfg.label}
          </div>
        </div>

        {isActive && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(10,15,28,0.06)' }}>
            <p className="text-xs font-medium" style={{ color: '#5A6B80', lineHeight: '1.5' }}>
              Para modificar, pausar o cancelar tu suscripción activa, por favor ponete en contacto con nuestro equipo de soporte escribiendo a <a href="mailto:staff@azudigitalstudio.com" className="font-bold underline transition-opacity hover:opacity-80" style={{ color: '#0A0F1C' }}>staff@azudigitalstudio.com</a>.
            </p>
          </div>
        )}
      </div>

      {/* Planes disponibles */}
      {!isActive && (
        <>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#0A0F1C' }}>
            Elegí un plan para comenzar
          </h2>
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl p-5 flex items-center justify-between gap-4"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
              >
                <div>
                  <p className="text-base font-bold" style={{ color: '#0A0F1C' }}>{plan.name}</p>
                  {plan.price_usd && (
                    <p className="text-sm mt-0.5" style={{ color: '#5A6B80' }}>USD ${plan.price_usd}/mes</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: '#0A0F1C', color: '#ffffff' }}
                >
                  Suscribirme
                </button>
              </div>
            ))}
            {plans.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
              >
                <p className="text-sm" style={{ color: '#5A6B80' }}>
                  Los planes de pago estarán disponibles próximamente.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de instrucciones de pago */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#0A0F1C' }}>
                Cómo suscribirte a {selectedPlan.name}
              </h2>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#5A6B80' }}>
              Para brindarte la mejor cotización y evitar cargos adicionales de impuestos, procesamos nuestros cobros de forma personalizada:
            </p>

            <div className="flex flex-col gap-3">
              {/* Opción 1: Transferencia ACH (EE. UU.) */}
              <div className="flex gap-3 items-start p-4 rounded-xl border border-slate-100" style={{ background: '#F8FAFC' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                  <span className="font-bold text-xs">ACH</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Transferencia ACH (EE. UU.)</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5A6B80' }}>
                    Ideal para clientes estadounidenses. Procesado mediante ARQ (DolarApp) con $0 costo extra de procesamiento.
                  </p>
                </div>
              </div>

              {/* Opción 2: Tarjeta de Crédito / Débito (Takenos) */}
              <div className="flex gap-3 items-start p-4 rounded-xl border border-slate-100" style={{ background: '#F8FAFC' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Tarjeta de Crédito / Apple & Google Pay</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5A6B80' }}>
                    Aceptamos Visa y Mastercard internacionales. Procesado de forma segura a través de Takenos.
                  </p>
                </div>
              </div>

              {/* Opción 3: Pesos Argentinos (Mercado Pago) */}
              <div className="flex gap-3 items-start p-4 rounded-xl border border-slate-100" style={{ background: '#F8FAFC' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-sky-50 text-sky-600">
                  <span className="font-bold text-xs">ARS</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Mercado Pago (Exclusivo Argentina)</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5A6B80' }}>
                    Pagá en pesos locales sin recargo del 60% de Impuesto PAIS y percepciones.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`mailto:staff@azudigitalstudio.com?subject=Suscripcion al Plan ${selectedPlan.name} - Azu Digital Studio&body=Hola equipo de Azu Digital Studio,%0D%0A%0D%0AMe gustaria suscribirme al Plan ${selectedPlan.name} ($${selectedPlan.price_usd} USD/mes).%0D%0A%0D%0APor favor, envienme los datos bancarios para transferir (ACH) o el link de cobro con tarjeta.%0D%0A%0D%0ASaludos!`}
                className="w-full py-3.5 rounded-xl text-center text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#0A0F1C' }}
              >
                <Mail size={16} />
                Solicitar Datos de Pago
              </a>
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full py-2.5 rounded-xl text-center text-xs font-semibold border transition-colors hover:bg-slate-50"
                style={{ color: '#5A6B80', borderColor: 'rgba(10,15,28,0.12)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
