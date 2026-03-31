import Stripe from 'npm:stripe@18';
import { createClient } from 'npm:@supabase/supabase-js@2';

const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'));

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

export const getAdminClient = () =>
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export const getUserClient = (req: Request) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? '',
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

export const getStripePriceId = (billingCycle: string) => {
  if (billingCycle === 'annual') return getEnv('STRIPE_ANNUAL_PRICE_ID');
  return getEnv('STRIPE_MONTHLY_PRICE_ID');
};

export const mapStripeStatusToMembershipStatus = (status?: string | null) => {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'incomplete':
    case 'unpaid':
      return 'pending_payment';
    case 'canceled':
      return 'cancelled';
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    default:
      return 'pending_payment';
  }
};

export const toIsoFromUnix = (value?: number | null) => (typeof value === 'number' ? new Date(value * 1000).toISOString() : null);

export const getBillingCycleFromInterval = (interval?: string | null) => (interval === 'year' ? 'annual' : 'monthly');

export const getAuthProvider = (provider?: string | null) => {
  if (provider === 'google' || provider === 'email') return provider;
  return 'unknown';
};
