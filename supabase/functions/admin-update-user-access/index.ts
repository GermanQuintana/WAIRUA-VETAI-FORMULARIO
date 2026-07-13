import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const rolePriority = ['admin', 'reviewer', 'editor', 'contributor', 'viewer'] as const;
const accountTypes = ['free', 'premium', 'company', 'partner'] as const;
const partnerCategories = ['scientific', 'training', 'strategic', 'commercial'] as const;

type UserRole = (typeof rolePriority)[number];
type AccountType = (typeof accountTypes)[number];
type PartnerCategory = (typeof partnerCategories)[number];

const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const getAdminClient = () =>
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

const getUserClient = (req: Request) =>
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

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const normalizeRoles = (value: unknown): UserRole[] => {
  const rawRoles = Array.isArray(value) ? value.map((item) => String(item)) : [];
  const roles = rawRoles.filter((role): role is UserRole => rolePriority.includes(role as UserRole));
  if (roles.length === 0) return ['viewer'];
  return Array.from(new Set(roles)).sort((left, right) => rolePriority.indexOf(left) - rolePriority.indexOf(right));
};

const getEffectiveRole = (roles: UserRole[]) => roles[0] ?? 'viewer';

const normalizeAccountType = (value: unknown): AccountType => {
  const accountType = typeof value === 'string' ? value : '';
  return accountTypes.includes(accountType as AccountType) ? (accountType as AccountType) : 'free';
};

const normalizePartnerCategory = (value: unknown): PartnerCategory | null => {
  const partnerCategory = typeof value === 'string' ? value : '';
  return partnerCategories.includes(partnerCategory as PartnerCategory) ? (partnerCategory as PartnerCategory) : null;
};

const isAdminProfile = (profile: Record<string, unknown> | null | undefined) => {
  const roles = normalizeRoles(profile?.roles ?? profile?.role);
  return roles.includes('admin') || profile?.role === 'admin';
};

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

    const body = await req.json();
    const targetUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!targetUserId) {
      return json({ error: 'Missing target user.' }, { status: 400, headers: corsHeaders });
    }

    const { data: callerProfile, error: callerError } = await admin
      .from('profiles')
      .select('id,role,roles')
      .eq('id', user.id)
      .maybeSingle();

    if (callerError) throw callerError;
    if (!isAdminProfile(callerProfile as Record<string, unknown> | null)) {
      return json({ error: 'Forbidden.' }, { status: 403, headers: corsHeaders });
    }

    const roles = normalizeRoles(body?.roles);
    if (targetUserId === user.id && !roles.includes('admin')) {
      return json({ error: 'No puedes quitar tu propio rol de administrador desde este panel.' }, { status: 400, headers: corsHeaders });
    }

    const accountType = normalizeAccountType(body?.accountType);
    const partnerCategory = accountType === 'partner' ? normalizePartnerCategory(body?.partnerCategory) : null;

    const { data: profile, error: updateError } = await admin
      .from('profiles')
      .update({
        role: getEffectiveRole(roles),
        roles,
        account_type: accountType,
        partner_category: partnerCategory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return json({ profile }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update user access.';
    console.error('admin-update-user-access error', error);
    return json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
