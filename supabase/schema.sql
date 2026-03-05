-- Base schema proposal for collaborative therapeutic guide

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'reviewer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text not null,
  year int not null,
  source text not null,
  doi_or_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.therapeutic_entries (
  id uuid primary key default gen_random_uuid(),
  active_ingredient text not null,
  trade_names text[] not null,
  species text[] not null,
  systems text[] not null,
  pathologies text[] not null,
  indications text not null,
  dosage text not null,
  contraindications text not null,
  notes text,
  evidence_level text not null check (evidence_level in ('High', 'Moderate', 'Low', 'Expert Consensus')),
  status text not null default 'draft' check (status in ('draft', 'under_review', 'approved')),
  source_provider text default 'manual',
  source_external_id text,
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entry_references (
  entry_id uuid not null references public.therapeutic_entries(id) on delete cascade,
  reference_id uuid not null references public.references(id) on delete cascade,
  primary key (entry_id, reference_id)
);

create table if not exists public.entry_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.therapeutic_entries(id) on delete cascade,
  editor_id uuid references public.profiles(id),
  change_summary text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
