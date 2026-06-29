'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
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
  const [working, setWorking]   = useState(false);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const handleCheckout = async (planId: string) => {
    setWorking(true);
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, locale }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('error', data.error ?? 'Error al crear sesión de pago');
      setWorking(false);
    }
  };

  const handlePortal = async () => {
    setWorking(true);
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('error', data.error ?? 'Error al abrir el portal de facturación');
      setWorking(false);
    }
  };

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

        {isActive && billing?.stripeCustomerId && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(10,15,28,0.06)' }}>
            <button
              onClick={handlePortal}
              disabled={working}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ color: '#0A0F1C' }}
            >
              <ExternalLink size={14} />
              Gestionar suscripción en Stripe
            </button>
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
            {plans.filter((p) => p.stripe_price_id).map((plan) => (
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
                  onClick={() => handleCheckout(plan.id)}
                  disabled={working}
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: '#0A0F1C', color: '#ffffff' }}
                >
                  {working ? 'Procesando…' : 'Suscribirme'}
                </button>
              </div>
            ))}
            {plans.filter((p) => p.stripe_price_id).length === 0 && (
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
    </div>
  );
}
