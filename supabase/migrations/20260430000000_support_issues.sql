create table if not exists public.support_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  issue_type text not null,
  module text,
  description text not null,
  page_url text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_issues enable row level security;

drop policy if exists "support_issues_insert_authenticated" on public.support_issues;
create policy "support_issues_insert_authenticated"
  on public.support_issues
  for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "support_issues_select_own_or_admin" on public.support_issues;
create policy "support_issues_select_own_or_admin"
  on public.support_issues
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'admin' = any(profiles.roles)
    )
  );

drop policy if exists "support_issues_update_admin" on public.support_issues;
create policy "support_issues_update_admin"
  on public.support_issues
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'admin' = any(profiles.roles)
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'admin' = any(profiles.roles)
    )
  );
