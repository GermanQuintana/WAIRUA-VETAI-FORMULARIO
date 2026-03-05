import { Language } from '../i18n';
import { EvidenceLevel } from '../types';

type TermDictionary = Record<string, { es: string; en: string }>;

const termDictionary: TermDictionary = {
  Dog: { es: 'Perro', en: 'Dog' },
  Cat: { es: 'Gato', en: 'Cat' },
  Rabbit: { es: 'Conejo', en: 'Rabbit' },
  Ferret: { es: 'Huron', en: 'Ferret' },
  'Guinea Pig': { es: 'Cobaya', en: 'Guinea Pig' },
  Chinchilla: { es: 'Chinchilla', en: 'Chinchilla' },
  'Other Rodents': { es: 'Otros roedores', en: 'Other Rodents' },
  Reptiles: { es: 'Reptiles', en: 'Reptiles' },
  Psittacines: { es: 'Psitacidas', en: 'Psittacines' },
  Raptors: { es: 'Rapaces', en: 'Raptors' },
  Passerines: { es: 'Paseriformes', en: 'Passerines' },
  Poultry: { es: 'Aves de produccion', en: 'Poultry' },
  Equine: { es: 'Caballos', en: 'Equine' },
  'Infectious Diseases': { es: 'Enfermedades infecciosas', en: 'Infectious Diseases' },
  Dermatology: { es: 'Dermatologia', en: 'Dermatology' },
  Respiratory: { es: 'Respiratorio', en: 'Respiratory' },
  Gastroenterology: { es: 'Gastroenterologia', en: 'Gastroenterology' },
  'Oncology Support': { es: 'Soporte oncologico', en: 'Oncology Support' },
  Analgesia: { es: 'Analgesia', en: 'Analgesia' },
  Orthopedics: { es: 'Ortopedia', en: 'Orthopedics' },
  Inflammation: { es: 'Inflamacion', en: 'Inflammation' },
  'Avian Medicine': { es: 'Medicina aviar', en: 'Avian Medicine' },
  Exotics: { es: 'Exoticos', en: 'Exotics' },
  Urology: { es: 'Urologia', en: 'Urology' },
  Pyoderma: { es: 'Pioderma', en: 'Pyoderma' },
  'Upper Respiratory Infection': { es: 'Infeccion respiratoria alta', en: 'Upper Respiratory Infection' },
  'Soft Tissue Infection': { es: 'Infeccion de tejidos blandos', en: 'Soft Tissue Infection' },
  'Acute Vomiting': { es: 'Vomito agudo', en: 'Acute Vomiting' },
  'Motion Sickness': { es: 'Cinetosis', en: 'Motion Sickness' },
  'Chemotherapy-Induced Nausea': { es: 'Nausea inducida por quimioterapia', en: 'Chemotherapy-Induced Nausea' },
  'Postoperative Pain': { es: 'Dolor postoperatorio', en: 'Postoperative Pain' },
  Osteoarthritis: { es: 'Osteoartritis', en: 'Osteoarthritis' },
  'Inflammatory Conditions': { es: 'Procesos inflamatorios', en: 'Inflammatory Conditions' },
  Dermatophytosis: { es: 'Dermatofitosis', en: 'Dermatophytosis' },
  Aspergillosis: { es: 'Aspergilosis', en: 'Aspergillosis' },
  'Systemic Mycoses': { es: 'Micosis sistemicas', en: 'Systemic Mycoses' },
  'Complicated UTI': { es: 'ITU complicada', en: 'Complicated UTI' },
  Pneumonia: { es: 'Neumonia', en: 'Pneumonia' },
  'Gram-negative infections': { es: 'Infecciones por gramnegativos', en: 'Gram-negative infections' },
};

const evidenceLabels: Record<EvidenceLevel, { es: string; en: string }> = {
  High: { es: 'Alta', en: 'High' },
  Moderate: { es: 'Moderada', en: 'Moderate' },
  Low: { es: 'Baja', en: 'Low' },
  'Expert Consensus': { es: 'Consenso experto', en: 'Expert Consensus' },
};

export const translateMedicalTerm = (term: string, lang: Language) => {
  const found = termDictionary[term];
  return found ? found[lang] : term;
};

export const translateMedicalTerms = (values: string[], lang: Language) =>
  values.map((value) => translateMedicalTerm(value, lang));

export const translateEvidenceLevel = (evidence: EvidenceLevel, lang: Language) => evidenceLabels[evidence][lang];

export const expandMedicalTermAliases = (term: string) => {
  const found = termDictionary[term];
  const set = new Set<string>([term.toLowerCase()]);

  if (found) {
    set.add(found.es.toLowerCase());
    set.add(found.en.toLowerCase());
  }

  return Array.from(set);
};
