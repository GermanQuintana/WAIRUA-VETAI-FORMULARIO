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

alter table public.clinic_accounts enable row level security;
alter table public.clinic_users enable row level security;

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
