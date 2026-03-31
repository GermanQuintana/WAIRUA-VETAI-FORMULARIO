import Stripe from 'npm:stripe@18';
import { corsHeaders } from '../_shared/cors.ts';
import {
  getAdminClient,
  getBillingCycleFromInterval,
  json,
  mapStripeStatusToMembershipStatus,
  stripe,
  toIsoFromUnix,
} from '../_shared/stripe.ts';

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const findMembershipQuery = (admin: ReturnType<typeof getAdminClient>, userId?: string | null, customerId?: string | null, subscriptionId?: string | null) => {
  if (userId) return admin.from('user_memberships').select('*').eq('user_id', userId).maybeSingle();
  if (subscriptionId) return admin.from('user_memberships').select('*').eq('stripe_subscription_id', subscriptionId).maybeSingle();
  return admin.from('user_memberships').select('*').eq('stripe_customer_id', customerId ?? '').maybeSingle();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  if (!webhookSecret) {
    return json({ error: 'Missing STRIPE_WEBHOOK_SECRET.' }, { status: 500, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return json({ error: 'Missing Stripe signature.' }, { status: 400, headers: corsHeaders });
    }

    const payload = await req.text();
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret, undefined, cryptoProvider);
    const admin = getAdminClient();

    const { error: insertEventError } = await admin
      .from('stripe_webhook_events')
      .insert({ id: event.id, type: event.type });

    if (insertEventError && insertEventError.code === '23505') {
      return json({ received: true, duplicate: true }, { headers: corsHeaders });
    }
    if (insertEventError) throw insertEventError;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId =
          session.client_reference_id ?? (typeof session.metadata?.supabase_user_id === 'string' ? session.metadata.supabase_user_id : null);

        if (!userId) break;

        const { error } = await admin
          .from('user_memberships')
          .update({
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = typeof subscription.metadata?.supabase_user_id === 'string' ? subscription.metadata.supabase_user_id : null;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
        const subscriptionId = subscription.id;

        const { data: membership, error: membershipError } = await findMembershipQuery(admin, userId, customerId, subscriptionId);
        if (membershipError) throw membershipError;
        if (!membership) break;

        const firstItem = subscription.items.data[0];
        const billingCycle = getBillingCycleFromInterval(firstItem?.price?.recurring?.interval ?? null);
        const localStatus = mapStripeStatusToMembershipStatus(subscription.status);

        const { error } = await admin
          .from('user_memberships')
          .update({
            billing_cycle: billingCycle,
            status: localStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: firstItem?.price?.id ?? membership.stripe_price_id ?? null,
            stripe_status: subscription.status,
            current_period_end: toIsoFromUnix(subscription.current_period_end),
            trial_ends_at: toIsoFromUnix(subscription.trial_end) ?? membership.trial_ends_at,
            cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', membership.user_id);

        if (error) throw error;
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id ?? null;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
        const { data: membership, error: membershipError } = await findMembershipQuery(admin, null, customerId, subscriptionId);
        if (membershipError) throw membershipError;
        if (!membership) break;

        const { error } = await admin
          .from('user_memberships')
          .update({
            status: membership.stripe_status === 'trialing' ? 'trialing' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', membership.user_id);

        if (error) throw error;
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id ?? null;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
        const { data: membership, error: membershipError } = await findMembershipQuery(admin, null, customerId, subscriptionId);
        if (membershipError) throw membershipError;
        if (!membership) break;

        const { error } = await admin
          .from('user_memberships')
          .update({
            status: 'pending_payment',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', membership.user_id);

        if (error) throw error;
        break;
      }

      default:
        break;
    }

    return json({ received: true }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe webhook failed.';
    return json({ error: message }, { status: 400, headers: corsHeaders });
  }
});
