import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClinicalDietRecord, FoodIngredientRecord, Species } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const isPlaceholder = (value: string) => !value || value.includes('your-project') || value.includes('anon_key');

const toSpeciesArray = (value: unknown) => ((Array.isArray(value) ? value : []) as string[]).filter(Boolean) as Species[];

const dietSelect = `
  id,
  brand_name,
  diet_name,
  species,
  health_conditions,
  format,
  summary_es,
  summary_en,
  composition_es,
  composition_en,
  indications_es,
  indications_en,
  contraindications_es,
  contraindications_en,
  technical_sheet_es,
  technical_sheet_en,
  energy_kcal_per_100g,
  protein_percent_dm,
  fat_percent_dm,
  fiber_percent_dm,
  carbohydrate_percent_dm,
  phosphorus_percent_dm,
  sodium_percent_dm,
  omega3_percent_dm,
  clinical_diet_presentations (
    id,
    label,
    format,
    package_size_g,
    target
  ),
  clinical_diet_feeding_guides (
    id,
    species,
    body_weight_kg,
    daily_amount_g,
    daily_amount_label,
    notes
  )
`;

const mapClinicalDiet = (row: Record<string, unknown>): ClinicalDietRecord => ({
  id: String(row.id),
  brandName: String(row.brand_name ?? ''),
  dietName: String(row.diet_name ?? ''),
  species: toSpeciesArray(row.species),
  healthConditions: ((row.health_conditions as string[] | null) ?? []).filter(Boolean),
  format: String(row.format ?? 'dry') as ClinicalDietRecord['format'],
  shortDescription: {
    es: String(row.summary_es ?? ''),
    en: String(row.summary_en ?? ''),
  },
  composition: {
    es: String(row.composition_es ?? ''),
    en: String(row.composition_en ?? ''),
  },
  indications: {
    es: String(row.indications_es ?? ''),
    en: String(row.indications_en ?? ''),
  },
  contraindications:
    row.contraindications_es || row.contraindications_en
      ? {
          es: String(row.contraindications_es ?? ''),
          en: String(row.contraindications_en ?? ''),
        }
      : undefined,
  technicalSheet: {
    es: String(row.technical_sheet_es ?? ''),
    en: String(row.technical_sheet_en ?? ''),
  },
  nutrientProfile: {
    energyKcalPer100g: Number(row.energy_kcal_per_100g ?? 0),
    proteinPercentDm: Number(row.protein_percent_dm ?? 0),
    fatPercentDm: Number(row.fat_percent_dm ?? 0),
    fiberPercentDm: Number(row.fiber_percent_dm ?? 0),
    carbohydratePercentDm: Number(row.carbohydrate_percent_dm ?? 0),
    phosphorusPercentDm: row.phosphorus_percent_dm ? Number(row.phosphorus_percent_dm) : undefined,
    sodiumPercentDm: row.sodium_percent_dm ? Number(row.sodium_percent_dm) : undefined,
    omega3PercentDm: row.omega3_percent_dm ? Number(row.omega3_percent_dm) : undefined,
  },
  presentations: (
    (row.clinical_diet_presentations as Array<Record<string, unknown>> | undefined) ?? []
  ).map((presentation) => ({
    id: String(presentation.id),
    label: String(presentation.label ?? ''),
    format: String(presentation.format ?? 'dry') as ClinicalDietRecord['format'],
    packageSizeG: Number(presentation.package_size_g ?? 0),
    target: String(presentation.target ?? 'general') as 'general' | 'small_breed' | 'wet',
  })),
  feedingGuide: (((row.clinical_diet_feeding_guides as Array<Record<string, unknown>> | undefined) ?? []).map((guide) => ({
    id: String(guide.id),
    species: String(guide.species ?? 'Dog') as Species,
    bodyWeightKg: Number(guide.body_weight_kg ?? 0),
    dailyAmountG: Number(guide.daily_amount_g ?? 0),
    dailyAmountLabel: guide.daily_amount_label ? String(guide.daily_amount_label) : undefined,
    notes: guide.notes ? String(guide.notes) : undefined,
  })) as ClinicalDietRecord['feedingGuide']),
});

const mapFoodIngredient = (row: Record<string, unknown>): FoodIngredientRecord => ({
  id: String(row.id),
  foodName: String(row.food_name ?? ''),
  category: String(row.category ?? ''),
  preparation: String(row.preparation ?? ''),
  species: toSpeciesArray(row.species),
  notes:
    row.notes_es || row.notes_en
      ? {
          es: String(row.notes_es ?? ''),
          en: String(row.notes_en ?? ''),
        }
      : undefined,
  nutrientsPer100g: {
    energyKcal: Number(row.energy_kcal_per_100g ?? 0),
    proteinG: Number(row.protein_g_per_100g ?? 0),
    fatG: Number(row.fat_g_per_100g ?? 0),
    carbohydrateG: Number(row.carbohydrate_g_per_100g ?? 0),
    fiberG: Number(row.fiber_g_per_100g ?? 0),
    calciumMg: Number(row.calcium_mg_per_100g ?? 0),
    phosphorusMg: Number(row.phosphorus_mg_per_100g ?? 0),
    sodiumMg: Number(row.sodium_mg_per_100g ?? 0),
    potassiumMg: Number(row.potassium_mg_per_100g ?? 0),
    magnesiumMg: Number(row.magnesium_mg_per_100g ?? 0),
    zincMg: Number(row.zinc_mg_per_100g ?? 0),
    taurineMg: Number(row.taurine_mg_per_100g ?? 0),
  },
});

export class ClinicalNutritionService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async listClinicalDiets() {
    const { data, error } = await this.client
      .from('clinical_diets')
      .select(dietSelect)
      .order('brand_name', { ascending: true })
      .order('diet_name', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapClinicalDiet);
  }

  async listFoodIngredients() {
    const { data, error } = await this.client.from('food_ingredients').select('*').order('food_name', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapFoodIngredient);
  }

  async searchUsdaFoods({ query, species }: { query: string; species: Species }) {
    const { data, error } = await this.client.functions.invoke('usda-food-search', {
      body: { query, species },
    });

    if (error) throw error;
    return ((data?.foods ?? []) as FoodIngredientRecord[]).filter((food) => food.id && food.foodName);
  }
}

export const createClinicalNutritionService = () => {
  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) return null;
  return new ClinicalNutritionService(createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
};
