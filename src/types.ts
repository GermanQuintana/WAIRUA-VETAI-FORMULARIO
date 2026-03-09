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
