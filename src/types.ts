export type Species =
  | 'Dog'
  | 'Cat'
  | 'Rabbit'
  | 'Ferret'
  | 'Guinea Pig'
  | 'Chinchilla'
  | 'Other Rodents'
  | 'Reptiles'
  | 'Psittacines'
  | 'Raptors'
  | 'Passerines'
  | 'Poultry'
  | 'Equine';

export type EvidenceLevel = 'High' | 'Moderate' | 'Low' | 'Expert Consensus';
export type EditorialStatus = 'draft' | 'under_review' | 'approved';

export interface LocalizedText {
  es: string;
  en: string;
}

export interface ScientificReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  url?: string;
}

export interface TherapeuticEntry {
  id: string;
  activeIngredient: string;
  tradeNames: string[];
  species: Species[];
  tags: string[];
  systems: string[];
  pathologies: string[];
  concentrations: string[];
  indications: LocalizedText;
  dosage: LocalizedText;
  administrationConditions: LocalizedText;
  adverseEffects: LocalizedText;
  contraindications: LocalizedText;
  interactions: LocalizedText;
  notes?: LocalizedText;
  evidenceLevel: EvidenceLevel;
  editorialStatus: EditorialStatus;
  calculatorPresets?: DoseCalculatorPreset[];
  references: ScientificReference[];
  cimavet?: {
    nregistro?: string;
    url?: string;
    nameQuery?: string;
  };
  lastUpdated: string;
}

export interface DoseCalculatorPreset {
  id: string;
  category: LocalizedText;
  species: Species[];
  route: string;
  indication: LocalizedText;
  doseRangeMgKg: {
    min: number;
    max: number;
  };
  defaultDoseMgKg: number;
  concentration: {
    es: string;
    en: string;
    mgPerMl?: number;
    mgPerTablet?: number;
  };
  references?: ScientificReference[];
}

export interface DoseCalculatorEntry {
  id: string;
  activeIngredient: string;
  category: LocalizedText;
  species: Species[];
  route: string;
  indication: LocalizedText;
  doseRangeMgKg: {
    min: number;
    max: number;
  };
  defaultDoseMgKg: number;
  concentration: {
    es: string;
    en: string;
    mgPerMl?: number;
    mgPerTablet?: number;
  };
  linkedEntryId?: string;
}

export type ClinicalDietFormat = 'dry' | 'wet' | 'mixed';

export interface ClinicalDietPresentation {
  id: string;
  label: string;
  format: ClinicalDietFormat;
  packageSizeG: number;
  target: 'general' | 'small_breed' | 'wet';
}

export interface ClinicalDietFeedingGuideRow {
  id: string;
  species: Species;
  bodyWeightKg: number;
  dailyAmountG: number;
  dailyAmountLabel?: string;
  notes?: string;
}

export interface ClinicalDietRecord {
  id: string;
  brandName: string;
  dietName: string;
  sourceUrl?: string;
  species: Species[];
  healthConditions: string[];
  format: ClinicalDietFormat;
  shortDescription: LocalizedText;
  composition: LocalizedText;
  indications: LocalizedText;
  contraindications?: LocalizedText;
  technicalSheet: LocalizedText;
  nutrientProfile: {
    energyKcalPer100g?: number;
    proteinPercentDm?: number;
    fatPercentDm?: number;
    fiberPercentDm?: number;
    carbohydratePercentDm?: number;
    phosphorusPercentDm?: number;
    sodiumPercentDm?: number;
    omega3PercentDm?: number;
  };
  presentations: ClinicalDietPresentation[];
  feedingGuide: ClinicalDietFeedingGuideRow[];
}

export interface FoodIngredientRecord {
  id: string;
  foodName: string;
  category: string;
  preparation: string;
  species: Species[];
  notes?: LocalizedText;
  nutrientsPer100g: {
    energyKcal: number;
    proteinG: number;
    fatG: number;
    carbohydrateG: number;
    fiberG: number;
    calciumMg: number;
    phosphorusMg: number;
    sodiumMg: number;
    potassiumMg: number;
    magnesiumMg: number;
    zincMg: number;
    taurineMg: number;
  };
}
