import { useEffect, useMemo, useState } from 'react';
import { clinicalDietSeedData, homemadeFoodSeedData } from '../data/nutrition';
import { Language } from '../i18n';
import type { ClinicalNutritionService } from '../services/clinicalNutrition';
import { ClinicalDietRecord, FoodIngredientRecord } from '../types';

interface Props {
  lang: Language;
  service: ClinicalNutritionService | null;
}

type NutritionView = 'energy' | 'diets' | 'targets' | 'homemade';
type SupportedSpecies = 'Dog' | 'Cat';
type HospitalPlanKey = 'stable' | 'post_op' | 'critical' | 'weight_loss' | 'weight_gain';
type RequirementPresetKey = 'dog_hospital' | 'dog_diabetes' | 'cat_hospital' | 'cat_diabetes';

interface RequirementPreset {
  species: SupportedSpecies;
  label: {
    es: string;
    en: string;
  };
  proteinPercent: number;
  fatPercent: number;
  carbohydratePercent: number;
  fiberGPer1000Kcal: number;
  calciumMgPer1000Kcal: number;
  phosphorusMgPer1000Kcal: number;
  sodiumMgPer1000Kcal: number;
  potassiumMgPer1000Kcal: number;
  magnesiumMgPer1000Kcal: number;
  zincMgPer1000Kcal: number;
  taurineMgPer1000Kcal: number;
}

interface RationRow {
  id: string;
  foodId: string;
  grams: string;
}

const texts = {
  es: {
    kicker: 'Nueva linea del toolkit',
    title: 'Nutricion clinica',
    subtitle:
      'Integra calculos energeticos y de nutrientes para hospitalizacion, una base filtrable de dietas terapeuticas y un constructor de dieta casera con seguimiento de objetivos.',
    disclaimer:
      'Herramienta orientativa. Las formulas, objetivos y alimentos deben validarse con el estado clinico, analitica, historial y la ficha tecnica real antes de prescribir.',
    patientProfile: 'Perfil del paciente',
    currentWeight: 'Peso actual (kg)',
    idealWeight: 'Peso objetivo (kg)',
    species: 'Especie',
    hospitalizationPlan: 'Escenario clinico',
    intakePercent: '% de objetivo que come',
    energyNav: 'Energia',
    dietsNav: 'Dietas clinicas',
    targetsNav: 'Macronutrientes',
    homemadeNav: 'Dieta casera',
    rer: 'RER',
    energyTarget: 'Objetivo energetico',
    deliveredEnergy: 'Energia ingerida',
    hospitalFactor: 'Factor aplicado',
    energyFormula: 'RER = 70 x kg^0.75',
    energyHelp:
      'Para pacientes ingresados se usa el peso objetivo y un factor clinico editable. Si el paciente esta obeso, trabaja sobre peso objetivo.',
    stable: 'Hospitalizado estable',
    post_op: 'Postoperatorio / recuperacion',
    critical: 'Paciente critico / sepsis / trauma',
    weight_loss: 'Plan de perdida de peso',
    weight_gain: 'Plan de recuperacion ponderal',
    dietFilters: 'Filtros de busqueda',
    searchDiet: 'Buscar dieta, marca o indicacion...',
    allConditions: 'Todos los problemas de salud',
    dry: 'Seca',
    wet: 'Humeda',
    mixed: 'Mixta',
    allFormats: 'Todos los formatos',
    allBrands: 'Todas las marcas',
    availableDiets: 'Dietas localizadas',
    noDiets: 'No hay dietas con esos filtros.',
    technicalSheet: 'Ficha tecnica editorial',
    composition: 'Composicion',
    indications: 'Indicaciones',
    contraindications: 'Contraindicaciones',
    nutrientProfile: 'Perfil nutricional',
    presentations: 'Presentaciones',
    feedingGuide: 'Tabla de dosificacion',
    summary: 'Resumen',
    preset: 'Perfil de requerimientos',
    protein: 'Proteinas',
    fat: 'Grasas',
    carbohydrate: 'Carbohidratos',
    fiber: 'Fibra',
    micronutrients: 'Micronutrientes',
    mgPer1000: 'por 1000 kcal',
    gPerDay: 'g/dia',
    mgPerDay: 'mg/dia',
    targetBreakdown:
      'Objetivos editables para ver gramos diarios y micronutrientes a partir del requerimiento energetico. En perro y gato los carbohidratos son un objetivo operativo, no un nutriente esencial.',
    macroBalance: 'Balance de energia asignada',
    homemadeTitle: 'Constructor de dieta casera',
    addIngredient: 'Anadir ingrediente',
    remove: 'Quitar',
    ingredient: 'Ingrediente',
    grams: 'Gramos',
    totalDelivered: 'Aporte actual',
    targetComparison: 'Comparacion con objetivos',
    foodDatabase: 'Base de alimentos',
    foodSearch: 'Buscar alimento...',
    usdaSearch: 'Buscar en USDA',
    usdaSearchTitle: 'Importar ingrediente USDA',
    usdaSearchHelp:
      'Busca alimentos simples en FoodData Central y anadelos a la racion actual como ingrediente revisable.',
    usdaUnavailable: 'Activa Supabase y configura USDA_FDC_API_KEY en las Edge Functions para usar esta busqueda.',
    usdaNoResults: 'No hay resultados USDA para esa busqueda.',
    usdaLoadError: 'No se pudo consultar USDA FoodData Central.',
    addToRation: 'Usar',
    noFoods: 'No hay alimentos para esta especie.',
    nutrient: 'Nutriente',
    target: 'Objetivo',
    delivered: 'Aportado',
    coverage: 'Cobertura',
    notes: 'Notas',
    brand: 'Marca',
    officialSource: 'Fuente oficial',
    openOfficialSheet: 'Abrir ficha oficial',
    noTechnicalData: 'Datos tecnicos detallados pendientes de enriquecer desde la ficha oficial de la marca.',
    loading: 'Cargando datos de nutricion desde Supabase...',
    loadError: 'No se pudieron sincronizar los datos remotos. Se muestran datos locales de apoyo.',
    percent: '%',
  },
  en: {
    kicker: 'New toolkit lane',
    title: 'Clinical nutrition',
    subtitle:
      'Brings together inpatient energy and nutrient calculations, a filterable therapeutic-diet database, and a homemade-diet builder with goal tracking.',
    disclaimer:
      'Guidance-only tool. Formulas, targets, and foods must be checked against clinical status, lab work, history, and the actual technical sheet before prescribing.',
    patientProfile: 'Patient profile',
    currentWeight: 'Current weight (kg)',
    idealWeight: 'Target weight (kg)',
    species: 'Species',
    hospitalizationPlan: 'Clinical scenario',
    intakePercent: '% of target currently eaten',
    energyNav: 'Energy',
    dietsNav: 'Clinical diets',
    targetsNav: 'Macronutrients',
    homemadeNav: 'Homemade diet',
    rer: 'RER',
    energyTarget: 'Energy target',
    deliveredEnergy: 'Intake energy',
    hospitalFactor: 'Applied factor',
    energyFormula: 'RER = 70 x kg^0.75',
    energyHelp:
      'For inpatients the calculator uses target weight and an editable clinical factor. In obese patients, work from target weight.',
    stable: 'Stable inpatient',
    post_op: 'Post-op / recovery',
    critical: 'Critical patient / sepsis / trauma',
    weight_loss: 'Weight-loss plan',
    weight_gain: 'Weight-recovery plan',
    dietFilters: 'Search filters',
    searchDiet: 'Search diet, brand, or indication...',
    allConditions: 'All health problems',
    dry: 'Dry',
    wet: 'Wet',
    mixed: 'Mixed',
    allFormats: 'All formats',
    allBrands: 'All brands',
    availableDiets: 'Matching diets',
    noDiets: 'No diets match the current filters.',
    technicalSheet: 'Editorial technical sheet',
    composition: 'Composition',
    indications: 'Indications',
    contraindications: 'Contraindications',
    nutrientProfile: 'Nutrient profile',
    presentations: 'Presentations',
    feedingGuide: 'Feeding guide',
    summary: 'Summary',
    preset: 'Requirement profile',
    protein: 'Protein',
    fat: 'Fat',
    carbohydrate: 'Carbohydrate',
    fiber: 'Fiber',
    micronutrients: 'Micronutrients',
    mgPer1000: 'per 1000 kcal',
    gPerDay: 'g/day',
    mgPerDay: 'mg/day',
    targetBreakdown:
      'Editable targets to visualize daily grams and micronutrients from the energy requirement. In dogs and cats, carbohydrates are an operational target rather than an essential nutrient.',
    macroBalance: 'Assigned energy balance',
    homemadeTitle: 'Homemade diet builder',
    addIngredient: 'Add ingredient',
    remove: 'Remove',
    ingredient: 'Ingredient',
    grams: 'Grams',
    totalDelivered: 'Current delivery',
    targetComparison: 'Target comparison',
    foodDatabase: 'Food database',
    foodSearch: 'Search food...',
    usdaSearch: 'Search USDA',
    usdaSearchTitle: 'Import USDA ingredient',
    usdaSearchHelp:
      'Search simple foods in FoodData Central and add them to the current ration as a reviewable ingredient.',
    usdaUnavailable: 'Enable Supabase and configure USDA_FDC_API_KEY in Edge Functions to use this search.',
    usdaNoResults: 'No USDA results for that search.',
    usdaLoadError: 'Could not query USDA FoodData Central.',
    addToRation: 'Use',
    noFoods: 'No foods available for this species.',
    nutrient: 'Nutrient',
    target: 'Target',
    delivered: 'Delivered',
    coverage: 'Coverage',
    notes: 'Notes',
    brand: 'Brand',
    officialSource: 'Official source',
    openOfficialSheet: 'Open official sheet',
    noTechnicalData: 'Detailed technical data is still pending enrichment from the brand official sheet.',
    loading: 'Loading nutrition data from Supabase...',
    loadError: 'Remote data could not be synced. Showing local supporting data.',
    percent: '%',
  },
} as const;

const hospitalFactors: Record<
  HospitalPlanKey,
  {
    factor: number;
    label: {
      es: string;
      en: string;
    };
  }
> = {
  stable: { factor: 1, label: { es: texts.es.stable, en: texts.en.stable } },
  post_op: { factor: 1.15, label: { es: texts.es.post_op, en: texts.en.post_op } },
  critical: { factor: 1.3, label: { es: texts.es.critical, en: texts.en.critical } },
  weight_loss: { factor: 0.8, label: { es: texts.es.weight_loss, en: texts.en.weight_loss } },
  weight_gain: { factor: 1.25, label: { es: texts.es.weight_gain, en: texts.en.weight_gain } },
};

const requirementPresets: Record<RequirementPresetKey, RequirementPreset> = {
  dog_hospital: {
    species: 'Dog',
    label: { es: 'Perro hospitalizado estandar', en: 'Standard hospitalized dog' },
    proteinPercent: 30,
    fatPercent: 35,
    carbohydratePercent: 35,
    fiberGPer1000Kcal: 12,
    calciumMgPer1000Kcal: 1250,
    phosphorusMgPer1000Kcal: 1000,
    sodiumMgPer1000Kcal: 500,
    potassiumMgPer1000Kcal: 1600,
    magnesiumMgPer1000Kcal: 150,
    zincMgPer1000Kcal: 18,
    taurineMgPer1000Kcal: 0,
  },
  dog_diabetes: {
    species: 'Dog',
    label: { es: 'Perro diabetico', en: 'Diabetic dog' },
    proteinPercent: 35,
    fatPercent: 35,
    carbohydratePercent: 20,
    fiberGPer1000Kcal: 18,
    calciumMgPer1000Kcal: 1250,
    phosphorusMgPer1000Kcal: 1000,
    sodiumMgPer1000Kcal: 500,
    potassiumMgPer1000Kcal: 1600,
    magnesiumMgPer1000Kcal: 150,
    zincMgPer1000Kcal: 18,
    taurineMgPer1000Kcal: 0,
  },
  cat_hospital: {
    species: 'Cat',
    label: { es: 'Gato hospitalizado estandar', en: 'Standard hospitalized cat' },
    proteinPercent: 45,
    fatPercent: 45,
    carbohydratePercent: 10,
    fiberGPer1000Kcal: 6,
    calciumMgPer1000Kcal: 1400,
    phosphorusMgPer1000Kcal: 1200,
    sodiumMgPer1000Kcal: 500,
    potassiumMgPer1000Kcal: 1600,
    magnesiumMgPer1000Kcal: 120,
    zincMgPer1000Kcal: 18,
    taurineMgPer1000Kcal: 250,
  },
  cat_diabetes: {
    species: 'Cat',
    label: { es: 'Gato diabetico', en: 'Diabetic cat' },
    proteinPercent: 50,
    fatPercent: 40,
    carbohydratePercent: 10,
    fiberGPer1000Kcal: 8,
    calciumMgPer1000Kcal: 1400,
    phosphorusMgPer1000Kcal: 1200,
    sodiumMgPer1000Kcal: 500,
    potassiumMgPer1000Kcal: 1600,
    magnesiumMgPer1000Kcal: 120,
    zincMgPer1000Kcal: 18,
    taurineMgPer1000Kcal: 300,
  },
};

const speciesOptions: SupportedSpecies[] = ['Dog', 'Cat'];
const speciesLabels: Record<SupportedSpecies, { es: string; en: string }> = {
  Dog: { es: 'Perro', en: 'Dog' },
  Cat: { es: 'Gato', en: 'Cat' },
};

const formatNumber = (value: number, decimals = 1) => {
  if (!Number.isFinite(value)) return '--';
  return Number(value.toFixed(decimals)).toString();
};

const mergeById = <T extends { id: string }>(base: T[], incoming: T[]) => {
  const merged = new Map<string, T>();

  base.forEach((item) => merged.set(item.id, item));
  incoming.forEach((item) => merged.set(item.id, item));

  return Array.from(merged.values());
};

const buildRowId = () => `ration-${Math.random().toString(36).slice(2, 10)}`;

const matchesSpecies = (species: SupportedSpecies, supportedSpecies: string[]) => supportedSpecies.includes(species);
const localDietCatalog = clinicalDietSeedData;

export default function ClinicalNutritionToolkit({ lang, service }: Props) {
  const copy = texts[lang];
  const [view, setView] = useState<NutritionView>('energy');
  const [species, setSpecies] = useState<SupportedSpecies>('Dog');
  const [currentWeight, setCurrentWeight] = useState('20');
  const [idealWeight, setIdealWeight] = useState('20');
  const [hospitalPlan, setHospitalPlan] = useState<HospitalPlanKey>('stable');
  const [intakePercent, setIntakePercent] = useState('100');
  const [selectedRequirementPreset, setSelectedRequirementPreset] = useState<RequirementPresetKey>('dog_hospital');
  const [proteinPercent, setProteinPercent] = useState('30');
  const [fatPercent, setFatPercent] = useState('35');
  const [carbohydratePercent, setCarbohydratePercent] = useState('35');
  const [fiberGPer1000Kcal, setFiberGPer1000Kcal] = useState('12');
  const [calciumMgPer1000Kcal, setCalciumMgPer1000Kcal] = useState('1250');
  const [phosphorusMgPer1000Kcal, setPhosphorusMgPer1000Kcal] = useState('1000');
  const [sodiumMgPer1000Kcal, setSodiumMgPer1000Kcal] = useState('500');
  const [potassiumMgPer1000Kcal, setPotassiumMgPer1000Kcal] = useState('1600');
  const [magnesiumMgPer1000Kcal, setMagnesiumMgPer1000Kcal] = useState('150');
  const [zincMgPer1000Kcal, setZincMgPer1000Kcal] = useState('18');
  const [taurineMgPer1000Kcal, setTaurineMgPer1000Kcal] = useState('0');
  const [diets, setDiets] = useState<ClinicalDietRecord[]>(localDietCatalog);
  const [foods, setFoods] = useState<FoodIngredientRecord[]>(homemadeFoodSeedData);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [dietQuery, setDietQuery] = useState('');
  const [dietCondition, setDietCondition] = useState('');
  const [dietBrand, setDietBrand] = useState('');
  const [dietFormat, setDietFormat] = useState<'all' | 'dry' | 'wet' | 'mixed'>('all');
  const [selectedDietId, setSelectedDietId] = useState(localDietCatalog[0]?.id ?? '');
  const [foodQuery, setFoodQuery] = useState('');
  const [usdaQuery, setUsdaQuery] = useState('');
  const [usdaResults, setUsdaResults] = useState<FoodIngredientRecord[]>([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [usdaError, setUsdaError] = useState('');
  const [usdaHasSearched, setUsdaHasSearched] = useState(false);
  const [rationRows, setRationRows] = useState<RationRow[]>([
    { id: buildRowId(), foodId: 'food-chicken-breast-cooked', grams: '120' },
    { id: buildRowId(), foodId: 'food-rice-cooked', grams: '80' },
  ]);

  useEffect(() => {
    let ignore = false;

    const loadOfficialCatalog = async () => {
      const module = await import('../data/officialClinicalDiets');
      if (!ignore) {
        setDiets((current) => mergeById(current, module.officialClinicalDietData));
      }
    };

    void loadOfficialCatalog();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadRemoteData = async () => {
      if (!service) return;

      setLoading(true);
      setLoadError('');
      try {
        const [remoteDiets, remoteFoods] = await Promise.all([service.listClinicalDiets(), service.listFoodIngredients()]);
        if (ignore) return;
        if (remoteDiets.length) setDiets(mergeById(localDietCatalog, remoteDiets));
        if (remoteFoods.length) setFoods(mergeById(homemadeFoodSeedData, remoteFoods));
      } catch (_error) {
        if (!ignore) setLoadError(copy.loadError);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void loadRemoteData();

    return () => {
      ignore = true;
    };
  }, [copy.loadError, service]);

  useEffect(() => {
    const nextPreset = species === 'Dog' ? 'dog_hospital' : 'cat_hospital';
    setSelectedRequirementPreset((current) => {
      const currentPreset = requirementPresets[current];
      return currentPreset.species === species ? current : nextPreset;
    });
  }, [species]);

  useEffect(() => {
    const preset = requirementPresets[selectedRequirementPreset];
    setProteinPercent(String(preset.proteinPercent));
    setFatPercent(String(preset.fatPercent));
    setCarbohydratePercent(String(preset.carbohydratePercent));
    setFiberGPer1000Kcal(String(preset.fiberGPer1000Kcal));
    setCalciumMgPer1000Kcal(String(preset.calciumMgPer1000Kcal));
    setPhosphorusMgPer1000Kcal(String(preset.phosphorusMgPer1000Kcal));
    setSodiumMgPer1000Kcal(String(preset.sodiumMgPer1000Kcal));
    setPotassiumMgPer1000Kcal(String(preset.potassiumMgPer1000Kcal));
    setMagnesiumMgPer1000Kcal(String(preset.magnesiumMgPer1000Kcal));
    setZincMgPer1000Kcal(String(preset.zincMgPer1000Kcal));
    setTaurineMgPer1000Kcal(String(preset.taurineMgPer1000Kcal));
  }, [selectedRequirementPreset]);

  const metabolicWeight = useMemo(() => {
    const numericWeight = Number.parseFloat(idealWeight) || Number.parseFloat(currentWeight);
    return Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight : 0;
  }, [currentWeight, idealWeight]);

  const rer = metabolicWeight > 0 ? 70 * Math.pow(metabolicWeight, 0.75) : 0;
  const hospitalFactor = hospitalFactors[hospitalPlan].factor;
  const energyTarget = rer * hospitalFactor;
  const deliveredEnergy = energyTarget * ((Number.parseFloat(intakePercent) || 0) / 100);

  const numericTargets = {
    proteinPercent: Number.parseFloat(proteinPercent) || 0,
    fatPercent: Number.parseFloat(fatPercent) || 0,
    carbohydratePercent: Number.parseFloat(carbohydratePercent) || 0,
    fiberGPer1000Kcal: Number.parseFloat(fiberGPer1000Kcal) || 0,
    calciumMgPer1000Kcal: Number.parseFloat(calciumMgPer1000Kcal) || 0,
    phosphorusMgPer1000Kcal: Number.parseFloat(phosphorusMgPer1000Kcal) || 0,
    sodiumMgPer1000Kcal: Number.parseFloat(sodiumMgPer1000Kcal) || 0,
    potassiumMgPer1000Kcal: Number.parseFloat(potassiumMgPer1000Kcal) || 0,
    magnesiumMgPer1000Kcal: Number.parseFloat(magnesiumMgPer1000Kcal) || 0,
    zincMgPer1000Kcal: Number.parseFloat(zincMgPer1000Kcal) || 0,
    taurineMgPer1000Kcal: Number.parseFloat(taurineMgPer1000Kcal) || 0,
  };

  const nutrientTargets = useMemo(
    () => ({
      energyKcal: energyTarget,
      proteinG: (energyTarget * numericTargets.proteinPercent) / 100 / 4,
      fatG: (energyTarget * numericTargets.fatPercent) / 100 / 9,
      carbohydrateG: (energyTarget * numericTargets.carbohydratePercent) / 100 / 4,
      fiberG: (energyTarget * numericTargets.fiberGPer1000Kcal) / 1000,
      calciumMg: (energyTarget * numericTargets.calciumMgPer1000Kcal) / 1000,
      phosphorusMg: (energyTarget * numericTargets.phosphorusMgPer1000Kcal) / 1000,
      sodiumMg: (energyTarget * numericTargets.sodiumMgPer1000Kcal) / 1000,
      potassiumMg: (energyTarget * numericTargets.potassiumMgPer1000Kcal) / 1000,
      magnesiumMg: (energyTarget * numericTargets.magnesiumMgPer1000Kcal) / 1000,
      zincMg: (energyTarget * numericTargets.zincMgPer1000Kcal) / 1000,
      taurineMg: (energyTarget * numericTargets.taurineMgPer1000Kcal) / 1000,
    }),
    [energyTarget, numericTargets],
  );

  const conditionOptions = useMemo(
    () =>
      Array.from(new Set(diets.flatMap((diet) => diet.healthConditions)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [diets],
  );

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(diets.map((diet) => diet.brandName)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [diets],
  );

  const filteredDiets = useMemo(() => {
    const loweredQuery = dietQuery.trim().toLowerCase();
    return diets.filter((diet) => {
      const speciesMatch = matchesSpecies(species, diet.species);
      const conditionMatch = dietCondition ? diet.healthConditions.includes(dietCondition) : true;
      const brandMatch = dietBrand ? diet.brandName === dietBrand : true;
      const formatMatch = dietFormat === 'all' ? true : diet.format === dietFormat || diet.presentations.some((item) => item.format === dietFormat);
      const textMatch = loweredQuery
        ? [
            diet.brandName,
            diet.dietName,
            ...diet.healthConditions,
            diet.shortDescription.es,
            diet.shortDescription.en,
            diet.composition.es,
            diet.composition.en,
            diet.indications.es,
            diet.indications.en,
          ]
            .join(' ')
            .toLowerCase()
            .includes(loweredQuery)
        : true;
      return speciesMatch && conditionMatch && brandMatch && formatMatch && textMatch;
    });
  }, [dietBrand, dietCondition, dietFormat, dietQuery, diets, species]);

  useEffect(() => {
    if (!filteredDiets.length) {
      setSelectedDietId('');
      return;
    }

    if (!filteredDiets.some((diet) => diet.id === selectedDietId)) {
      setSelectedDietId(filteredDiets[0].id);
    }
  }, [filteredDiets, selectedDietId]);

  const selectedDiet = filteredDiets.find((diet) => diet.id === selectedDietId) ?? filteredDiets[0] ?? null;

  const availableFoodsBySpecies = useMemo(() => foods.filter((food) => matchesSpecies(species, food.species)), [foods, species]);

  const compatibleFoods = useMemo(() => {
    const loweredQuery = foodQuery.trim().toLowerCase();
    if (!loweredQuery) return availableFoodsBySpecies;

    return availableFoodsBySpecies.filter((food) =>
      [food.foodName, food.category, food.preparation, food.notes?.es ?? '', food.notes?.en ?? '']
        .join(' ')
        .toLowerCase()
        .includes(loweredQuery),
    );
  }, [availableFoodsBySpecies, foodQuery]);

  useEffect(() => {
    setRationRows((current) =>
      current.map((row, index) => {
        if (availableFoodsBySpecies.some((food) => food.id === row.foodId)) return row;
        return {
          ...row,
          foodId: availableFoodsBySpecies[index]?.id ?? availableFoodsBySpecies[0]?.id ?? '',
        };
      }),
    );
  }, [availableFoodsBySpecies]);

  const rationTotals = useMemo(
    () =>
      rationRows.reduce(
        (accumulator, row) => {
          const food = foods.find((candidate) => candidate.id === row.foodId);
          const grams = Number.parseFloat(row.grams);
          if (!food || !Number.isFinite(grams) || grams <= 0) return accumulator;
          const factor = grams / 100;
          return {
            energyKcal: accumulator.energyKcal + food.nutrientsPer100g.energyKcal * factor,
            proteinG: accumulator.proteinG + food.nutrientsPer100g.proteinG * factor,
            fatG: accumulator.fatG + food.nutrientsPer100g.fatG * factor,
            carbohydrateG: accumulator.carbohydrateG + food.nutrientsPer100g.carbohydrateG * factor,
            fiberG: accumulator.fiberG + food.nutrientsPer100g.fiberG * factor,
            calciumMg: accumulator.calciumMg + food.nutrientsPer100g.calciumMg * factor,
            phosphorusMg: accumulator.phosphorusMg + food.nutrientsPer100g.phosphorusMg * factor,
            sodiumMg: accumulator.sodiumMg + food.nutrientsPer100g.sodiumMg * factor,
            potassiumMg: accumulator.potassiumMg + food.nutrientsPer100g.potassiumMg * factor,
            magnesiumMg: accumulator.magnesiumMg + food.nutrientsPer100g.magnesiumMg * factor,
            zincMg: accumulator.zincMg + food.nutrientsPer100g.zincMg * factor,
            taurineMg: accumulator.taurineMg + food.nutrientsPer100g.taurineMg * factor,
          };
        },
        {
          energyKcal: 0,
          proteinG: 0,
          fatG: 0,
          carbohydrateG: 0,
          fiberG: 0,
          calciumMg: 0,
          phosphorusMg: 0,
          sodiumMg: 0,
          potassiumMg: 0,
          magnesiumMg: 0,
          zincMg: 0,
          taurineMg: 0,
        },
      ),
    [foods, rationRows],
  );

  const comparisonRows = [
    { id: 'energy', label: copy.energyTarget, target: nutrientTargets.energyKcal, delivered: rationTotals.energyKcal, unit: 'kcal' },
    { id: 'protein', label: copy.protein, target: nutrientTargets.proteinG, delivered: rationTotals.proteinG, unit: 'g' },
    { id: 'fat', label: copy.fat, target: nutrientTargets.fatG, delivered: rationTotals.fatG, unit: 'g' },
    { id: 'carbohydrate', label: copy.carbohydrate, target: nutrientTargets.carbohydrateG, delivered: rationTotals.carbohydrateG, unit: 'g' },
    { id: 'fiber', label: copy.fiber, target: nutrientTargets.fiberG, delivered: rationTotals.fiberG, unit: 'g' },
    { id: 'calcium', label: lang === 'es' ? 'Calcio' : 'Calcium', target: nutrientTargets.calciumMg, delivered: rationTotals.calciumMg, unit: 'mg' },
    { id: 'phosphorus', label: lang === 'es' ? 'Fosforo' : 'Phosphorus', target: nutrientTargets.phosphorusMg, delivered: rationTotals.phosphorusMg, unit: 'mg' },
    { id: 'sodium', label: lang === 'es' ? 'Sodio' : 'Sodium', target: nutrientTargets.sodiumMg, delivered: rationTotals.sodiumMg, unit: 'mg' },
    { id: 'potassium', label: lang === 'es' ? 'Potasio' : 'Potassium', target: nutrientTargets.potassiumMg, delivered: rationTotals.potassiumMg, unit: 'mg' },
    { id: 'magnesium', label: lang === 'es' ? 'Magnesio' : 'Magnesium', target: nutrientTargets.magnesiumMg, delivered: rationTotals.magnesiumMg, unit: 'mg' },
    { id: 'zinc', label: 'Zinc', target: nutrientTargets.zincMg, delivered: rationTotals.zincMg, unit: 'mg' },
    { id: 'taurine', label: lang === 'es' ? 'Taurina' : 'Taurine', target: nutrientTargets.taurineMg, delivered: rationTotals.taurineMg, unit: 'mg' },
  ];

  const macroBalance = numericTargets.proteinPercent + numericTargets.fatPercent + numericTargets.carbohydratePercent;

  const searchUsdaFoods = async () => {
    if (!service || !usdaQuery.trim()) return;

    setUsdaLoading(true);
    setUsdaError('');
    setUsdaHasSearched(true);
    try {
      const results = await service.searchUsdaFoods({ query: usdaQuery, species });
      setUsdaResults(results);
    } catch (_error) {
      setUsdaError(copy.usdaLoadError);
    } finally {
      setUsdaLoading(false);
    }
  };

  const addUsdaFoodToRation = (food: FoodIngredientRecord) => {
    setFoods((current) => mergeById(current, [food]));
    setRationRows((current) => [...current, { id: buildRowId(), foodId: food.id, grams: '50' }]);
  };

  return (
    <section className="toolkit-utility nutrition-toolkit">
      <div className="toolkit-utility-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h3>{copy.title}</h3>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolkit-utility-note">
          <strong>{copy.patientProfile}</strong>
          <p>{copy.disclaimer}</p>
        </div>
      </div>

      <section className="toolkit-utility-card nutrition-profile-card">
        <div className="toolkit-utility-form">
          <label>
            {copy.species}
            <select value={species} onChange={(event) => setSpecies(event.target.value as SupportedSpecies)}>
              {speciesOptions.map((option) => (
                <option key={option} value={option}>
                  {speciesLabels[option][lang]}
                </option>
              ))}
            </select>
          </label>

          <label>
            {copy.currentWeight}
            <input type="number" min="0.1" step="0.1" value={currentWeight} onChange={(event) => setCurrentWeight(event.target.value)} />
          </label>

          <label>
            {copy.idealWeight}
            <input type="number" min="0.1" step="0.1" value={idealWeight} onChange={(event) => setIdealWeight(event.target.value)} />
          </label>

          <label>
            {copy.hospitalizationPlan}
            <select value={hospitalPlan} onChange={(event) => setHospitalPlan(event.target.value as HospitalPlanKey)}>
              {(Object.keys(hospitalFactors) as HospitalPlanKey[]).map((option) => (
                <option key={option} value={option}>
                  {hospitalFactors[option].label[lang]}
                </option>
              ))}
            </select>
          </label>

          <label>
            {copy.intakePercent}
            <input type="number" min="0" max="150" step="5" value={intakePercent} onChange={(event) => setIntakePercent(event.target.value)} />
          </label>
        </div>
      </section>

      <div className="subtabs nutrition-subtabs" role="tablist" aria-label={copy.title}>
        <button onClick={() => setView('energy')} className={view === 'energy' ? 'active' : ''}>
          {copy.energyNav}
        </button>
        <button onClick={() => setView('diets')} className={view === 'diets' ? 'active' : ''}>
          {copy.dietsNav}
        </button>
        <button onClick={() => setView('targets')} className={view === 'targets' ? 'active' : ''}>
          {copy.targetsNav}
        </button>
        <button onClick={() => setView('homemade')} className={view === 'homemade' ? 'active' : ''}>
          {copy.homemadeNav}
        </button>
      </div>

      {loading && <div className="toolkit-source-note">{copy.loading}</div>}
      {loadError && <div className="toolkit-source-note">{loadError}</div>}

      {view === 'energy' && (
        <>
          <div className="toolkit-utility-grid nutrition-metric-grid">
            <section className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.rer}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(rer, 0)}</strong>
                <span>kcal/d</span>
              </div>
              <p className="toolkit-utility-equation">{copy.energyFormula}</p>
            </section>

            <section className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.energyTarget}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(energyTarget, 0)}</strong>
                <span>kcal/d</span>
              </div>
              <p className="toolkit-utility-equation">
                {formatNumber(rer, 0)} x {formatNumber(hospitalFactor, 2)}
              </p>
            </section>

            <section className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.deliveredEnergy}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(deliveredEnergy, 0)}</strong>
                <span>kcal/d</span>
              </div>
              <p className="toolkit-utility-equation">
                {copy.percent}: {intakePercent || '0'}%
              </p>
            </section>

            <section className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.hospitalFactor}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(hospitalFactor, 2)}</strong>
                <span>x</span>
              </div>
              <p className="toolkit-utility-equation">{hospitalFactors[hospitalPlan].label[lang]}</p>
            </section>
          </div>

          <div className="toolkit-utility-help">
            <p>{copy.energyHelp}</p>
          </div>
        </>
      )}

      {view === 'diets' && (
        <div className="nutrition-diet-layout">
          <section className="toolkit-utility-card nutrition-filter-panel">
            <div className="toolkit-reference-header">
              <div>
                <p className="section-kicker">{copy.dietFilters}</p>
                <h4>{copy.availableDiets}</h4>
              </div>
              <span>{filteredDiets.length}</span>
            </div>

            <div className="toolkit-utility-form">
              <label>
                {copy.summary}
                <input type="text" value={dietQuery} onChange={(event) => setDietQuery(event.target.value)} placeholder={copy.searchDiet} />
              </label>

              <label>
                {copy.brand}
                <select value={dietBrand} onChange={(event) => setDietBrand(event.target.value)}>
                  <option value="">{copy.allBrands}</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {copy.indications}
                <select value={dietCondition} onChange={(event) => setDietCondition(event.target.value)}>
                  <option value="">{copy.allConditions}</option>
                  {conditionOptions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {copy.presentations}
                <select value={dietFormat} onChange={(event) => setDietFormat(event.target.value as 'all' | 'dry' | 'wet' | 'mixed')}>
                  <option value="all">{copy.allFormats}</option>
                  <option value="dry">{copy.dry}</option>
                  <option value="wet">{copy.wet}</option>
                  <option value="mixed">{copy.mixed}</option>
                </select>
              </label>
            </div>

            <div className="nutrition-diet-list">
              {filteredDiets.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  className={`nutrition-diet-card ${selectedDiet?.id === diet.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedDietId(diet.id)}
                >
                  <strong>
                    {diet.brandName} · {diet.dietName}
                  </strong>
                  <span>{diet.healthConditions.join(' · ')}</span>
                  <p>{diet.shortDescription[lang]}</p>
                </button>
              ))}
              {filteredDiets.length === 0 && <p>{copy.noDiets}</p>}
            </div>
          </section>

          <section className="toolkit-reference-table nutrition-diet-detail">
            {selectedDiet ? (
              <>
                <div className="toolkit-reference-header">
                  <div>
                    <p className="section-kicker">{copy.technicalSheet}</p>
                    <h4>
                      {selectedDiet.brandName} · {selectedDiet.dietName}
                    </h4>
                  </div>
                  <span>{selectedDiet.healthConditions.join(' · ')}</span>
                </div>

                <div className="nutrition-chip-row">
                  <span>{selectedDiet.format === 'dry' ? copy.dry : selectedDiet.format === 'wet' ? copy.wet : copy.mixed}</span>
                  {selectedDiet.presentations.map((item) => (
                    <span key={item.id}>
                      {item.label} ({formatNumber(item.packageSizeG, 0)} g)
                    </span>
                  ))}
                </div>

                <div className="nutrition-copy-grid">
                  {selectedDiet.sourceUrl ? (
                    <article className="toolkit-source-note nutrition-span-full">
                      <strong>{copy.officialSource}</strong>
                      <a href={selectedDiet.sourceUrl} target="_blank" rel="noreferrer">
                        {copy.openOfficialSheet}
                      </a>
                    </article>
                  ) : null}
                  <article className="toolkit-source-note">
                    <strong>{copy.summary}</strong>
                    <p>{selectedDiet.shortDescription[lang]}</p>
                  </article>
                  <article className="toolkit-source-note">
                    <strong>{copy.composition}</strong>
                    <p>{selectedDiet.composition[lang]}</p>
                  </article>
                  <article className="toolkit-source-note">
                    <strong>{copy.indications}</strong>
                    <p>{selectedDiet.indications[lang]}</p>
                  </article>
                  {selectedDiet.contraindications ? (
                    <article className="toolkit-source-note">
                      <strong>{copy.contraindications}</strong>
                      <p>{selectedDiet.contraindications[lang]}</p>
                    </article>
                  ) : null}
                  <article className="toolkit-source-note nutrition-span-full">
                    <strong>{copy.technicalSheet}</strong>
                    <p>{selectedDiet.technicalSheet[lang]}</p>
                  </article>
                </div>

                {selectedDiet.nutrientProfile.energyKcalPer100g !== undefined ? (
                  <div className="nutrition-micro-grid">
                    <article className="haemo-metric-card">
                      <span>{copy.energyTarget}</span>
                      <strong>{formatNumber(selectedDiet.nutrientProfile.energyKcalPer100g, 0)} kcal/100 g</strong>
                    </article>
                    <article className="haemo-metric-card">
                      <span>{copy.protein}</span>
                      <strong>{formatNumber(selectedDiet.nutrientProfile.proteinPercentDm ?? 0)}% DM</strong>
                    </article>
                    <article className="haemo-metric-card">
                      <span>{copy.fat}</span>
                      <strong>{formatNumber(selectedDiet.nutrientProfile.fatPercentDm ?? 0)}% DM</strong>
                    </article>
                    <article className="haemo-metric-card">
                      <span>{copy.fiber}</span>
                      <strong>{formatNumber(selectedDiet.nutrientProfile.fiberPercentDm ?? 0)}% DM</strong>
                    </article>
                    <article className="haemo-metric-card">
                      <span>{copy.carbohydrate}</span>
                      <strong>{formatNumber(selectedDiet.nutrientProfile.carbohydratePercentDm ?? 0)}% DM</strong>
                    </article>
                    <article className="haemo-metric-card">
                      <span>{copy.micronutrients}</span>
                      <strong>
                        P {formatNumber(selectedDiet.nutrientProfile.phosphorusPercentDm ?? 0, 2)}% · Na{' '}
                        {formatNumber(selectedDiet.nutrientProfile.sodiumPercentDm ?? 0, 2)}%
                      </strong>
                    </article>
                  </div>
                ) : (
                  <div className="toolkit-source-note">{copy.noTechnicalData}</div>
                )}

                {selectedDiet.presentations.length > 0 && (
                  <div className="toolkit-table-shell">
                    <table className="toolkit-table">
                      <thead>
                        <tr>
                          <th>{copy.presentations}</th>
                          <th>{copy.summary}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDiet.presentations.map((item) => (
                          <tr key={item.id}>
                            <td>{item.label}</td>
                            <td>
                              {item.target === 'small_breed'
                                ? lang === 'es'
                                  ? 'Raza pequena'
                                  : 'Small breed'
                                : item.target === 'wet'
                                  ? copy.wet
                                  : 'General'}{' '}
                              · {item.format === 'dry' ? copy.dry : item.format === 'wet' ? copy.wet : copy.mixed}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedDiet.feedingGuide.length > 0 && (
                  <div className="toolkit-table-shell">
                    <table className="toolkit-table">
                      <thead>
                        <tr>
                          <th>{copy.species}</th>
                          <th>{copy.currentWeight}</th>
                          <th>{copy.feedingGuide}</th>
                          <th>{copy.notes}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDiet.feedingGuide.map((row) => (
                          <tr key={row.id}>
                            <td>{speciesLabels[row.species as SupportedSpecies]?.[lang] ?? row.species}</td>
                            <td>{formatNumber(row.bodyWeightKg, 1)}</td>
                            <td>{row.dailyAmountLabel ?? `${formatNumber(row.dailyAmountG, 0)} g/d`}</td>
                            <td>{row.notes ?? '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p>{copy.noDiets}</p>
            )}
          </section>
        </div>
      )}

      {view === 'targets' && (
        <>
          <section className="toolkit-utility-card">
            <div className="toolkit-utility-form">
              <label>
                {copy.preset}
                <select
                  value={selectedRequirementPreset}
                  onChange={(event) => setSelectedRequirementPreset(event.target.value as RequirementPresetKey)}
                >
                  {(Object.keys(requirementPresets) as RequirementPresetKey[])
                    .filter((key) => requirementPresets[key].species === species)
                    .map((key) => (
                      <option key={key} value={key}>
                        {requirementPresets[key].label[lang]}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                {copy.protein} ({copy.percent})
                <input type="number" min="0" max="100" step="1" value={proteinPercent} onChange={(event) => setProteinPercent(event.target.value)} />
              </label>

              <label>
                {copy.fat} ({copy.percent})
                <input type="number" min="0" max="100" step="1" value={fatPercent} onChange={(event) => setFatPercent(event.target.value)} />
              </label>

              <label>
                {copy.carbohydrate} ({copy.percent})
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={carbohydratePercent}
                  onChange={(event) => setCarbohydratePercent(event.target.value)}
                />
              </label>

              <label>
                {copy.fiber} (g/1000 kcal)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fiberGPer1000Kcal}
                  onChange={(event) => setFiberGPer1000Kcal(event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="toolkit-utility-help">
            <p>{copy.targetBreakdown}</p>
            <p>
              {copy.macroBalance}: {formatNumber(macroBalance, 0)}%
            </p>
          </div>

          <div className="nutrition-target-grid">
            <section className="toolkit-utility-card">
              <div className="toolkit-reference-header">
                <div>
                  <p className="section-kicker">{copy.protein}</p>
                  <h4>{copy.gPerDay}</h4>
                </div>
                <span>{formatNumber(nutrientTargets.proteinG)} g</span>
              </div>
              <div className="nutrition-target-summary">
                <span>{copy.fat}</span>
                <strong>{formatNumber(nutrientTargets.fatG)} g</strong>
                <span>{copy.carbohydrate}</span>
                <strong>{formatNumber(nutrientTargets.carbohydrateG)} g</strong>
                <span>{copy.fiber}</span>
                <strong>{formatNumber(nutrientTargets.fiberG)} g</strong>
              </div>
            </section>

            <section className="toolkit-utility-card">
              <div className="toolkit-reference-header">
                <div>
                  <p className="section-kicker">{copy.micronutrients}</p>
                  <h4>{copy.mgPerDay}</h4>
                </div>
                <span>{formatNumber(energyTarget, 0)} kcal/d</span>
              </div>
              <div className="nutrition-micronutrient-form">
                <label>
                  Calcio ({copy.mgPer1000})
                  <input type="number" min="0" step="10" value={calciumMgPer1000Kcal} onChange={(event) => setCalciumMgPer1000Kcal(event.target.value)} />
                </label>
                <label>
                  Fosforo ({copy.mgPer1000})
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={phosphorusMgPer1000Kcal}
                    onChange={(event) => setPhosphorusMgPer1000Kcal(event.target.value)}
                  />
                </label>
                <label>
                  Sodio ({copy.mgPer1000})
                  <input type="number" min="0" step="10" value={sodiumMgPer1000Kcal} onChange={(event) => setSodiumMgPer1000Kcal(event.target.value)} />
                </label>
                <label>
                  Potasio ({copy.mgPer1000})
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={potassiumMgPer1000Kcal}
                    onChange={(event) => setPotassiumMgPer1000Kcal(event.target.value)}
                  />
                </label>
                <label>
                  Magnesio ({copy.mgPer1000})
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={magnesiumMgPer1000Kcal}
                    onChange={(event) => setMagnesiumMgPer1000Kcal(event.target.value)}
                  />
                </label>
                <label>
                  Zinc ({copy.mgPer1000})
                  <input type="number" min="0" step="1" value={zincMgPer1000Kcal} onChange={(event) => setZincMgPer1000Kcal(event.target.value)} />
                </label>
                <label>
                  Taurina ({copy.mgPer1000})
                  <input type="number" min="0" step="10" value={taurineMgPer1000Kcal} onChange={(event) => setTaurineMgPer1000Kcal(event.target.value)} />
                </label>
              </div>
            </section>
          </div>

          <div className="toolkit-table-shell">
            <table className="toolkit-table">
              <thead>
                <tr>
                  <th>{copy.nutrient}</th>
                  <th>{copy.target}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td>
                      {formatNumber(row.target)} {row.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'homemade' && (
        <>
          <section className="toolkit-utility-card">
            <div className="toolkit-reference-header">
              <div>
                <p className="section-kicker">{copy.homemadeTitle}</p>
                <h4>{copy.totalDelivered}</h4>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setRationRows((current) => [
                    ...current,
                    { id: buildRowId(), foodId: availableFoodsBySpecies[0]?.id ?? '', grams: '50' },
                  ])
                }
              >
                {copy.addIngredient}
              </button>
            </div>

            <div className="nutrition-ration-list">
              {rationRows.map((row) => (
                <div key={row.id} className="nutrition-ration-row">
                  <label>
                    {copy.ingredient}
                    <select
                      value={row.foodId}
                      onChange={(event) =>
                        setRationRows((current) =>
                          current.map((item) => (item.id === row.id ? { ...item, foodId: event.target.value } : item)),
                        )
                      }
                    >
                      {availableFoodsBySpecies.map((food) => (
                        <option key={food.id} value={food.id}>
                          {food.foodName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {copy.grams}
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={row.grams}
                      onChange={(event) =>
                        setRationRows((current) =>
                          current.map((item) => (item.id === row.id ? { ...item, grams: event.target.value } : item)),
                        )
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setRationRows((current) => current.filter((item) => item.id !== row.id))}
                    disabled={rationRows.length === 1}
                  >
                    {copy.remove}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="nutrition-metric-grid">
            <article className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.totalDelivered}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(rationTotals.energyKcal, 0)}</strong>
                <span>kcal</span>
              </div>
            </article>
            <article className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.protein}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(rationTotals.proteinG)}</strong>
                <span>g</span>
              </div>
            </article>
            <article className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.fat}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(rationTotals.fatG)}</strong>
                <span>g</span>
              </div>
            </article>
            <article className="toolkit-utility-card result-card">
              <p className="section-kicker">{copy.carbohydrate}</p>
              <div className="toolkit-utility-result">
                <strong>{formatNumber(rationTotals.carbohydrateG)}</strong>
                <span>g</span>
              </div>
            </article>
          </div>

          <div className="toolkit-table-shell">
            <table className="toolkit-table">
              <thead>
                <tr>
                  <th>{copy.nutrient}</th>
                  <th>{copy.target}</th>
                  <th>{copy.delivered}</th>
                  <th>{copy.coverage}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => {
                  const coverage = row.target > 0 ? (row.delivered / row.target) * 100 : 0;
                  return (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>
                        {formatNumber(row.target)} {row.unit}
                      </td>
                      <td>
                        {formatNumber(row.delivered)} {row.unit}
                      </td>
                      <td>{formatNumber(coverage, 0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section className="toolkit-reference-table">
            <div className="toolkit-reference-header">
              <div>
                <p className="section-kicker">{copy.foodDatabase}</p>
                <h4>{copy.foodSearch}</h4>
              </div>
              <span>{compatibleFoods.length}</span>
            </div>

            <div className="toolkit-utility-form nutrition-food-search">
              <label>
                {copy.foodDatabase}
                <input type="text" value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} placeholder={copy.foodSearch} />
              </label>
            </div>

            <div className="toolkit-table-shell">
              <table className="toolkit-table">
                <thead>
                  <tr>
                    <th>{copy.ingredient}</th>
                    <th>{copy.summary}</th>
                    <th>kcal/100 g</th>
                    <th>{copy.protein}</th>
                    <th>{copy.fat}</th>
                    <th>{copy.carbohydrate}</th>
                    <th>{copy.fiber}</th>
                    <th>{copy.notes}</th>
                  </tr>
                </thead>
                <tbody>
                  {compatibleFoods.map((food) => (
                    <tr key={food.id}>
                      <td>{food.foodName}</td>
                      <td>
                        {food.category} · {food.preparation}
                      </td>
                      <td>{formatNumber(food.nutrientsPer100g.energyKcal, 0)}</td>
                      <td>{formatNumber(food.nutrientsPer100g.proteinG)}</td>
                      <td>{formatNumber(food.nutrientsPer100g.fatG)}</td>
                      <td>{formatNumber(food.nutrientsPer100g.carbohydrateG)}</td>
                      <td>{formatNumber(food.nutrientsPer100g.fiberG)}</td>
                      <td>{food.notes?.[lang] ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {compatibleFoods.length === 0 && <p>{copy.noFoods}</p>}
          </section>

          <section className="toolkit-reference-table nutrition-usda-panel">
            <div className="toolkit-reference-header">
              <div>
                <p className="section-kicker">USDA FoodData Central</p>
                <h4>{copy.usdaSearchTitle}</h4>
                <p>{copy.usdaSearchHelp}</p>
              </div>
              <span>{usdaResults.length}</span>
            </div>

            <div className="toolkit-utility-form nutrition-food-search">
              <label>
                {copy.usdaSearch}
                <input
                  type="text"
                  value={usdaQuery}
                  onChange={(event) => {
                    setUsdaQuery(event.target.value);
                    setUsdaHasSearched(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void searchUsdaFoods();
                    }
                  }}
                  placeholder={lang === 'es' ? 'pollo cocido, arroz, huevo...' : 'cooked chicken, rice, egg...'}
                  disabled={!service}
                />
              </label>
              <button type="button" className="primary-button" onClick={() => void searchUsdaFoods()} disabled={!service || usdaLoading}>
                {usdaLoading ? (lang === 'es' ? 'Buscando...' : 'Searching...') : copy.usdaSearch}
              </button>
            </div>

            {!service && <p className="toolkit-source-note">{copy.usdaUnavailable}</p>}
            {usdaError && <p className="form-error">{usdaError}</p>}

            {usdaResults.length > 0 && (
              <div className="toolkit-table-shell">
                <table className="toolkit-table">
                  <thead>
                    <tr>
                      <th>{copy.ingredient}</th>
                      <th>{copy.summary}</th>
                      <th>kcal/100 g</th>
                      <th>{copy.protein}</th>
                      <th>{copy.fat}</th>
                      <th>{copy.carbohydrate}</th>
                      <th>{copy.fiber}</th>
                      <th>{copy.addIngredient}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usdaResults.map((food) => (
                      <tr key={food.id}>
                        <td>{food.foodName}</td>
                        <td>
                          {food.category} · {food.preparation}
                        </td>
                        <td>{formatNumber(food.nutrientsPer100g.energyKcal, 0)}</td>
                        <td>{formatNumber(food.nutrientsPer100g.proteinG)}</td>
                        <td>{formatNumber(food.nutrientsPer100g.fatG)}</td>
                        <td>{formatNumber(food.nutrientsPer100g.carbohydrateG)}</td>
                        <td>{formatNumber(food.nutrientsPer100g.fiberG)}</td>
                        <td>
                          <button type="button" className="secondary-button compact-button" onClick={() => addUsdaFoodToRation(food)}>
                            {copy.addToRation}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {service && usdaHasSearched && !usdaLoading && !usdaError && usdaResults.length === 0 && <p>{copy.usdaNoResults}</p>}
          </section>
        </>
      )}
    </section>
  );
}
