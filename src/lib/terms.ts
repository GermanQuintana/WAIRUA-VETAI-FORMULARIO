import { Language } from '../i18n';
import { EditorialStatus, EvidenceLevel, PublicationStatus } from '../types';

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
  Bovine: { es: 'Bovino', en: 'Bovine' },
  Ovine: { es: 'Ovino', en: 'Ovine' },
  Caprine: { es: 'Caprino', en: 'Caprine' },
  Porcine: { es: 'Porcino', en: 'Porcine' },
  Fish: { es: 'Peces', en: 'Fish' },
  Bee: { es: 'Abejas', en: 'Bee' },
  Dermatologia: { es: 'Dermatologia', en: 'Dermatology' },
  Dermatologicos: { es: 'Dermatologicos', en: 'Dermatologics' },
  'Diagnostico por imagen': { es: 'Diagnostico por imagen', en: 'Diagnostic Imaging' },
  Digestivo: { es: 'Digestivo', en: 'Digestive' },
  Endocrino: { es: 'Endocrino', en: 'Endocrinology' },
  Fluidoterapia: { es: 'Fluidoterapia', en: 'Fluid Therapy' },
  'Hemoterapia y oncologia': { es: 'Hemoterapia y oncologia', en: 'Hemotherapy and Oncology' },
  'Medicina del comportamiento': { es: 'Medicina del comportamiento', en: 'Behavioral Medicine' },
  'Medicina interna': { es: 'Medicina interna', en: 'Internal Medicine' },
  Neurologia: { es: 'Neurologia', en: 'Neurology' },
  Nutricion: { es: 'Nutricion', en: 'Nutrition' },
  Oncologia: { es: 'Oncologia', en: 'Oncology' },
  Oftalmologia: { es: 'Oftalmologia', en: 'Ophthalmology' },
  Odontologia: { es: 'Odontologia', en: 'Dentistry' },
  'Organos de los sentidos': { es: 'Organos de los sentidos', en: 'Sense Organs' },
  'Otros farmacos': { es: 'Otros farmacos', en: 'Other Drugs' },
  Reproduccion: { es: 'Reproduccion', en: 'Reproduction' },
  Respiratorio: { es: 'Respiratorio', en: 'Respiratory' },
  'Sistema nervioso': { es: 'Sistema nervioso', en: 'Nervous System' },
  UCI: { es: 'UCI', en: 'ICU' },
  Urgencias: { es: 'Urgencias', en: 'Emergency' },
  'Urinario y nefrologia': { es: 'Urinario y nefrologia', en: 'Urinary and Nephrology' },
  'Antiinfecciosos sistemicos': { es: 'Antiinfecciosos sistemicos', en: 'Systemic Anti-infectives' },
  Antiparasitarios: { es: 'Antiparasitarios', en: 'Antiparasitics' },
  Cardiologia: { es: 'Cardiologia', en: 'Cardiology' },
  'Aparato cardiovascular': { es: 'Aparato cardiovascular', en: 'Cardiovascular System' },
  'Aparato digestivo y metabolismo': { es: 'Aparato digestivo y metabolismo', en: 'Digestive System and Metabolism' },
  'Aparato muscular': { es: 'Aparato muscular', en: 'Musculoskeletal System' },
  'Aparato respiratorio': { es: 'Aparato respiratorio', en: 'Respiratory System' },
  AINEs: { es: 'AINEs', en: 'NSAIDs' },
  'Agentes activos sobre el sistema renina-angiotensina': {
    es: 'Agentes activos sobre el sistema renina-angiotensina',
    en: 'Agents acting on the renin-angiotensin system',
  },
  'Agonistas alfa-adrenergicos': { es: 'Agonistas alfa-adrenergicos', en: 'Alpha-adrenergic agonists' },
  'Agonistas alfa-beta adrenergicos': { es: 'Agonistas alfa-beta adrenergicos', en: 'Alpha-beta adrenergic agonists' },
  Aminoglucosidos: { es: 'Aminoglucosidos', en: 'Aminoglycosides' },
  Analgesicos: { es: 'Analgesicos', en: 'Analgesics' },
  'Analgesicos opioides': { es: 'Analgesicos opioides', en: 'Opioid Analgesics' },
  Anestesicos: { es: 'Anestesicos', en: 'Anesthetics' },
  Ansioliticos: { es: 'Ansioliticos', en: 'Anxiolytics' },
  'Antiacidos y protectores gastricos': { es: 'Antiacidos y protectores gastricos', en: 'Antacids and Gastroprotectants' },
  Antianemicos: { es: 'Antianemicos', en: 'Antianemics' },
  Antiarritmicos: { es: 'Antiarritmicos', en: 'Antiarrhythmics' },
  Antibioticos: { es: 'Antibioticos', en: 'Antibiotics' },
  'Anticuerpos monoclonales': { es: 'Anticuerpos monoclonales', en: 'Monoclonal antibodies' },
  Anticonvulsivantes: { es: 'Anticonvulsivantes', en: 'Anticonvulsants' },
  Antidepresivos: { es: 'Antidepresivos', en: 'Antidepressants' },
  Antiemeticos: { es: 'Antiemeticos', en: 'Antiemetics' },
  Antiepilepticos: { es: 'Antiepilepticos', en: 'Antiepileptics' },
  Antifilaricos: { es: 'Antifilaricos', en: 'Antifilarials' },
  Antifungicos: { es: 'Antifungicos', en: 'Antifungals' },
  Antihemorragicos: { es: 'Antihemorragicos', en: 'Antihemorrhagics' },
  Antihistaminicos: { es: 'Antihistaminicos', en: 'Antihistamines' },
  Antileishmanicos: { es: 'Antileishmanicos', en: 'Antileishmanials' },
  Antitromboticos: { es: 'Antitromboticos', en: 'Antithrombotics' },
  'Antiinflamatorios no esteroideos (AINE)': {
    es: 'Antiinflamatorios no esteroideos (AINE)',
    en: 'Non-steroidal Anti-inflammatory Drugs (NSAIDs)',
  },
  Antiinflamatorios: { es: 'Antiinflamatorios', en: 'Anti-inflammatory agents' },
  'Antiparasitarios externos': { es: 'Antiparasitarios externos', en: 'External antiparasitics' },
  'Antiparasitarios internos': { es: 'Antiparasitarios internos', en: 'Internal antiparasitics' },
  Antipruriginosos: { es: 'Antipruriginosos', en: 'Antipruritics' },
  Antivirales: { es: 'Antivirales', en: 'Antivirals' },
  'Avermectinas y milbemicinas': { es: 'Avermectinas y milbemicinas', en: 'Avermectins and Milbemycins' },
  Babesicidas: { es: 'Babesicidas', en: 'Babesiacides' },
  Benzimidazoles: { es: 'Benzimidazoles', en: 'Benzimidazoles' },
  Biologicos: { es: 'Biologicos', en: 'Biologics' },
  'Bloqueantes de los canales de calcio': { es: 'Bloqueantes de los canales de calcio', en: 'Calcium channel blockers' },
  Champuterapia: { es: 'Champuterapia', en: 'Shampoo therapy' },
  Citostaticos: { es: 'Citostaticos', en: 'Cytostatics' },
  Cristaloides: { es: 'Cristaloides', en: 'Crystalloids' },
  Corticoesteroides: { es: 'Corticoesteroides', en: 'Corticosteroids' },
  Diureticos: { es: 'Diureticos', en: 'Diuretics' },
  'Estimulantes cardiacos': { es: 'Estimulantes cardiacos', en: 'Cardiac stimulants' },
  'Glucosidos digitalicos': { es: 'Glucosidos digitalicos', en: 'Cardiac glycosides' },
  Hepatoprotectores: { es: 'Hepatoprotectores', en: 'Hepatoprotectants' },
  'Homeostasis del calcio': { es: 'Homeostasis del calcio', en: 'Calcium homeostasis' },
  Hormonas: { es: 'Hormonas', en: 'Hormones' },
  Inmunomoduladores: { es: 'Inmunomoduladores', en: 'Immunomodulators' },
  Inmunosupresores: { es: 'Inmunosupresores', en: 'Immunosuppressants' },
  Interferones: { es: 'Interferones', en: 'Interferons' },
  Isoxazolinas: { es: 'Isoxazolinas', en: 'Isoxazolines' },
  Otologicos: { es: 'Otologicos', en: 'Otologics' },
  Penicilinas: { es: 'Penicilinas', en: 'Penicillins' },
  Probioticos: { es: 'Probioticos', en: 'Probiotics' },
  Fluoroquinolonas: { es: 'Fluoroquinolonas', en: 'Fluoroquinolones' },
  'Soluciones osmoticas diureticas': { es: 'Soluciones osmoticas diureticas', en: 'Osmotic diuretic solutions' },
  'Vasodilatadores no IECA': { es: 'Vasodilatadores no IECA', en: 'Non-ACEI vasodilators' },
  Vacunas: { es: 'Vacunas', en: 'Vaccines' },
  Vitaminas: { es: 'Vitaminas', en: 'Vitamins' },
  Neurology: { es: 'Neurologia', en: 'Neurology' },
  'Internal Medicine': { es: 'Medicina interna', en: 'Internal Medicine' },
  Emergency: { es: 'Urgencias', en: 'Emergency' },
  Anesthesia: { es: 'Anestesia', en: 'Anesthesia' },
  'Critical Care': { es: 'UCI', en: 'Critical Care' },
  Monitoring: { es: 'Monitorizacion', en: 'Monitoring' },
  Oncology: { es: 'Oncologia', en: 'Oncology' },
  'Pain Management': { es: 'Manejo del dolor', en: 'Pain Management' },
  Avian: { es: 'Aviar', en: 'Avian' },
  'Antibiotic Stewardship': { es: 'Uso responsable de antibioticos', en: 'Antibiotic Stewardship' },
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
  'Seizure Control': { es: 'Control de crisis', en: 'Seizure Control' },
  'Epilepsy Management': { es: 'Manejo de epilepsia', en: 'Epilepsy Management' },
};

const evidenceLabels: Record<EvidenceLevel, { es: string; en: string }> = {
  High: { es: 'Alta', en: 'High' },
  Moderate: { es: 'Moderada', en: 'Moderate' },
  Low: { es: 'Baja', en: 'Low' },
  'Expert Consensus': { es: 'Consenso experto', en: 'Expert Consensus' },
};

const editorialStatusLabels: Record<EditorialStatus, { es: string; en: string }> = {
  draft: { es: 'Borrador', en: 'Draft' },
  under_review: { es: 'En revision', en: 'Under review' },
  approved: { es: 'Aprobado', en: 'Approved' },
};

const publicationStatusLabels: Record<PublicationStatus, { es: string; en: string }> = {
  pending_activation: { es: 'Pendiente de activar', en: 'Pending activation' },
  active: { es: 'Activo', en: 'Active' },
  rejected: { es: 'Rechazado', en: 'Rejected' },
};

export const translateMedicalTerm = (term: string, lang: Language) => {
  const found = termDictionary[term];
  return found ? found[lang] : term;
};

export const translateMedicalTerms = (values: string[], lang: Language) =>
  values.map((value) => translateMedicalTerm(value, lang));

export const translateEvidenceLevel = (evidence: EvidenceLevel, lang: Language) => evidenceLabels[evidence][lang];

export const translateEditorialStatus = (status: EditorialStatus, lang: Language) => editorialStatusLabels[status][lang];

export const translatePublicationStatus = (status: PublicationStatus, lang: Language) => publicationStatusLabels[status][lang];

export const expandMedicalTermAliases = (term: string) => {
  const found = termDictionary[term];
  const set = new Set<string>([term.toLowerCase()]);

  if (found) {
    set.add(found.es.toLowerCase());
    set.add(found.en.toLowerCase());
  }

  return Array.from(set);
};
