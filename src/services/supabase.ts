import {
  createClient,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { specialtyTags, therapeuticClassTags } from '../data/taxonomy';
import { excludeEquivalentValues, normalizeStringList } from '../lib/entryNormalization';
import {
  AdminDirectoryProfile,
  AccountType,
  AuthAccountSnapshot,
  AuthProvider,
  DiscountCodeRecord,
  DoseCalculatorPreset,
  EntryReviewSummary,
  MembershipSelection,
  MembershipPlanId,
  PartnerCategory,
  ReportVisibilityField,
  ScientificReference,
  TherapeuticEntry,
  UserMembership,
  UserProfile,
  UserRole,
} from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const MEMBERSHIP_PENDING_STORAGE_KEY = 'wairua.pending-membership-selection';
const TRIAL_DAYS = 10;
const ADMIN_EMAILS = new Set(['gerqd79@gmail.com']);
const DISCOUNT_CODE_ALREADY_USED_ERROR = 'DISCOUNT_CODE_ALREADY_USED';

const isPlaceholder = (value: string) => !value || value.includes('your-project') || value.includes('anon_key');

const inferTagGroup = (tag: string) => {
  if (specialtyTags.includes(tag as (typeof specialtyTags)[number])) return 'specialty';
  if (therapeuticClassTags.includes(tag as (typeof therapeuticClassTags)[number])) return 'therapeutic_class';
  return 'custom';
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const uniq = <T,>(values: T[]) => Array.from(new Set(values));
let cachedClient: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cachedClient;
};

const getAuthProvider = (user?: User | null): AuthProvider => {
  const provider = user?.app_metadata?.provider ?? user?.identities?.[0]?.provider ?? 'unknown';
  if (provider === 'google' || provider === 'email') return provider;
  return 'unknown';
};

const getFunctionErrorMessage = async (error: unknown, fallback: string) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        return payload.error;
      }
      if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
        return payload.message;
      }
      return JSON.stringify(payload);
    } catch {
      try {
        return await error.context.text();
      } catch {
        return error.message || fallback;
      }
    }
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const getUserDisplayName = (user?: User | null) =>
  user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '';

const rolePriority: UserRole[] = ['admin', 'reviewer', 'editor', 'contributor', 'viewer'];
const adminRoles: UserRole[] = ['admin', 'reviewer', 'editor', 'contributor', 'viewer'];
const isAdminEmail = (value?: string | null) => Boolean(value && ADMIN_EMAILS.has(value.trim().toLowerCase()));

const normalizeRoles = (value: unknown): UserRole[] => {
  const rawRoles = Array.isArray(value) ? value.map((item) => String(item)) : [];
  const roles = rawRoles.filter((role): role is UserRole => rolePriority.includes(role as UserRole));
  if (roles.length === 0) return ['viewer'];
  return Array.from(new Set(roles)).sort((left, right) => rolePriority.indexOf(left) - rolePriority.indexOf(right));
};

const getEffectiveRole = (roles: UserRole[], fallback?: unknown): UserRole => {
  const normalizedFallback = String(fallback ?? 'viewer') as UserRole;
  return roles[0] ?? (rolePriority.includes(normalizedFallback) ? normalizedFallback : 'viewer');
};

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];

const accountTypes: AccountType[] = ['free', 'premium', 'company', 'partner'];
const partnerCategories: PartnerCategory[] = ['scientific', 'training', 'strategic', 'commercial'];
const membershipPlanIds: MembershipPlanId[] = [
  'individual_monthly',
  'clinic_monthly',
];

const normalizeAccountType = (value: unknown): AccountType => {
  const accountType = typeof value === 'string' ? value : '';
  return accountTypes.includes(accountType as AccountType) ? (accountType as AccountType) : 'free';
};

const normalizePartnerCategory = (value: unknown): PartnerCategory | undefined => {
  const partnerCategory = typeof value === 'string' ? value : '';
  return partnerCategories.includes(partnerCategory as PartnerCategory) ? (partnerCategory as PartnerCategory) : undefined;
};

const normalizeMembershipPlanId = (value: unknown, billingCycle?: unknown): MembershipPlanId => {
  const planId = typeof value === 'string' ? value : '';
  if (membershipPlanIds.includes(planId as MembershipPlanId)) return planId as MembershipPlanId;
  return billingCycle === 'annual' ? 'individual_monthly' : 'individual_monthly';
};

const reportVisibilityFields: ReportVisibilityField[] = [
  'full_name',
  'national_id',
  'license',
  'workplace',
  'center_fiscal_name',
  'center_tax_id',
  'center_type',
  'professional_email',
  'private_email',
  'websites',
  'social_profiles',
  'phone_mobile',
];

const normalizeReportVisibilityFields = (value: unknown): ReportVisibilityField[] =>
  normalizeStringArray(value).filter((item): item is ReportVisibilityField => reportVisibilityFields.includes(item as ReportVisibilityField));

const mapProfileRow = (row: Record<string, unknown>): UserProfile => ({
  id: String(row.id),
  fullName: String(row.full_name ?? ''),
  email: typeof row.email === 'string' ? row.email : undefined,
  accessKey: typeof row.access_key === 'string' ? row.access_key : undefined,
  accountType: normalizeAccountType(row.account_type),
  partnerCategory: normalizePartnerCategory(row.partner_category),
  nationalId: typeof row.national_id === 'string' ? row.national_id : undefined,
  licenseNumber: typeof row.license_number === 'string' ? row.license_number : undefined,
  licenseProvince: typeof row.license_province === 'string' ? row.license_province : undefined,
  workplaceName: typeof row.workplace_name === 'string' ? row.workplace_name : undefined,
  centerFiscalName: typeof row.center_fiscal_name === 'string' ? row.center_fiscal_name : undefined,
  centerTaxId: typeof row.center_tax_id === 'string' ? row.center_tax_id : undefined,
  centerType: typeof row.center_type === 'string' ? row.center_type : undefined,
  professionalEmail: typeof row.professional_email === 'string' ? row.professional_email : undefined,
  privateEmail: typeof row.private_email === 'string' ? row.private_email : undefined,
  websites: normalizeStringArray(row.websites),
  instagramUrl: typeof row.instagram_url === 'string' ? row.instagram_url : undefined,
  tiktokUrl: typeof row.tiktok_url === 'string' ? row.tiktok_url : undefined,
  youtubeUrl: typeof row.youtube_url === 'string' ? row.youtube_url : undefined,
  facebookUrl: typeof row.facebook_url === 'string' ? row.facebook_url : undefined,
  linkedinUrl: typeof row.linkedin_url === 'string' ? row.linkedin_url : undefined,
  phoneMobile: typeof row.phone_mobile === 'string' ? row.phone_mobile : undefined,
  reportVisibleFields: normalizeReportVisibilityFields(row.report_visible_fields),
  roles: normalizeRoles(row.roles ?? row.role),
  role: getEffectiveRole(normalizeRoles(row.roles ?? row.role), row.role),
  authProvider: String(row.auth_provider ?? 'unknown') as AuthProvider,
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapMembershipRow = (row: Record<string, unknown>): UserMembership => ({
  id: String(row.id),
  userId: String(row.user_id),
  signupMethod: String(row.signup_method ?? 'unknown') as AuthProvider,
  planId: normalizeMembershipPlanId(row.plan_id, row.billing_cycle),
  billingCycle: String(row.billing_cycle) as UserMembership['billingCycle'],
  seatCount: typeof row.seat_count === 'number' ? row.seat_count : undefined,
  status: String(row.status ?? 'trialing') as UserMembership['status'],
  listPriceCents: Number(row.list_price_cents ?? 0),
  finalPriceCents: Number(row.final_price_cents ?? 0),
  currency: String(row.currency ?? 'EUR'),
  trialDays: Number(row.trial_days ?? TRIAL_DAYS),
  trialStartedAt: typeof row.trial_started_at === 'string' ? row.trial_started_at : undefined,
  trialEndsAt: typeof row.trial_ends_at === 'string' ? row.trial_ends_at : undefined,
  discountCode: typeof row.discount_code === 'string' ? row.discount_code : undefined,
  discountCodeId: typeof row.discount_code_id === 'string' ? row.discount_code_id : undefined,
  discountMonths: typeof row.discount_months === 'number' ? row.discount_months : undefined,
  discountAmountCents: typeof row.discount_amount_cents === 'number' ? row.discount_amount_cents : undefined,
  overridePriceCents: typeof row.override_price_cents === 'number' ? row.override_price_cents : undefined,
  stripeCustomerId: typeof row.stripe_customer_id === 'string' ? row.stripe_customer_id : undefined,
  stripeSubscriptionId: typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : undefined,
  stripePriceId: typeof row.stripe_price_id === 'string' ? row.stripe_price_id : undefined,
  stripeCheckoutSessionId: typeof row.stripe_checkout_session_id === 'string' ? row.stripe_checkout_session_id : undefined,
  stripeStatus: typeof row.stripe_status === 'string' ? row.stripe_status : undefined,
  currentPeriodEnd: typeof row.current_period_end === 'string' ? row.current_period_end : undefined,
  cancelAtPeriodEnd: typeof row.cancel_at_period_end === 'boolean' ? row.cancel_at_period_end : undefined,
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapDiscountCodeRow = (row: Record<string, unknown>): DiscountCodeRecord => ({
  id: String(row.id),
  code: String(row.code),
  label: String(row.label),
  description: typeof row.description === 'string' ? row.description : undefined,
  partnerName: typeof row.partner_name === 'string' ? row.partner_name : undefined,
  appliesTo: String(row.applies_to ?? 'monthly') as DiscountCodeRecord['appliesTo'],
  discountMode: String(row.discount_mode ?? 'override_price') as DiscountCodeRecord['discountMode'],
  discountAmountCents: typeof row.discount_amount_cents === 'number' ? row.discount_amount_cents : undefined,
  overridePriceCents: typeof row.override_price_cents === 'number' ? row.override_price_cents : undefined,
  discountMonths: Number(row.discount_months ?? 1),
  grantDays: typeof row.grant_days === 'number' ? row.grant_days : undefined,
  grantedRoles: normalizeRoles(row.granted_roles),
  stripeCouponId: typeof row.stripe_coupon_id === 'string' ? row.stripe_coupon_id : undefined,
  stripePromotionCodeId: typeof row.stripe_promotion_code_id === 'string' ? row.stripe_promotion_code_id : undefined,
  active: Boolean(row.active),
});

const mapReviewSummary = (
  rows: Array<{ reviewer_id?: string; approved?: boolean; approval_level?: number; review_note?: string }>,
  currentUserId?: string,
): EntryReviewSummary => {
  const approvedRows = rows.filter((row) => row.approved);
  const currentUserReview = currentUserId ? rows.find((row) => row.reviewer_id === currentUserId) : undefined;

  return {
    approvalCount: approvedRows.length,
    approvalScore: approvedRows.reduce((total, row) => total + Number(row.approval_level ?? 0), 0),
    currentUserApproved: currentUserReview?.approved,
    currentUserApprovalLevel: typeof currentUserReview?.approval_level === 'number' ? currentUserReview.approval_level : undefined,
    currentUserNote: typeof currentUserReview?.review_note === 'string' ? currentUserReview.review_note : undefined,
  };
};

const formatDoseLine = (rule: Record<string, unknown>, locale: 'es' | 'en') => {
  const species = String(rule.species ?? '');
  const route = String(rule.route ?? '');
  const min = rule.dose_min;
  const max = rule.dose_max;
  const doseUnit = String(rule.dose_unit ?? 'mg/kg');
  const frequency = String(rule.frequency_text ?? '');

  const doseText = min === max || max === null || max === undefined ? `${min} ${doseUnit}` : `${min}-${max} ${doseUnit}`;
  if (locale === 'es') return `${species}: ${doseText} ${route}${frequency ? ` ${frequency}` : ''}`.trim();
  return `${species}: ${doseText} ${route}${frequency ? ` ${frequency}` : ''}`.trim();
};

const noteBody = (notes: Array<{ field_name: string; locale: 'es' | 'en'; body: string }>, field: string, locale: 'es' | 'en') =>
  notes.find((item) => item.field_name === field && item.locale === locale)?.body ?? '';

const mapReferences = (
  rows: Array<{
    scope?: string;
    scope_label?: string;
    references?: { id?: string; title?: string; authors?: string; year?: number; source?: string; doi_or_url?: string } | null;
  }>,
) => {
  return rows
    .map((item, index) => {
      const reference = item.references;
      if (!reference?.title) return null;
      return {
        id: reference.id ?? `reference-${index}`,
        title: reference.title,
        authors: reference.authors ?? '',
        year: reference.year ?? new Date().getFullYear(),
        source: reference.source ?? 'WAIRUA VetAI',
        url: reference.doi_or_url ?? undefined,
        scope: item.scope ?? 'record',
        scopeLabel: item.scope_label ?? '',
      };
    })
    .filter(Boolean) as Array<ScientificReference & { scope: string; scopeLabel: string }>;
};

const mapRuleToPreset = (
  rule: Record<string, unknown>,
  references: Array<ScientificReference & { scope: string; scopeLabel: string }>,
): DoseCalculatorPreset | null => {
  if (!rule.calculator_enabled) return null;
  const presentations = Array.isArray(rule.dosing_rule_presentations)
    ? (rule.dosing_rule_presentations as Array<Record<string, unknown>>)
    : [];
  const presentation = presentations[0] ?? {};

  return {
    id: String(rule.id),
    category: { es: String(rule.category_es ?? 'General'), en: String(rule.category_en ?? 'General') },
    species: [String(rule.species) as TherapeuticEntry['species'][number]],
    route: String(rule.route ?? ''),
    indication: {
      es: String(rule.indication ?? ''),
      en: String(rule.indication ?? ''),
    },
    doseRangeMgKg: {
      min: Number(rule.dose_min ?? 0),
      max: Number(rule.dose_max ?? rule.dose_min ?? 0),
    },
    defaultDoseMgKg: Number(rule.dose_default ?? rule.dose_min ?? 0),
    concentration: {
      es: String(presentation.label ?? ''),
      en: String(presentation.label ?? ''),
      mgPerMl: presentation.mg_per_ml ? Number(presentation.mg_per_ml) : undefined,
      mgPerTablet: presentation.mg_per_tablet ? Number(presentation.mg_per_tablet) : undefined,
    },
    references: references
      .filter((reference) => reference.scope === 'dosing_rule' && reference.scopeLabel === String(rule.id))
      .map(({ scope: _scope, scopeLabel: _scopeLabel, ...reference }) => reference),
  };
};

const mapActiveIngredientRecord = (row: Record<string, unknown>): TherapeuticEntry => {
  const notes = (Array.isArray(row.active_ingredient_notes) ? row.active_ingredient_notes : []) as Array<{
    field_name: string;
    locale: 'es' | 'en';
    body: string;
  }>;
  const referenceRows = mapReferences(
    (row.active_ingredient_references as Array<{
      scope?: string;
      scope_label?: string;
      references?: ScientificReference | null;
    }> | undefined) ?? [],
  );
  const dosingRules = (Array.isArray(row.dosing_rules) ? row.dosing_rules : []) as Array<Record<string, unknown>>;
  const speciesFromRules = uniq(dosingRules.map((rule) => String(rule.species)).filter(Boolean));
  const pathologiesFromRules = normalizeStringList(dosingRules.map((rule) => String(rule.indication)).filter(Boolean));
  const reviewRows = (Array.isArray(row.active_ingredient_reviews) ? row.active_ingredient_reviews : []) as Array<{
    reviewer_id?: string;
    approved?: boolean;
    approval_level?: number;
    review_note?: string;
  }>;
  const systems = normalizeStringList((row.systems as string[] | null) ?? []);
  const tags = excludeEquivalentValues(
    normalizeStringList(((row.active_ingredient_tags as Array<{ tag_name: string }> | undefined) ?? []).map((item) => item.tag_name)),
    systems,
  );
  const pathologies = normalizeStringList(((row.pathologies as string[] | null) ?? pathologiesFromRules) ?? []);
  const tradeNames = normalizeStringList(
    ((row.active_ingredient_trade_names as Array<{ trade_name: string }> | undefined) ?? []).map((item) => item.trade_name),
  );
  const concentrations = normalizeStringList(
    ((row.active_ingredient_concentrations as Array<{ label: string }> | undefined) ?? []).map((item) => item.label),
  );

  return {
    id: String(row.id),
    activeIngredient: String(row.active_ingredient),
    tradeNames,
    species: (((row.species as string[] | null) ?? speciesFromRules) as TherapeuticEntry['species']),
    tags,
    systems,
    pathologies,
    concentrations,
    indications: {
      es: noteBody(notes, 'indications', 'es'),
      en: noteBody(notes, 'indications', 'en'),
    },
    dosage: {
      es: dosingRules.map((rule) => formatDoseLine(rule, 'es')).join('\n'),
      en: dosingRules.map((rule) => formatDoseLine(rule, 'en')).join('\n'),
    },
    administrationConditions: {
      es: noteBody(notes, 'administration_conditions', 'es'),
      en: noteBody(notes, 'administration_conditions', 'en'),
    },
    adverseEffects: {
      es: noteBody(notes, 'adverse_effects', 'es'),
      en: noteBody(notes, 'adverse_effects', 'en'),
    },
    contraindications: {
      es: noteBody(notes, 'contraindications', 'es'),
      en: noteBody(notes, 'contraindications', 'en'),
    },
    interactions: {
      es: noteBody(notes, 'interactions', 'es'),
      en: noteBody(notes, 'interactions', 'en'),
    },
    notes: noteBody(notes, 'clinical_notes', 'es') || noteBody(notes, 'clinical_notes', 'en')
      ? {
          es: noteBody(notes, 'clinical_notes', 'es'),
          en: noteBody(notes, 'clinical_notes', 'en'),
        }
      : undefined,
    evidenceLevel: String(row.evidence_level) as TherapeuticEntry['evidenceLevel'],
    editorialStatus: String(row.status ?? 'draft') as TherapeuticEntry['editorialStatus'],
    publicationStatus: String(row.publication_status ?? 'active') as TherapeuticEntry['publicationStatus'],
    reviewSummary: mapReviewSummary(reviewRows),
    calculatorPresets: dosingRules.map((rule) => mapRuleToPreset(rule, referenceRows)).filter(Boolean) as DoseCalculatorPreset[],
    references: referenceRows
      .filter((reference) => reference.scope !== 'dosing_rule')
      .map(({ scope: _scope, scopeLabel: _scopeLabel, ...reference }) => reference),
    createdById: typeof row.created_by === 'string' ? row.created_by : undefined,
    reviewedById: typeof row.reviewed_by === 'string' ? row.reviewed_by : undefined,
    lastUpdated: String(row.updated_at ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
  };
};

const activeIngredientSelect = `
  id,
  active_ingredient,
  species,
  systems,
  pathologies,
  evidence_level,
  status,
  publication_status,
  created_by,
  reviewed_by,
  updated_at,
  active_ingredient_trade_names ( trade_name ),
  active_ingredient_tags ( tag_name ),
  active_ingredient_concentrations ( label ),
  active_ingredient_notes ( field_name, locale, body ),
  active_ingredient_reviews ( reviewer_id, approved, approval_level, review_note ),
  dosing_rules (
    id,
    species,
    indication,
    route,
    category_es,
    category_en,
    dose_min,
    dose_max,
    dose_default,
    dose_unit,
    frequency_text,
    calculator_enabled,
    dosing_rule_presentations ( label, mg_per_ml, mg_per_tablet )
  ),
  active_ingredient_references (
    scope,
    scope_label,
    references ( id, title, authors, year, source, doi_or_url )
  )
`;

class SupabaseEditorialService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getTherapeuticEntryById(id: string) {
    const { data, error } = await this.client
      .from('active_ingredients')
      .select(activeIngredientSelect)
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapActiveIngredientRecord(data as Record<string, unknown>);
  }

  private buildNoteRows(entry: TherapeuticEntry, activeIngredientId: string) {
    return [
      { field_name: 'indications', locale: 'es', body: entry.indications.es },
      { field_name: 'indications', locale: 'en', body: entry.indications.en },
      { field_name: 'administration_conditions', locale: 'es', body: entry.administrationConditions.es },
      { field_name: 'administration_conditions', locale: 'en', body: entry.administrationConditions.en },
      { field_name: 'adverse_effects', locale: 'es', body: entry.adverseEffects.es },
      { field_name: 'adverse_effects', locale: 'en', body: entry.adverseEffects.en },
      { field_name: 'contraindications', locale: 'es', body: entry.contraindications.es },
      { field_name: 'contraindications', locale: 'en', body: entry.contraindications.en },
      { field_name: 'interactions', locale: 'es', body: entry.interactions.es },
      { field_name: 'interactions', locale: 'en', body: entry.interactions.en },
      ...(entry.notes
        ? [
            { field_name: 'clinical_notes', locale: 'es', body: entry.notes.es },
            { field_name: 'clinical_notes', locale: 'en', body: entry.notes.en },
          ]
        : []),
    ]
      .filter((item) => item.body?.trim())
      .map((item) => ({ ...item, active_ingredient_id: activeIngredientId }));
  }

  private async replaceRelatedRows(activeIngredientId: string, entry: TherapeuticEntry) {
    const deleteOps = [
      this.client.from('active_ingredient_trade_names').delete().eq('active_ingredient_id', activeIngredientId),
      this.client.from('active_ingredient_tags').delete().eq('active_ingredient_id', activeIngredientId),
      this.client.from('active_ingredient_concentrations').delete().eq('active_ingredient_id', activeIngredientId),
      this.client.from('active_ingredient_notes').delete().eq('active_ingredient_id', activeIngredientId),
      this.client.from('active_ingredient_references').delete().eq('active_ingredient_id', activeIngredientId),
      this.client.from('dosing_rules').delete().eq('active_ingredient_id', activeIngredientId),
    ];

    for (const operation of deleteOps) {
      const { error } = await operation;
      if (error) throw error;
    }

    if (entry.tradeNames.length) {
      const { error } = await this.client
        .from('active_ingredient_trade_names')
        .insert(entry.tradeNames.map((tradeName) => ({ active_ingredient_id: activeIngredientId, trade_name: tradeName })));
      if (error) throw error;
    }

    if (entry.tags.length) {
      const { error } = await this.client.from('active_ingredient_tags').insert(
        entry.tags.map((tag) => ({
          active_ingredient_id: activeIngredientId,
          tag_name: tag,
          tag_group: inferTagGroup(tag),
        })),
      );
      if (error) throw error;
    }

    if (entry.concentrations.length) {
      const { error } = await this.client.from('active_ingredient_concentrations').insert(
        entry.concentrations.map((label) => ({
          active_ingredient_id: activeIngredientId,
          label,
        })),
      );
      if (error) throw error;
    }

    const noteRows = this.buildNoteRows(entry, activeIngredientId);
    if (noteRows.length) {
      const { error } = await this.client.from('active_ingredient_notes').insert(noteRows);
      if (error) throw error;
    }

    for (const preset of entry.calculatorPresets ?? []) {
      const { data: rule, error: ruleError } = await this.client
        .from('dosing_rules')
        .insert({
          active_ingredient_id: activeIngredientId,
          species: preset.species[0],
          indication: preset.indication.es,
          route: preset.route,
          category_es: preset.category.es,
          category_en: preset.category.en,
          dose_min: preset.doseRangeMgKg.min,
          dose_max: preset.doseRangeMgKg.max,
          dose_default: preset.defaultDoseMgKg,
          dose_unit: 'mg/kg',
          frequency_text: null,
          administration_conditions: entry.administrationConditions.es,
          adverse_effects: entry.adverseEffects.es,
          contraindications: entry.contraindications.es,
          calculator_enabled: true,
        })
        .select('id')
        .single();

      if (ruleError) throw ruleError;

      const label = preset.concentration.es || preset.concentration.en;
      if (label) {
        const { error } = await this.client.from('dosing_rule_presentations').insert({
          dosing_rule_id: rule.id,
          label,
          mg_per_ml: preset.concentration.mgPerMl,
          mg_per_tablet: preset.concentration.mgPerTablet,
        });
        if (error) throw error;
      }

      for (const reference of (preset.references ?? []).filter((item) => item.title || item.url)) {
        const { data: ref, error: refError } = await this.client
          .from('references')
          .insert({
            title: reference.title,
            authors: reference.authors,
            year: reference.year,
            source: reference.source,
            doi_or_url: reference.url,
          })
          .select('id')
          .single();
        if (refError) throw refError;

        const { error: linkError } = await this.client.from('active_ingredient_references').insert({
          active_ingredient_id: activeIngredientId,
          reference_id: ref.id,
          scope: 'dosing_rule',
          scope_label: rule.id,
        });
        if (linkError) throw linkError;
      }
    }

    for (const reference of entry.references.filter((item) => item.title || item.url)) {
      const { data: ref, error: refError } = await this.client
        .from('references')
        .insert({
          title: reference.title,
          authors: reference.authors,
          year: reference.year,
          source: reference.source,
          doi_or_url: reference.url,
        })
        .select('id')
        .single();
      if (refError) throw refError;

      const { error: linkError } = await this.client.from('active_ingredient_references').insert({
        active_ingredient_id: activeIngredientId,
        reference_id: ref.id,
        scope: 'record',
        scope_label: '',
      });
      if (linkError) throw linkError;
    }
  }

  async listTherapeuticEntries() {
    const { data, error } = await this.client.from('active_ingredients').select(activeIngredientSelect).order('updated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapActiveIngredientRecord);
  }

  async createTherapeuticEntry(entry: TherapeuticEntry) {
    const slug = slugify(entry.activeIngredient);
    const { data: base, error: baseError } = await this.client
      .from('active_ingredients')
      .insert({
        slug,
        active_ingredient: entry.activeIngredient,
        summary_es: entry.indications.es,
        summary_en: entry.indications.en,
        evidence_level: entry.evidenceLevel,
        status: entry.editorialStatus,
        publication_status: entry.publicationStatus ?? 'pending_activation',
        species: entry.species,
        systems: entry.systems,
        pathologies: entry.pathologies,
      })
      .select('id')
      .single();

    if (baseError) throw baseError;
    const activeIngredientId = base.id;
    await this.replaceRelatedRows(activeIngredientId, entry);
    return this.getTherapeuticEntryById(activeIngredientId);
  }

  async updateTherapeuticEntry(entry: TherapeuticEntry) {
    const { data: base, error: baseError } = await this.client
      .from('active_ingredients')
      .update({
        slug: slugify(entry.activeIngredient),
        active_ingredient: entry.activeIngredient,
        summary_es: entry.indications.es,
        summary_en: entry.indications.en,
        evidence_level: entry.evidenceLevel,
        status: entry.editorialStatus,
        publication_status: entry.publicationStatus ?? 'pending_activation',
        species: entry.species,
        systems: entry.systems,
        pathologies: entry.pathologies,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry.id)
      .select('id')
      .single();

    if (baseError) throw baseError;

    await this.replaceRelatedRows(base.id, entry);
    return this.getTherapeuticEntryById(base.id);
  }

  async deleteTherapeuticEntry(id: string) {
    const { error } = await this.client.from('active_ingredients').delete().eq('id', id);
    if (error) throw error;
  }

  async saveActiveIngredientReview(activeIngredientId: string, approvalLevel: number, reviewNote?: string) {
    const user = (await this.client.auth.getUser()).data.user;
    if (!user) throw new Error('Authentication is required.');

    const { error } = await this.client.from('active_ingredient_reviews').upsert(
      {
        active_ingredient_id: activeIngredientId,
        reviewer_id: user.id,
        approved: true,
        approval_level: Math.max(1, Math.min(3, approvalLevel)),
        review_note: reviewNote ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'active_ingredient_id,reviewer_id' },
    );
    if (error) throw error;

    return this.getTherapeuticEntryById(activeIngredientId);
  }

  async updatePublicationStatus(activeIngredientId: string, publicationStatus: TherapeuticEntry['publicationStatus']) {
    const { error } = await this.client
      .from('active_ingredients')
      .update({
        publication_status: publicationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeIngredientId);
    if (error) throw error;

    return this.getTherapeuticEntryById(activeIngredientId);
  }
}

export class SupabaseAccessService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private readPendingMembershipSelection() {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(MEMBERSHIP_PENDING_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as MembershipSelection;
    } catch {
      window.localStorage.removeItem(MEMBERSHIP_PENDING_STORAGE_KEY);
      return null;
    }
  }

  private clearPendingMembershipSelection() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(MEMBERSHIP_PENDING_STORAGE_KEY);
  }

  savePendingMembershipSelection(selection: MembershipSelection) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MEMBERSHIP_PENDING_STORAGE_KEY, JSON.stringify(selection));
  }

  private async ensureProfile(user: User, preferredName?: string) {
    const payload = {
      id: user.id,
      full_name: preferredName || getUserDisplayName(user),
      email: user.email ?? null,
      auth_provider: getAuthProvider(user),
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    if (isAdminEmail(user.email)) {
      const { error: roleError } = await this.client
        .from('profiles')
        .update({
          role: 'admin',
          roles: adminRoles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (roleError) throw roleError;
    }
  }

  private async getProfileByUserId(userId: string) {
    const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data ? mapProfileRow(data as Record<string, unknown>) : null;
  }

  async listProfiles(): Promise<AdminDirectoryProfile[]> {
    const [{ data: profilesData, error: profilesError }, { data: membershipsData, error: membershipsError }] = await Promise.all([
      this.client.from('profiles').select('*').order('updated_at', { ascending: false }),
      this.client.from('user_memberships').select('*'),
    ]);
    if (profilesError) throw profilesError;
    if (membershipsError) throw membershipsError;

    const membershipsByUserId = new Map(
      ((membershipsData ?? []) as Array<Record<string, unknown>>).map((row) => {
        const membership = mapMembershipRow(row);
        return [membership.userId, membership] as const;
      }),
    );

    return ((profilesData ?? []) as Array<Record<string, unknown>>).map((row) => {
      const profile = mapProfileRow(row);
      return {
        ...profile,
        membership: membershipsByUserId.get(profile.id) ?? null,
      };
    });
  }

  async updateUserAccessProfile(
    userId: string,
    payload: {
      roles: UserRole[];
      accountType: AccountType;
      partnerCategory?: PartnerCategory;
    },
  ) {
    const normalizedRoles = normalizeRoles(payload.roles);
    const { data, error } = await this.client
      .from('profiles')
      .update({
        role: getEffectiveRole(normalizedRoles),
        roles: normalizedRoles,
        account_type: payload.accountType,
        partner_category: payload.accountType === 'partner' ? payload.partnerCategory ?? null : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return mapProfileRow(data as Record<string, unknown>);
  }

  async updateCurrentProfile(
    userId: string,
    profile: {
      fullName: string;
      accountType?: AccountType;
      partnerCategory?: PartnerCategory;
      nationalId?: string;
      licenseNumber?: string;
      licenseProvince?: string;
      workplaceName?: string;
      centerFiscalName?: string;
      centerTaxId?: string;
      centerType?: string;
      professionalEmail?: string;
      privateEmail?: string;
      websites?: string[];
      instagramUrl?: string;
      tiktokUrl?: string;
      youtubeUrl?: string;
      facebookUrl?: string;
      linkedinUrl?: string;
      phoneMobile?: string;
      reportVisibleFields?: ReportVisibilityField[];
    },
  ) {
    const payload = {
      full_name: profile.fullName.trim(),
      national_id: profile.nationalId?.trim() || null,
      license_number: profile.licenseNumber?.trim() || null,
      license_province: profile.licenseProvince?.trim() || null,
      workplace_name: profile.workplaceName?.trim() || null,
      center_fiscal_name: profile.centerFiscalName?.trim() || null,
      center_tax_id: profile.centerTaxId?.trim() || null,
      center_type: profile.centerType?.trim() || null,
      professional_email: profile.professionalEmail?.trim() || null,
      private_email: profile.privateEmail?.trim() || null,
      websites: (profile.websites ?? []).map((item) => item.trim()).filter(Boolean),
      instagram_url: profile.instagramUrl?.trim() || null,
      tiktok_url: profile.tiktokUrl?.trim() || null,
      youtube_url: profile.youtubeUrl?.trim() || null,
      facebook_url: profile.facebookUrl?.trim() || null,
      linkedin_url: profile.linkedinUrl?.trim() || null,
      phone_mobile: profile.phoneMobile?.trim() || null,
      report_visible_fields: Array.from(new Set(profile.reportVisibleFields ?? [])).filter((item) =>
        reportVisibilityFields.includes(item),
      ),
      updated_at: new Date().toISOString(),
    };

    if (profile.accountType) {
      Object.assign(payload, {
        account_type: profile.accountType,
        partner_category: profile.accountType === 'partner' ? profile.partnerCategory ?? null : null,
      });
    }

    const { data, error } = await this.client.from('profiles').update(payload).eq('id', userId).select('*').single();
    if (error) throw error;
    return mapProfileRow(data as Record<string, unknown>);
  }

  private async getMembershipByUserId(userId: string) {
    const { data, error } = await this.client.from('user_memberships').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data ? mapMembershipRow(data as Record<string, unknown>) : null;
  }

  private async hasDiscountCodeRedemption(userId: string, discountCodeId?: string | null) {
    if (!discountCodeId) return false;

    const { data, error } = await this.client
      .from('discount_code_redemptions')
      .select('id')
      .eq('user_id', userId)
      .eq('discount_code_id', discountCodeId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  private async assertDiscountCodeAvailableForUser(userId: string, discountCodeId?: string | null) {
    if (!discountCodeId) return;
    const alreadyRedeemed = await this.hasDiscountCodeRedemption(userId, discountCodeId);
    if (alreadyRedeemed) throw new Error(DISCOUNT_CODE_ALREADY_USED_ERROR);
  }

  private async redeemDiscountCodeForUser(userId: string, discount: DiscountCodeRecord) {
    try {
      const { error } = await this.client.from('discount_code_redemptions').insert({
        user_id: userId,
        discount_code_id: discount.id,
        discount_code: discount.code,
      });

      if (error) throw error;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string' &&
        error.code === '23505'
      ) {
        throw new Error(DISCOUNT_CODE_ALREADY_USED_ERROR);
      }

      throw error;
    }
  }

  async getCurrentSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async syncPendingMembershipSelection(session: Session | null) {
    const selection = this.readPendingMembershipSelection();
    if (!selection || !session?.user) return null;
    try {
      return await this.saveMembershipSelection(selection, getAuthProvider(session.user), session.user);
    } catch (error) {
      if (error instanceof Error && error.message === DISCOUNT_CODE_ALREADY_USED_ERROR) {
        this.clearPendingMembershipSelection();
      }
      throw error;
    }
  }

  async getAccountSnapshot(): Promise<AuthAccountSnapshot> {
    const session = await this.getCurrentSession();
    if (!session?.user) {
      return { profile: null, membership: null, email: null };
    }

    await this.ensureProfile(session.user);
    await this.syncPendingMembershipSelection(session);

    const [profile, membership] = await Promise.all([
      this.getProfileByUserId(session.user.id),
      this.getMembershipByUserId(session.user.id),
    ]);

    return {
      profile,
      membership,
      email: session.user.email ?? null,
    };
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return this.client.auth.onAuthStateChange((_event, session) => {
      void this.syncPendingMembershipSelection(session);
      callback(session);
    });
  }

  async signInWithGoogle(redirectTo: string, selection?: MembershipSelection) {
    if (selection) this.savePendingMembershipSelection(selection);
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) throw error;
  }

  async signUpWithEmail({
    email,
    password,
    fullName,
    selection,
  }: {
    email: string;
    password: string;
    fullName: string;
    selection: MembershipSelection;
  }) {
    this.savePendingMembershipSelection(selection);

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await this.ensureProfile(data.user, fullName);
    }

    if (data.session) {
      await this.syncPendingMembershipSelection(data.session);
    }

    return {
      session: data.session,
      requiresEmailConfirmation: !data.session,
    };
  }

  async signInWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.session?.user) {
      await this.ensureProfile(data.session.user);
      await this.syncPendingMembershipSelection(data.session);
    }

    return data.session;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getDiscountCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    const { data, error } = await this.client
      .from('discount_codes')
      .select('*')
      .eq('code', normalized)
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const discount = mapDiscountCodeRow(data as Record<string, unknown>);
    const session = await this.getCurrentSession();
    if (session?.user) {
      await this.assertDiscountCodeAvailableForUser(session.user.id, discount.id);
    }

    return discount;
  }

  async createStripeCheckoutSession(selection: MembershipSelection, origin: string) {
    const session = await this.getCurrentSession();
    if (!session?.access_token) {
      throw new Error('No active session found. Sign in again and retry.');
    }

    const { data, error } = await this.client.functions.invoke<{ url: string }>('stripe-create-checkout-session', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        selection,
        origin,
      },
    });

    if (error) throw new Error(await getFunctionErrorMessage(error, 'Stripe checkout session failed.'));
    if (!data?.url) throw new Error('Stripe checkout session did not return a URL.');
    return data.url;
  }

  async createStripeBillingPortalSession(origin: string) {
    const session = await this.getCurrentSession();
    if (!session?.access_token) {
      throw new Error('No active session found. Sign in again and retry.');
    }

    const { data, error } = await this.client.functions.invoke<{ url: string }>('stripe-create-billing-portal-session', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        origin,
      },
    });

    if (error) throw new Error(await getFunctionErrorMessage(error, 'Stripe billing portal session failed.'));
    if (!data?.url) throw new Error('Stripe billing portal did not return a URL.');
    return data.url;
  }

  async saveMembershipSelection(selection: MembershipSelection, signupMethod?: AuthProvider, userArg?: User | null) {
    const user =
      userArg ??
      (await this.client.auth.getUser()).data.user;

    if (!user) {
      this.savePendingMembershipSelection(selection);
      return null;
    }

    await this.ensureProfile(user);
    if (selection.discountCodeId) {
      await this.assertDiscountCodeAvailableForUser(user.id, selection.discountCodeId);
    }
    const existing = await this.getMembershipByUserId(user.id);
    const now = new Date();
    const trialStartedAt = existing?.trialStartedAt ?? now.toISOString();
    const trialEndsAt = existing?.trialEndsAt ?? new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      user_id: user.id,
      signup_method: signupMethod ?? existing?.signupMethod ?? getAuthProvider(user),
      plan_id: selection.planId,
      billing_cycle: selection.billingCycle,
      seat_count: selection.seatCount ?? 1,
      status: existing?.status ?? 'trialing',
      list_price_cents: selection.listPriceCents,
      final_price_cents: selection.finalPriceCents,
      currency: 'EUR',
      trial_days: selection.grantDays ?? existing?.trialDays ?? TRIAL_DAYS,
      trial_started_at: trialStartedAt,
      trial_ends_at:
        selection.grantDays && !existing?.trialEndsAt
          ? new Date(now.getTime() + selection.grantDays * 24 * 60 * 60 * 1000).toISOString()
          : trialEndsAt,
      discount_code_id: selection.discountCodeId ?? null,
      discount_code: selection.discountCode ?? null,
      discount_months: selection.discountMonths ?? null,
      discount_amount_cents: selection.discountAmountCents ?? null,
      override_price_cents: selection.overridePriceCents ?? null,
      updated_at: now.toISOString(),
    };

    const { data, error } = await this.client.from('user_memberships').upsert(payload, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;

    if (selection.discountCodeId && selection.discountCode && (selection.grantDays || selection.finalPriceCents === 0)) {
      await this.redeemDiscountCodeForUser(user.id, {
        id: selection.discountCodeId,
        code: selection.discountCode,
        label: selection.discountCode,
        appliesTo: selection.billingCycle,
        discountMode: selection.overridePriceCents !== undefined ? 'override_price' : 'fixed_amount',
        discountMonths: selection.discountMonths ?? 1,
        discountAmountCents: selection.discountAmountCents,
        overridePriceCents: selection.overridePriceCents,
        grantDays: selection.grantDays,
        grantedRoles: [],
        active: true,
      });
    }

    this.clearPendingMembershipSelection();
    return mapMembershipRow(data as Record<string, unknown>);
  }
}

export const createSupabaseEditorialService = () => {
  const client = getSupabaseClient();
  if (!client) return null;
  return new SupabaseEditorialService(client);
};

export const createSupabaseAccessService = () => {
  const client = getSupabaseClient();
  if (!client) return null;
  return new SupabaseAccessService(client);
};
