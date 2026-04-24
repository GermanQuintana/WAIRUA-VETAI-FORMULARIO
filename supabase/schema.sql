-- Collaborative editorial schema for WAIRUA VetAI
-- Focus: active ingredients, dosing rules by species/route/indication, references, tags, and review workflow.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  access_key text not null unique default ('WR-' || upper(encode(gen_random_bytes(12), 'hex'))),
  account_type text not null default 'free' check (account_type in ('free', 'premium', 'company', 'partner')),
  partner_category text check (partner_category in ('scientific', 'training', 'strategic', 'commercial')),
  national_id text,
  license_number text,
  license_province text,
  workplace_name text,
  center_fiscal_name text,
  center_tax_id text,
  center_type text,
  professional_email text,
  private_email text,
  websites text[] not null default array[]::text[],
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  facebook_url text,
  linkedin_url text,
  phone_mobile text,
  report_visible_fields text[] not null default array[]::text[],
  auth_provider text not null default 'email' check (auth_provider in ('google', 'email', 'unknown')),
  role text not null default 'viewer' check (role in ('viewer', 'contributor', 'editor', 'reviewer', 'admin')),
  roles text[] not null default array['viewer']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists access_key text,
  add column if not exists account_type text not null default 'free',
  add column if not exists partner_category text,
  add column if not exists national_id text,
  add column if not exists license_number text,
  add column if not exists license_province text,
  add column if not exists workplace_name text,
  add column if not exists center_fiscal_name text,
  add column if not exists center_tax_id text,
  add column if not exists center_type text,
  add column if not exists professional_email text,
  add column if not exists private_email text,
  add column if not exists websites text[] not null default array[]::text[],
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text,
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists phone_mobile text,
  add column if not exists report_visible_fields text[] not null default array[]::text[],
  add column if not exists auth_provider text not null default 'email',
  add column if not exists roles text[] not null default array['viewer']::text[],
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set roles = array[role]
where roles is null or cardinality(roles) = 0;

alter table if exists public.profiles
  alter column access_key set default ('WR-' || upper(encode(gen_random_bytes(12), 'hex')));

update public.profiles
set access_key = 'WR-' || upper(encode(gen_random_bytes(12), 'hex'))
where access_key is null or access_key = '';

alter table if exists public.profiles
  alter column access_key set not null;

create unique index if not exists profiles_access_key_idx on public.profiles (access_key);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider text;
  derived_name text;
  derived_role text := 'viewer';
  derived_roles text[] := array['viewer']::text[];
begin
  provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  if provider not in ('google', 'email') then
    provider := 'unknown';
  end if;

  derived_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  if lower(coalesce(new.email, '')) = 'gerqd79@gmail.com' then
    derived_role := 'admin';
    derived_roles := array['admin', 'reviewer', 'editor', 'contributor', 'viewer']::text[];
  end if;

  insert into public.profiles (id, full_name, email, account_type, auth_provider, role, roles)
  values (new.id, derived_name, new.email, 'free', provider, derived_role, derived_roles)
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        auth_provider = excluded.auth_provider,
        role = case when lower(coalesce(excluded.email, '')) = 'gerqd79@gmail.com' then excluded.role else public.profiles.role end,
        roles = case when lower(coalesce(excluded.email, '')) = 'gerqd79@gmail.com' then excluded.roles else public.profiles.roles end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id then
    new.role := old.role;
    new.roles := old.roles;
    new.account_type := old.account_type;
    new.partner_category := old.partner_category;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_roles_before_update on public.profiles;
create trigger protect_profile_roles_before_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_roles();

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  partner_name text,
  applies_to text not null default 'monthly' check (applies_to in ('monthly', 'annual', 'both')),
  discount_mode text not null default 'override_price' check (discount_mode in ('fixed_amount', 'override_price')),
  discount_amount_cents integer,
  override_price_cents integer,
  discount_months integer not null default 1 check (discount_months > 0),
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  signup_method text not null default 'email' check (signup_method in ('google', 'email', 'unknown')),
  plan_id text not null default 'individual_monthly' check (plan_id in ('individual_monthly', 'clinic_monthly')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  seat_count integer not null default 1 check (seat_count > 0),
  status text not null default 'trialing' check (status in ('trialing', 'pending_payment', 'active', 'expired', 'cancelled')),
  list_price_cents integer not null,
  final_price_cents integer not null,
  currency text not null default 'EUR',
  trial_days integer not null default 10 check (trial_days >= 0),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  discount_code_id uuid references public.discount_codes(id),
  discount_code text,
  discount_months integer,
  discount_amount_cents integer,
  override_price_cents integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  stripe_checkout_session_id text,
  stripe_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  discount_code text not null,
  created_at timestamptz not null default now(),
  unique (user_id, discount_code_id)
);

alter table if exists public.discount_codes
  add column if not exists grant_days integer,
  add column if not exists granted_roles text[] not null default array[]::text[],
  add column if not exists stripe_coupon_id text,
  add column if not exists stripe_promotion_code_id text;

alter table if exists public.user_memberships
  add column if not exists plan_id text not null default 'individual_monthly',
  add column if not exists seat_count integer not null default 1,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.user_memberships
  drop constraint if exists user_memberships_plan_id_check,
  add constraint user_memberships_plan_id_check check (plan_id in ('individual_monthly', 'clinic_monthly')),
  drop constraint if exists user_memberships_seat_count_check,
  add constraint user_memberships_seat_count_check check (seat_count > 0);

create index if not exists user_memberships_status_idx on public.user_memberships (status);
create index if not exists discount_codes_active_idx on public.discount_codes (active, code);
create index if not exists discount_code_redemptions_user_idx on public.discount_code_redemptions (user_id, created_at desc);
create unique index if not exists user_memberships_stripe_customer_id_idx on public.user_memberships (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists user_memberships_stripe_subscription_id_idx on public.user_memberships (stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.clinic_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  invite_code text not null unique default ('CL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  allowed_emails text[] not null default array[]::text[],
  seat_limit integer not null default 1 check (seat_limit > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinic_accounts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  status text not null default 'linked' check (status in ('linked', 'revoked')),
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id),
  unique (clinic_id, email)
);

alter table if exists public.clinic_accounts
  add column if not exists invite_code text,
  add column if not exists allowed_emails text[] not null default array[]::text[],
  add column if not exists seat_limit integer not null default 1,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.clinic_accounts
set invite_code = 'CL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null or invite_code = '';

alter table if exists public.clinic_accounts
  alter column invite_code set not null,
  alter column invite_code set default ('CL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  drop constraint if exists clinic_accounts_seat_limit_check,
  add constraint clinic_accounts_seat_limit_check check (seat_limit > 0);

create unique index if not exists clinic_accounts_invite_code_idx on public.clinic_accounts (invite_code);
create index if not exists clinic_users_user_id_idx on public.clinic_users (user_id);
create index if not exists clinic_users_clinic_id_idx on public.clinic_users (clinic_id);

create or replace function public.normalize_email_array(value text[])
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct lower(trim(item))) filter (where lower(trim(item)) <> ''), array[]::text[])
  from unnest(coalesce(value, array[]::text[])) as item;
$$;

create or replace function public.clinic_has_open_seat(clinic_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select count(*) < max(ca.seat_limit)
      from public.clinic_accounts ca
      left join public.clinic_users cu on cu.clinic_id = ca.id and cu.status = 'linked'
      where ca.id = clinic_id_arg
      group by ca.id
    ),
    false
  );
$$;

create or replace function public.upsert_owned_clinic(p_name text, p_seat_limit integer, p_allowed_emails text[])
returns public.clinic_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.clinic_accounts;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.clinic_accounts (owner_user_id, name, seat_limit, allowed_emails)
  values (
    auth.uid(),
    coalesce(nullif(trim(p_name), ''), 'Clinica'),
    greatest(1, coalesce(p_seat_limit, 1)),
    public.normalize_email_array(p_allowed_emails)
  )
  on conflict (owner_user_id) do update
    set name = excluded.name,
        seat_limit = excluded.seat_limit,
        allowed_emails = excluded.allowed_emails,
        active = true,
        updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.join_clinic_with_code(p_invite_code text)
returns public.clinic_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  target_clinic public.clinic_accounts;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select *
  into target_clinic
  from public.clinic_accounts
  where active = true
    and upper(invite_code) = upper(trim(p_invite_code))
  limit 1;

  if target_clinic.id is null then
    raise exception 'CLINIC_CODE_NOT_FOUND';
  end if;

  if not public.clinic_has_open_seat(target_clinic.id) then
    raise exception 'CLINIC_SEAT_LIMIT_REACHED';
  end if;

  insert into public.clinic_users (clinic_id, user_id, email, status)
  values (target_clinic.id, auth.uid(), current_email, 'linked')
  on conflict (clinic_id, user_id) do update
    set email = excluded.email,
        status = 'linked',
        updated_at = now();

  return target_clinic;
end;
$$;

create or replace function public.join_clinic_by_email()
returns public.clinic_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  target_clinic public.clinic_accounts;
begin
  if auth.uid() is null then
    return null;
  end if;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if current_email = '' then
    return null;
  end if;

  select *
  into target_clinic
  from public.clinic_accounts
  where active = true
    and current_email = any(public.normalize_email_array(allowed_emails))
  order by updated_at desc
  limit 1;

  if target_clinic.id is null or not public.clinic_has_open_seat(target_clinic.id) then
    return null;
  end if;

  insert into public.clinic_users (clinic_id, user_id, email, status)
  values (target_clinic.id, auth.uid(), current_email, 'linked')
  on conflict (clinic_id, user_id) do update
    set email = excluded.email,
        status = 'linked',
        updated_at = now();

  return target_clinic;
end;
$$;

create or replace function public.current_user_owns_clinic(clinic_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_accounts
    where id = clinic_id_arg
      and owner_user_id = auth.uid()
  );
$$;

create or replace function public.current_user_linked_to_clinic(clinic_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_users
    where clinic_id = clinic_id_arg
      and user_id = auth.uid()
      and status = 'linked'
  );
$$;

update public.discount_codes
set code = 'PARTNER1E3M',
    label = 'Partner 3 meses',
    description = 'Codigo promocional partner para acceso mensual bonificado durante 3 meses.',
    updated_at = now()
where code = 'PARTNER1EURO3M'
  and not exists (select 1 from public.discount_codes where code = 'PARTNER1E3M');

insert into public.discount_codes (
  code,
  label,
  description,
  partner_name,
  applies_to,
  discount_mode,
  override_price_cents,
  discount_months,
  active
)
values (
  'PARTNER1E3M',
  'Partner 3 meses',
  'Codigo promocional partner para acceso mensual bonificado durante 3 meses.',
  'Distribuidores partners',
  'monthly',
  'override_price',
  100,
  3,
  true
)
on conflict (code) do nothing;

insert into public.discount_codes (
  code,
  label,
  description,
  partner_name,
  applies_to,
  discount_mode,
  override_price_cents,
  discount_months,
  grant_days,
  active
)
values (
  'WAIRUA7DIAS',
  'Acceso premium 7 dias',
  'Codigo de acceso completo durante 7 dias sin coste.',
  'Invitacion WAIRUA',
  'both',
  'override_price',
  0,
  1,
  7,
  true
)
on conflict (code) do nothing;

insert into public.discount_codes (
  code,
  label,
  description,
  partner_name,
  applies_to,
  discount_mode,
  override_price_cents,
  discount_months,
  grant_days,
  active
)
values (
  'WAIRUA15DIAS',
  'Acceso premium 15 dias',
  'Codigo de acceso completo durante 15 dias sin coste. Despues mantiene solo la parte gratuita salvo que active suscripcion.',
  'Invitacion WAIRUA',
  'both',
  'override_price',
  0,
  1,
  15,
  true
)
on conflict (code) do nothing;

insert into public.discount_codes (
  code,
  label,
  description,
  partner_name,
  applies_to,
  discount_mode,
  override_price_cents,
  discount_months,
  grant_days,
  active
)
values (
  'GTABILBAO2026',
  'GTA Bilbao 2026',
  'Acceso premium 15 dias para asistentes. Despues mantiene la capa gratuita salvo que active suscripcion.',
  'GTA Bilbao 2026',
  'both',
  'override_price',
  0,
  1,
  15,
  true
)
on conflict (code) do nothing;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        case
          when 'admin' = any(coalesce(roles, array[role])) then 'admin'
          when 'reviewer' = any(coalesce(roles, array[role])) then 'reviewer'
          when 'editor' = any(coalesce(roles, array[role])) then 'editor'
          when 'contributor' = any(coalesce(roles, array[role])) then 'contributor'
          else 'viewer'
        end
      from public.profiles
      where id = auth.uid()
    ),
    'viewer'
  );
$$;

alter table public.profiles enable row level security;
alter table public.discount_codes enable row level security;
alter table public.user_memberships enable row level security;
alter table public.discount_code_redemptions enable row level security;
alter table public.clinic_accounts enable row level security;
alter table public.clinic_users enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.current_profile_role() = 'admin');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (
    role in ('viewer', 'contributor', 'editor', 'reviewer', 'admin')
    and roles <@ array['viewer', 'contributor', 'editor', 'reviewer', 'admin']::text[]
    and cardinality(roles) > 0
  );

drop policy if exists "discount_codes_select_active" on public.discount_codes;
create policy "discount_codes_select_active"
  on public.discount_codes
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists "memberships_select_own" on public.user_memberships;
create policy "memberships_select_own"
  on public.user_memberships
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "memberships_select_admin" on public.user_memberships;
create policy "memberships_select_admin"
  on public.user_memberships
  for select
  to authenticated
  using (public.current_profile_role() = 'admin');

drop policy if exists "memberships_insert_own" on public.user_memberships;
create policy "memberships_insert_own"
  on public.user_memberships
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "memberships_update_own" on public.user_memberships;
create policy "memberships_update_own"
  on public.user_memberships
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "discount_code_redemptions_select_own" on public.discount_code_redemptions;
create policy "discount_code_redemptions_select_own"
  on public.discount_code_redemptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "discount_code_redemptions_insert_own" on public.discount_code_redemptions;
create policy "discount_code_redemptions_insert_own"
  on public.discount_code_redemptions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "clinic_accounts_select_owner" on public.clinic_accounts;
create policy "clinic_accounts_select_owner"
  on public.clinic_accounts
  for select
  to authenticated
  using ((select auth.uid()) = owner_user_id);

drop policy if exists "clinic_accounts_select_linked" on public.clinic_accounts;
create policy "clinic_accounts_select_linked"
  on public.clinic_accounts
  for select
  to authenticated
  using (public.current_user_linked_to_clinic(id));

drop policy if exists "clinic_accounts_select_admin" on public.clinic_accounts;
create policy "clinic_accounts_select_admin"
  on public.clinic_accounts
  for select
  to authenticated
  using (public.current_profile_role() = 'admin');

drop policy if exists "clinic_users_select_self" on public.clinic_users;
create policy "clinic_users_select_self"
  on public.clinic_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "clinic_users_select_owner" on public.clinic_users;
create policy "clinic_users_select_owner"
  on public.clinic_users
  for select
  to authenticated
  using (public.current_user_owns_clinic(clinic_id));

drop policy if exists "clinic_users_select_admin" on public.clinic_users;
create policy "clinic_users_select_admin"
  on public.clinic_users
  for select
  to authenticated
  using (public.current_profile_role() = 'admin');

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  year int,
  source text,
  doi_or_url text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.active_ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  active_ingredient text not null,
  summary_es text,
  summary_en text,
  species text[] not null default '{}',
  systems text[] not null default '{}',
  pathologies text[] not null default '{}',
  evidence_level text not null check (evidence_level in ('High', 'Moderate', 'Low', 'Expert Consensus')),
  status text not null default 'draft' check (status in ('draft', 'under_review', 'approved')),
  publication_status text not null default 'pending_activation' check (publication_status in ('pending_activation', 'active', 'rejected')),
  source_provider text default 'manual',
  source_external_id text,
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.active_ingredients
  add column if not exists species text[] not null default '{}',
  add column if not exists systems text[] not null default '{}',
  add column if not exists pathologies text[] not null default '{}',
  add column if not exists publication_status text not null default 'pending_activation';

alter table if exists public.dosing_rules
  add column if not exists category_es text,
  add column if not exists category_en text;

create table if not exists public.active_ingredient_trade_names (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  trade_name text not null,
  unique (active_ingredient_id, trade_name)
);

create table if not exists public.active_ingredient_tags (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  tag_name text not null,
  tag_group text not null check (tag_group in ('specialty', 'therapeutic_class', 'custom')),
  unique (active_ingredient_id, tag_name)
);

create table if not exists public.active_ingredient_concentrations (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  label text not null,
  strength_value numeric,
  strength_unit text,
  mg_per_ml numeric,
  mg_per_tablet numeric,
  notes text
);

create table if not exists public.active_ingredient_notes (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  field_name text not null check (field_name in ('indications', 'administration_conditions', 'adverse_effects', 'contraindications', 'interactions', 'clinical_notes')),
  locale text not null check (locale in ('es', 'en')),
  body text not null,
  unique (active_ingredient_id, field_name, locale)
);

create table if not exists public.active_ingredient_reviews (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  approved boolean not null default true,
  approval_level integer not null default 1 check (approval_level between 1 and 3),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (active_ingredient_id, reviewer_id)
);

create table if not exists public.dosing_rules (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  species text not null,
  indication text not null,
  route text not null,
  category_es text,
  category_en text,
  dose_min numeric,
  dose_max numeric,
  dose_default numeric,
  dose_unit text not null default 'mg/kg',
  frequency_text text,
  administration_conditions text,
  adverse_effects text,
  contraindications text,
  monitoring_notes text,
  calculator_enabled boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'under_review', 'approved')),
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dosing_rule_presentations (
  id uuid primary key default gen_random_uuid(),
  dosing_rule_id uuid not null references public.dosing_rules(id) on delete cascade,
  label text not null,
  mg_per_ml numeric,
  mg_per_tablet numeric,
  notes text
);

create table if not exists public.active_ingredient_references (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  reference_id uuid not null references public.references(id) on delete cascade,
  scope text not null default 'record' check (scope in ('record', 'indication', 'species', 'general_note')),
  scope_label text not null default '',
  unique (active_ingredient_id, reference_id, scope, scope_label)
);

create table if not exists public.dosing_rule_references (
  id uuid primary key default gen_random_uuid(),
  dosing_rule_id uuid not null references public.dosing_rules(id) on delete cascade,
  reference_id uuid not null references public.references(id) on delete cascade,
  rationale text,
  unique (dosing_rule_id, reference_id)
);

create table if not exists public.active_ingredient_revisions (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredients(id) on delete cascade,
  editor_id uuid references public.profiles(id),
  change_summary text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_diets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand_name text not null,
  diet_name text not null,
  species text[] not null default '{}',
  health_conditions text[] not null default '{}',
  format text not null default 'dry' check (format in ('dry', 'wet', 'mixed')),
  summary_es text,
  summary_en text,
  composition_es text,
  composition_en text,
  indications_es text,
  indications_en text,
  contraindications_es text,
  contraindications_en text,
  technical_sheet_es text,
  technical_sheet_en text,
  energy_kcal_per_100g numeric,
  protein_percent_dm numeric,
  fat_percent_dm numeric,
  fiber_percent_dm numeric,
  carbohydrate_percent_dm numeric,
  phosphorus_percent_dm numeric,
  sodium_percent_dm numeric,
  omega3_percent_dm numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_diet_presentations (
  id uuid primary key default gen_random_uuid(),
  clinical_diet_id uuid not null references public.clinical_diets(id) on delete cascade,
  label text not null,
  format text not null default 'dry' check (format in ('dry', 'wet', 'mixed')),
  package_size_g numeric not null,
  target text not null default 'general' check (target in ('general', 'small_breed', 'wet'))
);

create table if not exists public.clinical_diet_feeding_guides (
  id uuid primary key default gen_random_uuid(),
  clinical_diet_id uuid not null references public.clinical_diets(id) on delete cascade,
  species text not null,
  body_weight_kg numeric not null,
  daily_amount_g numeric not null,
  daily_amount_label text,
  notes text
);

create table if not exists public.food_ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  food_name text not null,
  category text not null,
  preparation text not null,
  species text[] not null default '{}',
  notes_es text,
  notes_en text,
  energy_kcal_per_100g numeric not null default 0,
  protein_g_per_100g numeric not null default 0,
  fat_g_per_100g numeric not null default 0,
  carbohydrate_g_per_100g numeric not null default 0,
  fiber_g_per_100g numeric not null default 0,
  calcium_mg_per_100g numeric not null default 0,
  phosphorus_mg_per_100g numeric not null default 0,
  sodium_mg_per_100g numeric not null default 0,
  potassium_mg_per_100g numeric not null default 0,
  magnesium_mg_per_100g numeric not null default 0,
  zinc_mg_per_100g numeric not null default 0,
  taurine_mg_per_100g numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinical_diets_species_idx on public.clinical_diets using gin (species);
create index if not exists clinical_diets_health_conditions_idx on public.clinical_diets using gin (health_conditions);
create index if not exists food_ingredients_species_idx on public.food_ingredients using gin (species);

alter table public.active_ingredients enable row level security;
alter table public.active_ingredient_trade_names enable row level security;
alter table public.active_ingredient_tags enable row level security;
alter table public.active_ingredient_concentrations enable row level security;
alter table public.active_ingredient_notes enable row level security;
alter table public.dosing_rules enable row level security;
alter table public.dosing_rule_presentations enable row level security;
alter table public.active_ingredient_references enable row level security;
alter table public.dosing_rule_references enable row level security;
alter table public.active_ingredient_revisions enable row level security;
alter table public.active_ingredient_reviews enable row level security;

drop policy if exists "active_ingredients_select_authenticated" on public.active_ingredients;
create policy "active_ingredients_select_authenticated"
  on public.active_ingredients
  for select
  to authenticated
  using (publication_status = 'active' or public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredients_manage_editors" on public.active_ingredients;
create policy "active_ingredients_manage_editors"
  on public.active_ingredients
  for all
  to authenticated
  using (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_trade_names_select_authenticated" on public.active_ingredient_trade_names;
create policy "active_ingredient_trade_names_select_authenticated"
  on public.active_ingredient_trade_names
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_trade_names_manage_editors" on public.active_ingredient_trade_names;
create policy "active_ingredient_trade_names_manage_editors"
  on public.active_ingredient_trade_names
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_tags_select_authenticated" on public.active_ingredient_tags;
create policy "active_ingredient_tags_select_authenticated"
  on public.active_ingredient_tags
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_tags_manage_editors" on public.active_ingredient_tags;
create policy "active_ingredient_tags_manage_editors"
  on public.active_ingredient_tags
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_concentrations_select_authenticated" on public.active_ingredient_concentrations;
create policy "active_ingredient_concentrations_select_authenticated"
  on public.active_ingredient_concentrations
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_concentrations_manage_editors" on public.active_ingredient_concentrations;
create policy "active_ingredient_concentrations_manage_editors"
  on public.active_ingredient_concentrations
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_notes_select_authenticated" on public.active_ingredient_notes;
create policy "active_ingredient_notes_select_authenticated"
  on public.active_ingredient_notes
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_notes_manage_editors" on public.active_ingredient_notes;
create policy "active_ingredient_notes_manage_editors"
  on public.active_ingredient_notes
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "dosing_rules_select_authenticated" on public.dosing_rules;
create policy "dosing_rules_select_authenticated"
  on public.dosing_rules
  for select
  to authenticated
  using (true);

drop policy if exists "dosing_rules_manage_editors" on public.dosing_rules;
create policy "dosing_rules_manage_editors"
  on public.dosing_rules
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "dosing_rule_presentations_select_authenticated" on public.dosing_rule_presentations;
create policy "dosing_rule_presentations_select_authenticated"
  on public.dosing_rule_presentations
  for select
  to authenticated
  using (true);

drop policy if exists "dosing_rule_presentations_manage_editors" on public.dosing_rule_presentations;
create policy "dosing_rule_presentations_manage_editors"
  on public.dosing_rule_presentations
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_references_select_authenticated" on public.active_ingredient_references;
create policy "active_ingredient_references_select_authenticated"
  on public.active_ingredient_references
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_references_manage_editors" on public.active_ingredient_references;
create policy "active_ingredient_references_manage_editors"
  on public.active_ingredient_references
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "dosing_rule_references_select_authenticated" on public.dosing_rule_references;
create policy "dosing_rule_references_select_authenticated"
  on public.dosing_rule_references
  for select
  to authenticated
  using (true);

drop policy if exists "dosing_rule_references_manage_editors" on public.dosing_rule_references;
create policy "dosing_rule_references_manage_editors"
  on public.dosing_rule_references
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('contributor', 'editor', 'reviewer', 'admin'));

drop policy if exists "active_ingredient_reviews_select_authenticated" on public.active_ingredient_reviews;
create policy "active_ingredient_reviews_select_authenticated"
  on public.active_ingredient_reviews
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_reviews_manage_reviewers" on public.active_ingredient_reviews;
create policy "active_ingredient_reviews_manage_reviewers"
  on public.active_ingredient_reviews
  for all
  to authenticated
  using (public.current_profile_role() in ('reviewer', 'admin'))
  with check (public.current_profile_role() in ('reviewer', 'admin'));

drop policy if exists "active_ingredient_revisions_select_authenticated" on public.active_ingredient_revisions;
create policy "active_ingredient_revisions_select_authenticated"
  on public.active_ingredient_revisions
  for select
  to authenticated
  using (true);

drop policy if exists "active_ingredient_revisions_manage_editors" on public.active_ingredient_revisions;
create policy "active_ingredient_revisions_manage_editors"
  on public.active_ingredient_revisions
  for all
  to authenticated
  using (public.current_profile_role() in ('editor', 'reviewer', 'admin'))
  with check (public.current_profile_role() in ('editor', 'reviewer', 'admin'));
