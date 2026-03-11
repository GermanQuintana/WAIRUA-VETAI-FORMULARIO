import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { specialtyTags, therapeuticClassTags } from '../data/taxonomy';
import { DoseCalculatorPreset, ScientificReference, TherapeuticEntry } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

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
  const pathologiesFromRules = uniq(dosingRules.map((rule) => String(rule.indication)).filter(Boolean));

  return {
    id: String(row.id),
    activeIngredient: String(row.active_ingredient),
    tradeNames: ((row.active_ingredient_trade_names as Array<{ trade_name: string }> | undefined) ?? []).map((item) => item.trade_name),
    species: (((row.species as string[] | null) ?? speciesFromRules) as TherapeuticEntry['species']),
    tags: ((row.active_ingredient_tags as Array<{ tag_name: string }> | undefined) ?? []).map((item) => item.tag_name),
    systems: (row.systems as string[] | null) ?? [],
    pathologies: ((row.pathologies as string[] | null) ?? pathologiesFromRules) ?? [],
    concentrations: ((row.active_ingredient_concentrations as Array<{ label: string }> | undefined) ?? []).map((item) => item.label),
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
    calculatorPresets: dosingRules.map((rule) => mapRuleToPreset(rule, referenceRows)).filter(Boolean) as DoseCalculatorPreset[],
    references: referenceRows
      .filter((reference) => reference.scope !== 'dosing_rule')
      .map(({ scope: _scope, scopeLabel: _scopeLabel, ...reference }) => reference),
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
  updated_at,
  active_ingredient_trade_names ( trade_name ),
  active_ingredient_tags ( tag_name ),
  active_ingredient_concentrations ( label ),
  active_ingredient_notes ( field_name, locale, body ),
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
}

export const createSupabaseEditorialService = () => {
  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) return null;
  return new SupabaseEditorialService(createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
};
