-- Collaborative editorial schema for WAIRUA VetAI
-- Focus: active ingredients, dosing rules by species/route/indication, references, tags, and review workflow.

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
  add column if not exists pathologies text[] not null default '{}';

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
  field_name text not null check (field_name in ('indications', 'administration_conditions', 'adverse_effects', 'contraindications', 'clinical_notes')),
  locale text not null check (locale in ('es', 'en')),
  body text not null,
  unique (active_ingredient_id, field_name, locale)
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
