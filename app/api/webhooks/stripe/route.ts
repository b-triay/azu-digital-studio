import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function updateClientStatus(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string,
  status: string,
  subscriptionId?: string
) {
  const update: Record<string, string> = { subscription_status: status };
  if (subscriptionId) update.stripe_subscription_id = subscriptionId;
  await supabase
    .from('clients')
    .update(update)
    .eq('stripe_customer_id', customerId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.customer) {
        await updateClientStatus(
          supabase,
          session.customer as string,
          'active',
          session.subscription as string
        );
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await updateClientStatus(supabase, sub.customer as string, sub.status, sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await updateClientStatus(supabase, sub.customer as string, 'canceled');
      break;
    }
  }

  return NextResponse.json({ received: true });
}
