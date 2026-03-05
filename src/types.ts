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
  systems: string[];
  pathologies: string[];
  indications: LocalizedText;
  dosage: LocalizedText;
  contraindications: LocalizedText;
  notes?: LocalizedText;
  evidenceLevel: EvidenceLevel;
  references: ScientificReference[];
  cimavet?: {
    nregistro?: string;
    url?: string;
    nameQuery?: string;
  };
  lastUpdated: string;
}
