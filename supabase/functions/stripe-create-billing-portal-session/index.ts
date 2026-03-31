import { corsHeaders } from '../_shared/cors.ts';
import { getAdminClient, getUserClient, json, stripe } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  try {
    const userClient = getUserClient(req);
    const admin = getAdminClient();

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });
    }

    const { origin } = await req.json();
    const { data: membership, error: membershipError } = await admin
      .from('user_memberships')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.stripe_customer_id) {
      return json({ error: 'Stripe customer not found for this user.' }, { status: 400, headers: corsHeaders });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: membership.stripe_customer_id,
      return_url: origin,
    });

    return json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Stripe billing portal session.';
    return json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
