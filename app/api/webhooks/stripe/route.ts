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
  subscriptionId?: string,
  planName?: string | null
) {
  const update: Record<string, any> = { subscription_status: status };
  if (subscriptionId) update.stripe_subscription_id = subscriptionId;
  if (planName !== undefined) update.plan = planName;
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
        const subscriptionId = session.subscription as string;
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        let planName = null;
        if (priceId) {
          const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('stripe_price_id', priceId)
            .single();
          if (plan) planName = plan.name;
        }
        await updateClientStatus(
          supabase,
          session.customer as string,
          'active',
          subscriptionId,
          planName
        );
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      let planName = null;
      if (priceId) {
        const { data: plan } = await supabase
          .from('plans')
          .select('name')
          .eq('stripe_price_id', priceId)
          .single();
        if (plan) planName = plan.name;
      }
      await updateClientStatus(supabase, sub.customer as string, sub.status, sub.id, planName);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await updateClientStatus(supabase, sub.customer as string, 'canceled', undefined, null);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
