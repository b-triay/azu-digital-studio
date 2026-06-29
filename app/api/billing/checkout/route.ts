import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, locale } = await request.json();

  const { data: plan } = await supabase
    .from('plans')
    .select('id, name, stripe_price_id')
    .eq('id', planId)
    .single();

  if (!plan?.stripe_price_id) {
    return NextResponse.json({ error: 'Plan sin precio de Stripe configurado' }, { status: 400 });
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  let customerId = client.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: client.name,
      metadata: { supabase_client_id: client.id },
    });
    customerId = customer.id;
    await supabase
      .from('clients')
      .update({ stripe_customer_id: customerId })
      .eq('id', client.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${baseUrl}/${locale}/portal/dashboard/billing?success=1`,
    cancel_url: `${baseUrl}/${locale}/portal/dashboard/billing?canceled=1`,
    metadata: { supabase_client_id: client.id },
  });

  return NextResponse.json({ url: session.url });
}
