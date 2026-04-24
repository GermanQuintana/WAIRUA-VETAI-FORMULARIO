import { corsHeaders } from '../_shared/cors.ts';
import {
  getAdminClient,
  getAuthProvider,
  getStripeClinicSeatPriceId,
  getStripePriceId,
  getUserClient,
  json,
  stripe,
} from '../_shared/stripe.ts';

const TRIAL_DAYS = 10;
const INDIVIDUAL_MONTHLY_PRICE_CENTS = 1800;
const CLINIC_MONTHLY_BASE_PRICE_CENTS = 3900;
const CLINIC_MONTHLY_SEAT_PRICE_CENTS = 700;

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

    const { selection, origin } = await req.json();
    const billingCycle = 'monthly';
    const rawPlanId = typeof selection?.planId === 'string' ? selection.planId : 'individual_monthly';
    const planId = rawPlanId === 'clinic_monthly' ? 'clinic_monthly' : 'individual_monthly';
    const seatCount = planId === 'clinic_monthly' ? Math.max(1, Math.round(Number(selection?.seatCount ?? 1))) : 1;
    const discountCode = String(selection?.discountCode ?? '').trim().toUpperCase();
    const listPriceCents =
      planId === 'clinic_monthly'
        ? CLINIC_MONTHLY_BASE_PRICE_CENTS + CLINIC_MONTHLY_SEAT_PRICE_CENTS * seatCount
        : Number(selection?.listPriceCents ?? INDIVIDUAL_MONTHLY_PRICE_CENTS);
    const finalPriceCents = discountCode ? Number(selection?.finalPriceCents ?? listPriceCents) : listPriceCents;

    const [{ data: profile }, { data: membership }] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('user_memberships').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const existingStripeCustomerId = typeof membership?.stripe_customer_id === 'string' ? membership.stripe_customer_id : null;
    const existingStripeSubscriptionId =
      typeof membership?.stripe_subscription_id === 'string' ? membership.stripe_subscription_id : null;

    if (existingStripeCustomerId && existingStripeSubscriptionId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: existingStripeCustomerId,
        return_url: origin,
      });

      return json({ url: portal.url }, { headers: corsHeaders });
    }

    let stripeCustomerId = existingStripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: typeof profile?.full_name === 'string' ? profile.full_name : undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;
    }

    let discounts: Array<{ coupon?: string; promotion_code?: string }> | undefined;
    let redeemedDiscountId: string | null = null;
    let redeemedDiscountCode: string | null = null;
    if (discountCode) {
      const discountQuery = await admin
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('active', true)
        .maybeSingle();

      const discount = discountQuery.data;
      if (discount?.id) {
        const { data: existingRedemption, error: redemptionError } = await admin
          .from('discount_code_redemptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('discount_code_id', discount.id)
          .maybeSingle();

        if (redemptionError) throw redemptionError;
        if (existingRedemption) {
          return json({ error: 'DISCOUNT_CODE_ALREADY_USED' }, { status: 409, headers: corsHeaders });
        }

        redeemedDiscountId = String(discount.id);
        redeemedDiscountCode = String(discount.code ?? discountCode).trim().toUpperCase();
      }

      if (discount?.stripe_promotion_code_id) {
        discounts = [{ promotion_code: discount.stripe_promotion_code_id }];
      } else if (discount?.stripe_coupon_id) {
        discounts = [{ coupon: discount.stripe_coupon_id }];
      }
    }

    const now = new Date();
    const trialEndsAt =
      typeof membership?.trial_ends_at === 'string'
        ? new Date(membership.trial_ends_at)
        : new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const trialEndTimestamp = Math.floor(trialEndsAt.getTime() / 1000);
    const hasRemainingTrial = trialEndTimestamp > Math.floor(now.getTime() / 1000);

    const lineItems = [
      {
        price: getStripePriceId(planId, billingCycle),
        quantity: 1,
      },
      ...(planId === 'clinic_monthly'
        ? [
            {
              price: getStripeClinicSeatPriceId(),
              quantity: seatCount,
            },
          ]
        : []),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: user.id,
      success_url: `${origin}?billing=success`,
      cancel_url: `${origin}?billing=cancelled`,
      billing_address_collection: 'auto',
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      line_items: lineItems,
      discounts,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
        seat_count: String(seatCount),
        discount_code: discountCode,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
          billing_cycle: billingCycle,
          seat_count: String(seatCount),
          discount_code: discountCode,
        },
        ...(hasRemainingTrial ? { trial_end: trialEndTimestamp } : {}),
      },
    });

    const authProvider = getAuthProvider(
      typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : null,
    );

    const trialStartedAt =
      typeof membership?.trial_started_at === 'string' ? membership.trial_started_at : now.toISOString();
    const trialEndsAtIso =
      typeof membership?.trial_ends_at === 'string' ? membership.trial_ends_at : trialEndsAt.toISOString();

    const payload = {
      user_id: user.id,
      signup_method: membership?.signup_method ?? authProvider,
      plan_id: planId,
      billing_cycle: billingCycle,
      seat_count: seatCount,
      status: membership?.status ?? (hasRemainingTrial ? 'trialing' : 'pending_payment'),
      list_price_cents: listPriceCents,
      final_price_cents: finalPriceCents,
      currency: 'EUR',
      trial_days: Number(membership?.trial_days ?? TRIAL_DAYS),
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAtIso,
      discount_code_id: selection?.discountCodeId ?? membership?.discount_code_id ?? null,
      discount_code: selection?.discountCode ?? membership?.discount_code ?? null,
      discount_months: selection?.discountMonths ?? membership?.discount_months ?? null,
      discount_amount_cents: selection?.discountAmountCents ?? membership?.discount_amount_cents ?? null,
      override_price_cents: selection?.overridePriceCents ?? membership?.override_price_cents ?? null,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: getStripePriceId(planId, billingCycle),
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await admin.from('user_memberships').upsert(payload, { onConflict: 'user_id' });
    if (upsertError) throw upsertError;

    if (redeemedDiscountId && redeemedDiscountCode) {
      const { error: redemptionInsertError } = await admin.from('discount_code_redemptions').insert({
        user_id: user.id,
        discount_code_id: redeemedDiscountId,
        discount_code: redeemedDiscountCode,
      });

      if (redemptionInsertError) {
        if (redemptionInsertError.code === '23505') {
          return json({ error: 'DISCOUNT_CODE_ALREADY_USED' }, { status: 409, headers: corsHeaders });
        }
        throw redemptionInsertError;
      }
    }

    return json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return 'Unable to create Stripe checkout session.';
            }
          })();

    console.error('stripe-create-checkout-session error', error);
    return json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
