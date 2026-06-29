import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { locale } = await request.json();

  const { data: client } = await supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!client?.stripe_customer_id) {
    return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const session = await getStripe().billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    return_url: `${baseUrl}/${locale}/portal/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
