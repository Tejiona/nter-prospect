import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('[Webhook] Signature invalide:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const PRICE_TO_PLAN: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
    [process.env.STRIPE_PRICE_GROWTH || '']: 'growth',
  };

  // --- NOUVELLE SOUSCRIPTION ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email || session.metadata?.email || '';
    const name = session.metadata?.company_name || session.customer_details?.name || '';
    const target = session.metadata?.target || '';
    const knowledgeBase = session.metadata?.knowledge_base || '';
    const lang = session.metadata?.lang || 'fr';

    let plan = 'starter';
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const priceId = lineItems.data[0]?.price?.id || '';
      plan = PRICE_TO_PLAN[priceId] || session.metadata?.plan || 'starter';
    } catch {
      plan = session.metadata?.plan || 'starter';
    }

    if (!email) {
      console.error('[Webhook] Pas d\'email dans la session Stripe');
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('clients')
      .select('id, plan')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      await supabase.from('clients').update({ plan }).eq('id', existing.id);
      console.log(`[Webhook] Client existant mis à jour: ${email} → plan ${plan}`);
    } else {
      const emailDomain = email.split('@')[1] || '';
      const website = session.metadata?.website || (emailDomain && !['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'].includes(emailDomain) ? emailDomain : '');

      const { error } = await supabase.from('clients').insert([{
        name: name || email.split('@')[0],
        email,
        website,
        plan,
        target,
        knowledge_base: knowledgeBase,
        report_lang: lang,
        report_mode: 'auto',
        report_freq: 'weekly',
        report_time: '08:00',
        report_day_week: '1',
        reports_sent: 0,
      }]);

      if (error) {
        console.error('[Webhook] Erreur création client:', error);
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
      }
      console.log(`[Webhook] Nouveau client créé: ${name} (${email}) — plan ${plan}`);
    }

    return NextResponse.json({ received: true, action: existing ? 'updated' : 'created', plan });
  }

  // --- ANNULATION D'ABONNEMENT ---
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const email = customer.email;

      if (email) {
        await supabase.from('clients').update({ plan: 'none' }).eq('email', email);
        console.log(`[Webhook] Abonnement annulé pour: ${email} → plan none`);
      }
    } catch (err) {
      console.error('[Webhook] Erreur traitement annulation:', err);
    }

    return NextResponse.json({ received: true, action: 'subscription_cancelled' });
  }

  return NextResponse.json({ received: true, action: 'ignored' });
}
