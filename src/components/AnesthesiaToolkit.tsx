import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';

interface Props {
  lang: Language;
}

type Species = 'dog' | 'cat';
type CalculationMode = 'single' | 'cri' | 'tablet';
type DoseUnit =
  | 'mg/kg'
  | 'mcg/kg'
  | 'IU/kg'
  | 'mmol/kg'
  | 'g/kg'
  | 'ml/kg'
  | 'mg/kg/min'
  | 'mcg/kg/min'
  | 'mg/kg/h'
  | 'mcg/kg/h'
  | 'mcg/m²'
  | 'mg/m²'
  | 'mU/kg/min';
type ConcentrationUnit = 'mg/ml' | 'mcg/ml' | 'IU/ml' | 'mmol/ml' | 'g/ml' | 'ml/ml' | 'mU/ml' | 'mg/tablet';

interface ConcentrationOption {
  label: string;
  value: number;
  unit: ConcentrationUnit;
}

interface AnesthesiaDrug {
  id: string;
  name: string;
  nameEn?: string;
  group: string;
  groupEn?: string;
  route: string;
  species: Species[];
  mode: CalculationMode;
  dose: number;
  doseMin?: number;
  doseMax?: number;
  doseUnit: DoseUnit;
  doseLabel: string;
  concentrations: ConcentrationOption[];
  notes?: string;
  notesEn?: string;
  source?: {
    label: string;
    url: string;
  };
}

interface PatientData {
  species: Species;
  breed: string;
  name: string;
  chip: string;
  weight: string;
}

interface DrugResult {
  amount: number;
  amountUnit: string;
  concentration: ConcentrationOption;
  dose: number;
  doseUnit: DoseUnit;
  drug: AnesthesiaDrug;
  maxAmount: number;
  maxVolume: number | null;
  minAmount: number;
  minVolume: number | null;
  volume: number | null;
  volumeLabel: string;
}

interface AnesthesiaSettings {
  concentrationSelection: Record<string, number>;
  customConcentrations: Record<string, string>;
  doseOverrides: Record<string, string>;
  enabled: Record<string, boolean>;
  hideUnavailable: boolean;
}

interface AnesthesiaProfile extends AnesthesiaSettings {
  id: string;
  name: string;
  updatedAt: string;
}

const STORAGE_KEY = 'wairua-anesthesia-toolkit-v1';

const copy = {
  es: {
    kicker: 'Anestesia y quirofano',
    title: 'Hoja rapida de anestesia',
    text:
      'Calcula una hoja determinista por paciente con farmacos seleccionados, concentracion real disponible y volumen listo para imprimir o guardar como PDF.',
    patient: 'Paciente',
    species: 'Especie',
    dog: 'Perro',
    cat: 'Gato',
    breed: 'Raza',
    name: 'Nombre',
    chip: 'Chip',
    weight: 'Peso en kg',
    inventory: 'Farmacos del centro',
    inventoryHelp: 'Desactiva lo que no tienes y usa concentracion propia cuando haga falta.',
    profiles: 'Configuraciones',
    profilesHelp: 'Guarda stock, concentraciones y dosis preferidas por anestesista o clinica. Los datos del paciente no se guardan.',
    profileName: 'Nombre de configuracion',
    profileSelect: 'Configuracion guardada',
    noProfile: 'Sin configuracion',
    saveProfile: 'Guardar configuracion',
    loadProfile: 'Cargar',
    deleteProfile: 'Eliminar',
    hideUnavailable: 'Ocultar no disponibles',
    print: 'Imprimir / PDF',
    reset: 'Reactivar todos',
    selected: 'Seleccionados',
    available: 'Disponible',
    unavailable: 'No disponible',
    customDose: 'Dosis propia',
    customConcentration: 'Conc. propia',
    concentration: 'Concentracion',
    drug: 'Farmaco',
    route: 'Via',
    dose: 'Dosis',
    doseRange: 'Rango',
    selectedDose: 'Elegida',
    amount: 'Cantidad',
    volume: 'Volumen elegido',
    volumeRange: 'Rango volumen',
    notes: 'Notas',
    source: 'Fuente',
    sheetTitle: 'Hoja de anestesia',
    noWeight: 'Introduce peso',
    speciesWarning: 'Revisar especie',
    disclaimer:
      'Uso orientativo. Confirmar indicacion, ficha tecnica, comorbilidades, presentacion y criterio clinico antes de administrar.',
    pimobendanNote:
      'Pimobendan anadido como recordatorio cardiaco oral: dosis base 0.25 mg/kg cada 12 h en perro; no es farmaco de rescate anestesico.',
    pimobendanIvNote: 'Pauta de ficha tecnica para Vetmedin inyectable: dosis IV unica en perro.',
  },
  en: {
    kicker: 'Anesthesia and theatre',
    title: 'Fast anesthesia sheet',
    text:
      'Build a deterministic per-patient sheet with selected drugs, real available concentration, and printable/PDF-ready volumes.',
    patient: 'Patient',
    species: 'Species',
    dog: 'Dog',
    cat: 'Cat',
    breed: 'Breed',
    name: 'Name',
    chip: 'Microchip',
    weight: 'Weight in kg',
    inventory: 'Clinic drugs',
    inventoryHelp: 'Disable drugs you do not stock and enter a custom concentration when needed.',
    profiles: 'Configurations',
    profilesHelp: 'Save stock, concentrations, and preferred doses by anesthetist or clinic. Patient data is never saved.',
    profileName: 'Configuration name',
    profileSelect: 'Saved configuration',
    noProfile: 'No configuration',
    saveProfile: 'Save configuration',
    loadProfile: 'Load',
    deleteProfile: 'Delete',
    hideUnavailable: 'Hide unavailable',
    print: 'Print / PDF',
    reset: 'Enable all',
    selected: 'Selected',
    available: 'Available',
    unavailable: 'Unavailable',
    customDose: 'Custom dose',
    customConcentration: 'Custom conc.',
    concentration: 'Concentration',
    drug: 'Drug',
    route: 'Route',
    dose: 'Dose',
    doseRange: 'Range',
    selectedDose: 'Selected',
    amount: 'Amount',
    volume: 'Selected volume',
    volumeRange: 'Volume range',
    notes: 'Notes',
    source: 'Source',
    sheetTitle: 'Anesthesia sheet',
    noWeight: 'Enter weight',
    speciesWarning: 'Review species',
    disclaimer:
      'Guidance only. Confirm indication, label/SmPC, comorbidities, presentation, and clinical judgement before administration.',
    pimobendanNote:
      'Pimobendan added as an oral cardiac reminder: base dose 0.25 mg/kg every 12 h in dogs; it is not an anesthetic rescue drug.',
    pimobendanIvNote: 'Label dose for injectable Vetmedin: single IV dose in dogs.',
  },
} as const;

const ANESTHESIA_DRUGS: AnesthesiaDrug[] = [
  {
    id: 'adrenaline',
    name: 'Adrenalina',
    group: 'RCP / rescate',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.01,
    doseMin: 0.01,
    doseMax: 0.01,
    doseUnit: 'mg/kg',
    doseLabel: '0.01 mg/kg',
    concentrations: [
      { label: '0.1 mg/ml (1:10.000)', value: 0.1, unit: 'mg/ml' },
      { label: '1 mg/ml (1:1.000)', value: 1, unit: 'mg/ml' },
      { label: '0.01 mg/ml', value: 0.01, unit: 'mg/ml' },
    ],
  },
  {
    id: 'atropine',
    name: 'Atropina',
    group: 'RCP / anticolinergico',
    route: 'IV, IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.05,
    doseMin: 0.05,
    doseMax: 0.05,
    doseUnit: 'mg/kg',
    doseLabel: '0.05 mg/kg',
    concentrations: [
      { label: '0.6 mg/ml', value: 0.6, unit: 'mg/ml' },
      { label: '1 mg/ml', value: 1, unit: 'mg/ml' },
    ],
  },
  {
    id: 'glycopyrrolate',
    name: 'Glicopirrolato',
    group: 'Anticolinergicos',
    route: 'IV, IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.01,
    doseMin: 0.005,
    doseMax: 0.01,
    doseUnit: 'mg/kg',
    doseLabel: '0.005-0.01 mg/kg',
    concentrations: [{ label: '0.2 mg/ml', value: 0.2, unit: 'mg/ml' }],
  },
  {
    id: 'calcium-gluconate',
    name: 'Calcio gluconato 10%',
    group: 'RCP / metabolico',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 1,
    doseMin: 0.5,
    doseMax: 1.5,
    doseUnit: 'ml/kg',
    doseLabel: '0.5-1.5 ml/kg',
    concentrations: [{ label: '10%', value: 1, unit: 'ml/ml' }],
  },
  {
    id: 'vasopressin-bolus',
    name: 'Vasopresina bolus',
    group: 'RCP / vasoactivo',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.8,
    doseMin: 0.8,
    doseMax: 0.8,
    doseUnit: 'IU/kg',
    doseLabel: '0.8 IU/kg',
    concentrations: [
      { label: '20 IU/ml', value: 20, unit: 'IU/ml' },
      { label: '2 IU/ml diluida', value: 2, unit: 'IU/ml' },
      { label: '0.2 IU/ml diluida', value: 0.2, unit: 'IU/ml' },
      { label: '0.4 IU/ml diluida', value: 0.4, unit: 'IU/ml' },
    ],
  },
  {
    id: 'lidocaine',
    name: 'Lidocaina',
    group: 'RCP / antiarritmico',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 2,
    doseMin: 2,
    doseMax: 2,
    doseUnit: 'mg/kg',
    doseLabel: '2 mg/kg',
    concentrations: [
      { label: '20 mg/ml (2%)', value: 20, unit: 'mg/ml' },
      { label: '10 mg/ml (1%)', value: 10, unit: 'mg/ml' },
      { label: '50 mg/ml (5%)', value: 50, unit: 'mg/ml' },
    ],
  },
  {
    id: 'bicarbonate',
    name: 'Bicarbonato',
    group: 'RCP / metabolico',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 1,
    doseMin: 1,
    doseMax: 1,
    doseUnit: 'mmol/kg',
    doseLabel: '1 mmol/kg',
    concentrations: [{ label: '1 mmol/ml', value: 1, unit: 'mmol/ml' }],
  },
  {
    id: 'naloxone',
    name: 'Naloxona',
    group: 'Reversores',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.002,
    doseMin: 0.002,
    doseMax: 0.2,
    doseUnit: 'mg/kg',
    doseLabel: '0.002-0.2 mg/kg',
    concentrations: [
      { label: '0.4 mg/ml', value: 0.4, unit: 'mg/ml' },
      { label: '1 mg/ml', value: 1, unit: 'mg/ml' },
    ],
  },
  {
    id: 'flumazenil',
    name: 'Flumazenil',
    group: 'Reversores',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.01,
    doseMin: 0.01,
    doseMax: 0.01,
    doseUnit: 'mg/kg',
    doseLabel: '0.01 mg/kg',
    concentrations: [{ label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' }],
    notes: 'Antidoto benzodiacepinas.',
  },
  {
    id: 'atipamezole',
    name: 'Atipamezol',
    group: 'Reversores',
    route: 'IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.1,
    doseMin: 0.05,
    doseMax: 0.2,
    doseUnit: 'mg/kg',
    doseLabel: '0.05-0.2 mg/kg',
    concentrations: [{ label: '5 mg/ml', value: 5, unit: 'mg/ml' }],
  },
  {
    id: 'propofol-premed',
    name: 'Propofol con premed',
    group: 'Induccion',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 4,
    doseMin: 4,
    doseMax: 4,
    doseUnit: 'mg/kg',
    doseLabel: '4 mg/kg',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
  },
  {
    id: 'propofol-no-premed',
    name: 'Propofol sin premed',
    group: 'Induccion',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 6,
    doseMin: 6,
    doseMax: 6,
    doseUnit: 'mg/kg',
    doseLabel: '6 mg/kg',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
  },
  {
    id: 'midazolam',
    name: 'Midazolam',
    group: 'Benzodiacepinas',
    route: 'IV, IM',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.25,
    doseMin: 0.2,
    doseMax: 0.5,
    doseUnit: 'mg/kg',
    doseLabel: '0.2-0.5 mg/kg',
    concentrations: [
      { label: '5 mg/ml', value: 5, unit: 'mg/ml' },
      { label: '1 mg/ml', value: 1, unit: 'mg/ml' },
    ],
  },
  {
    id: 'midazolam-in-seizures',
    name: 'Midazolam intranasal',
    group: 'Convulsiones / rescate',
    groupEn: 'Seizures / rescue',
    route: 'IN',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.2,
    doseMin: 0.2,
    doseMax: 0.2,
    doseUnit: 'mg/kg',
    doseLabel: '0.2 mg/kg',
    concentrations: [
      { label: '5 mg/ml', value: 5, unit: 'mg/ml' },
      { label: '1 mg/ml', value: 1, unit: 'mg/ml' },
    ],
    notes: 'Crisis convulsiva/status. Administrar con atomizador; repartir entre ambas fosas si el volumen supera 1 ml. Evidencia clínica directa en perros; recomendación ACVIM extrapolada en gatos.',
    notesEn: 'Seizure/status rescue. Use an atomiser; split between both nostrils when volume exceeds 1 mL. Direct clinical evidence in dogs; ACVIM recommendation extrapolated to cats.',
    source: {
      label: 'ACVIM 2024',
      url: 'https://doi.org/10.1111/jvim.16928',
    },
  },
  {
    id: 'levetiracetam-iv-seizures',
    name: 'Levetiracetam IV',
    group: 'Convulsiones / rescate',
    groupEn: 'Seizures / rescue',
    route: 'IV (5-15 min)',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 60,
    doseMin: 30,
    doseMax: 60,
    doseUnit: 'mg/kg',
    doseLabel: '30-60 mg/kg',
    concentrations: [{ label: '100 mg/ml', value: 100, unit: 'mg/ml' }],
    notes: 'Carga para status epiléptico o convulsiones en racimo; administrar durante 5-15 min.',
    notesEn: 'Loading dose for status epilepticus or cluster seizures; administer over 5-15 minutes.',
    source: {
      label: 'Merck Veterinary Manual',
      url: 'https://www.merckvetmanual.com/nervous-system/epilepsy-in-small-animals/epilepsy-in-small-animals',
    },
  },
  {
    id: 'diazepam',
    name: 'Diazepam',
    group: 'Benzodiacepinas',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.25,
    doseMin: 0.2,
    doseMax: 0.5,
    doseUnit: 'mg/kg',
    doseLabel: '0.2-0.5 mg/kg',
    concentrations: [{ label: '5 mg/ml', value: 5, unit: 'mg/ml' }],
  },
  {
    id: 'ketamine',
    name: 'Ketamina',
    group: 'Analgesia / induccion',
    route: 'IV, IM',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 2,
    doseMin: 2,
    doseMax: 2,
    doseUnit: 'mg/kg',
    doseLabel: '2 mg/kg',
    concentrations: [
      { label: '100 mg/ml', value: 100, unit: 'mg/ml' },
      { label: '50 mg/ml', value: 50, unit: 'mg/ml' },
      { label: '10 mg/ml diluida', value: 10, unit: 'mg/ml' },
      { label: '5 mg/ml diluida', value: 5, unit: 'mg/ml' },
      { label: '1 mg/ml diluida', value: 1, unit: 'mg/ml' },
    ],
  },
  {
    id: 'methadone',
    name: 'Metadona',
    group: 'Opioides',
    route: 'IV lenta, IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.2,
    doseMin: 0.1,
    doseMax: 0.4,
    doseUnit: 'mg/kg',
    doseLabel: '0.1-0.4 mg/kg',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
  },
  {
    id: 'butorphanol',
    name: 'Butorfanol',
    group: 'Opioides',
    route: 'IV, IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.3,
    doseMin: 0.1,
    doseMax: 0.4,
    doseUnit: 'mg/kg',
    doseLabel: '0.1-0.4 mg/kg',
    concentrations: [
      { label: '10 mg/ml', value: 10, unit: 'mg/ml' },
      { label: '1 mg/ml diluida', value: 1, unit: 'mg/ml' },
    ],
  },
  {
    id: 'fentanyl-bolus',
    name: 'Fentanilo bolus',
    group: 'Opioides',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 1,
    doseMin: 1,
    doseMax: 5,
    doseUnit: 'mcg/kg',
    doseLabel: '1-5 mcg/kg',
    concentrations: [
      { label: '50 mcg/ml', value: 50, unit: 'mcg/ml' },
      { label: '25 mcg/ml diluida', value: 25, unit: 'mcg/ml' },
    ],
  },
  {
    id: 'fentanyl-induction',
    name: 'Fentanilo induccion',
    group: 'Opioides',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 10,
    doseMin: 10,
    doseMax: 10,
    doseUnit: 'mcg/kg',
    doseLabel: '10 mcg/kg',
    concentrations: [
      { label: '50 mcg/ml', value: 50, unit: 'mcg/ml' },
      { label: '25 mcg/ml diluida', value: 25, unit: 'mcg/ml' },
    ],
  },
  {
    id: 'pethidine',
    name: 'Petidina',
    group: 'Opioides',
    route: 'IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 3,
    doseMin: 2,
    doseMax: 5,
    doseUnit: 'mg/kg',
    doseLabel: '2-5 mg/kg',
    concentrations: [{ label: '50 mg/ml', value: 50, unit: 'mg/ml' }],
    notes: 'Inicio 15 min; duracion 1.5-2 h.',
  },
  {
    id: 'buprenorphine',
    name: 'Buprenorfina',
    group: 'Opioides',
    route: 'IV, IM, SC',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.02,
    doseMin: 0.02,
    doseMax: 0.04,
    doseUnit: 'mg/kg',
    doseLabel: '0.02-0.04 mg/kg',
    concentrations: [{ label: '0.3 mg/ml', value: 0.3, unit: 'mg/ml' }],
  },
  {
    id: 'medetomidine',
    name: 'Medetomidina',
    group: 'Alpha 2',
    route: 'IV, IM',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 10,
    doseMin: 6,
    doseMax: 20,
    doseUnit: 'mcg/kg',
    doseLabel: '6-20 mcg/kg',
    concentrations: [{ label: '1 mg/ml', value: 1, unit: 'mg/ml' }],
    notes: 'Sedación, premedicación o contención química. Usar dosis menores por vía IV y titular al efecto.',
    notesEn: 'Sedation, premedication or chemical restraint. Use lower doses by the IV route and titrate to effect.',
    source: {
      label: 'WSAVA',
      url: 'https://wsava.org/wp-content/uploads/2020/01/Dental-Guidleines-for-endorsement_0.pdf',
    },
  },
  {
    id: 'dexmedetomidine-rescue-iv',
    name: 'Dexmedetomidina rescate',
    nameEn: 'Dexmedetomidine rescue',
    group: 'Recuperación / disforia',
    groupEn: 'Recovery / dysphoria',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 1,
    doseMin: 1,
    doseMax: 2,
    doseUnit: 'mcg/kg',
    doseLabel: '1-2 mcg/kg',
    concentrations: [
      { label: '0.5 mg/ml', value: 0.5, unit: 'mg/ml' },
      { label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' },
    ],
    notes: 'Dosis baja de rescate durante la recuperación anestésica, especialmente ante delirio de emergencia o disforia.',
    notesEn: 'Low rescue dose during anaesthetic recovery, particularly for emergence delirium or dysphoria.',
    source: {
      label: 'WSAVA 2022',
      url: 'https://doi.org/10.1111/jsap.13566',
    },
  },
  {
    id: 'dexmedetomidine-dog-sedation-iv',
    name: 'Dexmedetomidina sedación IV',
    nameEn: 'Dexmedetomidine IV sedation',
    group: 'Alpha 2 / sedación sola',
    groupEn: 'Alpha 2 / standalone sedation',
    route: 'IV',
    species: ['dog'],
    mode: 'single',
    dose: 375,
    doseMin: 375,
    doseMax: 375,
    doseUnit: 'mcg/m²',
    doseLabel: '375 mcg/m²',
    concentrations: [
      { label: '0.5 mg/ml', value: 0.5, unit: 'mg/ml' },
      { label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' },
    ],
    notes: 'Perros: sedación y analgesia sin premedicación. Dosis calculada por superficie corporal.',
    notesEn: 'Dogs: sedation and analgesia without premedication. Dose calculated from body surface area.',
    source: {
      label: 'Dexdomitor EMA',
      url: 'https://www.ema.europa.eu/en/medicines/veterinary/EPAR/dexdomitor',
    },
  },
  {
    id: 'dexmedetomidine-dog-sedation-im',
    name: 'Dexmedetomidina sedación IM',
    nameEn: 'Dexmedetomidine IM sedation',
    group: 'Alpha 2 / sedación sola',
    groupEn: 'Alpha 2 / standalone sedation',
    route: 'IM',
    species: ['dog'],
    mode: 'single',
    dose: 500,
    doseMin: 500,
    doseMax: 500,
    doseUnit: 'mcg/m²',
    doseLabel: '500 mcg/m²',
    concentrations: [
      { label: '0.5 mg/ml', value: 0.5, unit: 'mg/ml' },
      { label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' },
    ],
    notes: 'Perros: sedación y analgesia sin premedicación. Dosis calculada por superficie corporal.',
    notesEn: 'Dogs: sedation and analgesia without premedication. Dose calculated from body surface area.',
    source: {
      label: 'Dexdomitor EMA',
      url: 'https://www.ema.europa.eu/en/medicines/veterinary/EPAR/dexdomitor',
    },
  },
  {
    id: 'dexmedetomidine-dog-premed-im',
    name: 'Dexmedetomidina premedicación',
    nameEn: 'Dexmedetomidine premedication',
    group: 'Alpha 2 / premedicación',
    groupEn: 'Alpha 2 / premedication',
    route: 'IM',
    species: ['dog'],
    mode: 'single',
    dose: 125,
    doseMin: 125,
    doseMax: 375,
    doseUnit: 'mcg/m²',
    doseLabel: '125-375 mcg/m²',
    concentrations: [
      { label: '0.5 mg/ml', value: 0.5, unit: 'mg/ml' },
      { label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' },
    ],
    notes: 'Perros: elegir el extremo según duración, intensidad del procedimiento y protocolo anestésico. Reduce los requerimientos de inducción y mantenimiento.',
    notesEn: 'Dogs: choose the dose according to procedure duration, intensity and anaesthetic protocol. Reduces induction and maintenance requirements.',
    source: {
      label: 'Dexdomitor EMA',
      url: 'https://www.ema.europa.eu/en/medicines/veterinary/EPAR/dexdomitor',
    },
  },
  {
    id: 'dexmedetomidine-cat-im',
    name: 'Dexmedetomidina gato IM',
    nameEn: 'Dexmedetomidine cat IM',
    group: 'Alpha 2 / sedación-premedicación',
    groupEn: 'Alpha 2 / sedation-premedication',
    route: 'IM',
    species: ['cat'],
    mode: 'single',
    dose: 40,
    doseMin: 40,
    doseMax: 40,
    doseUnit: 'mcg/kg',
    doseLabel: '40 mcg/kg',
    concentrations: [
      { label: '0.5 mg/ml', value: 0.5, unit: 'mg/ml' },
      { label: '0.1 mg/ml', value: 0.1, unit: 'mg/ml' },
    ],
    notes: 'Gatos: sedación/analgesia o premedicación según ficha técnica; proteger la córnea durante la sedación.',
    notesEn: 'Cats: label dose for sedation/analgesia or premedication; protect the cornea during sedation.',
    source: {
      label: 'Dexdomitor EMA',
      url: 'https://www.ema.europa.eu/en/medicines/veterinary/EPAR/dexdomitor',
    },
  },
  {
    id: 'dexmedetomidine-cri',
    name: 'Dexmedetomidina CRI',
    group: 'CRI sedación / analgesia',
    groupEn: 'Sedation / analgesia CRI',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 1,
    doseMin: 1,
    doseMax: 1,
    doseUnit: 'mcg/kg/h',
    doseLabel: '1 mcg/kg/h',
    concentrations: [
      { label: '5 mcg/ml diluida', value: 5, unit: 'mcg/ml' },
      { label: '10 mcg/ml diluida', value: 10, unit: 'mcg/ml' },
      { label: '0.5 mg/ml stock', value: 0.5, unit: 'mg/ml' },
    ],
    notes: 'CRI perioperatoria; la pauta estudiada suele ir precedida de una carga IV de 1-2 mcg/kg. Monitorizar perfusión, frecuencia y ritmo cardiaco.',
    notesEn: 'Perioperative CRI; the investigated regimen is typically preceded by a 1-2 mcg/kg IV loading dose. Monitor perfusion, heart rate and rhythm.',
    source: {
      label: 'WSAVA 2022',
      url: 'https://doi.org/10.1111/jsap.13566',
    },
  },
  {
    id: 'zenalpha-dog',
    name: 'Zenalpha',
    group: 'Medetomidina + vatinoxan',
    groupEn: 'Medetomidine + vatinoxan',
    route: 'IM',
    species: ['dog'],
    mode: 'single',
    dose: 1,
    doseMin: 1,
    doseMax: 1,
    doseUnit: 'mg/m²',
    doseLabel: '1 mg/m² medetomidina',
    concentrations: [{ label: '0.5 + 10 mg/ml', value: 0.5, unit: 'mg/ml' }],
    notes: 'Solo perros. El volumen se calcula sobre 0,5 mg/ml de medetomidina (con 10 mg/ml de vatinoxan). Sedación/analgesia para procedimientos no invasivos o leve dolor, máximo 30 min; no usar como preanestésico.',
    notesEn: 'Dogs only. Volume is calculated from 0.5 mg/mL medetomidine (with 10 mg/mL vatinoxan). Sedation/analgesia for non-invasive or mildly painful procedures up to 30 minutes; do not use as a preanaesthetic.',
    source: {
      label: 'Zenalpha EMA',
      url: 'https://www.ema.europa.eu/en/medicines/veterinary/EPAR/zenalpha',
    },
  },
  {
    id: 'propofol-cri',
    name: 'Propofol CRI',
    group: 'CRI anestesia',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 0.2,
    doseMin: 0.1,
    doseMax: 0.5,
    doseUnit: 'mg/kg/min',
    doseLabel: '0.1-0.5 mg/kg/min',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
  },
  {
    id: 'fentanyl-cri',
    name: 'Fentanilo CRI',
    group: 'CRI analgesia',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 0.1,
    doseMin: 0.1,
    doseMax: 0.5,
    doseUnit: 'mcg/kg/min',
    doseLabel: '0.1-0.5 mcg/kg/min',
    concentrations: [
      { label: '50 mcg/ml', value: 50, unit: 'mcg/ml' },
      { label: '25 mcg/ml diluida', value: 25, unit: 'mcg/ml' },
    ],
  },
  {
    id: 'ketamine-cri',
    name: 'Ketamina CRI',
    group: 'CRI analgesia',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 5,
    doseMin: 2,
    doseMax: 30,
    doseUnit: 'mcg/kg/min',
    doseLabel: '2-30 mcg/kg/min',
    concentrations: [
      { label: '1 mg/ml diluida', value: 1, unit: 'mg/ml' },
      { label: '5 mg/ml diluida', value: 5, unit: 'mg/ml' },
      { label: '10 mg/ml diluida', value: 10, unit: 'mg/ml' },
      { label: '100 mg/ml', value: 100, unit: 'mg/ml' },
    ],
  },
  {
    id: 'noradrenaline-cri',
    name: 'Noradrenalina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 0.1,
    doseMin: 0.1,
    doseMax: 2,
    doseUnit: 'mcg/kg/min',
    doseLabel: '0.1-2 mcg/kg/min',
    concentrations: [
      { label: '100 mcg/ml diluida', value: 100, unit: 'mcg/ml' },
      { label: '10 mcg/ml diluida', value: 10, unit: 'mcg/ml' },
    ],
    notes: 'Administrar central si es posible.',
  },
  {
    id: 'dopamine-cri',
    name: 'Dopamina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 5,
    doseMin: 5,
    doseMax: 10,
    doseUnit: 'mcg/kg/min',
    doseLabel: '5-10 mcg/kg/min',
    concentrations: [
      { label: '4 mg/ml diluida', value: 4, unit: 'mg/ml' },
      { label: '0.4 mg/ml diluida', value: 0.4, unit: 'mg/ml' },
      { label: '40 mg/ml stock', value: 40, unit: 'mg/ml' },
    ],
  },
  {
    id: 'dobutamine-cri',
    name: 'Dobutamina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 5,
    doseMin: 5,
    doseMax: 20,
    doseUnit: 'mcg/kg/min',
    doseLabel: '5-20 mcg/kg/min',
    concentrations: [{ label: '1 mg/ml diluida', value: 1, unit: 'mg/ml' }],
  },
  {
    id: 'vasopressin-cri',
    name: 'Vasopresina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 0.5,
    doseMin: 0.5,
    doseMax: 0.5,
    doseUnit: 'mU/kg/min',
    doseLabel: '0.5 mU/kg/min',
    concentrations: [
      { label: '200 mU/ml (0.2 IU/ml)', value: 200, unit: 'mU/ml' },
      { label: '400 mU/ml (0.4 IU/ml)', value: 400, unit: 'mU/ml' },
    ],
    notes: 'Riesgo de extravasacion; preferir via central.',
  },
  {
    id: 'phenylephrine-cri',
    name: 'Fenilefrina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 1,
    doseMin: 1,
    doseMax: 3,
    doseUnit: 'mcg/kg/min',
    doseLabel: '1-3 mcg/kg/min',
    concentrations: [
      { label: '100 mcg/ml diluida', value: 100, unit: 'mcg/ml' },
      { label: '500 mcg/ml diluida', value: 500, unit: 'mcg/ml' },
    ],
  },
  {
    id: 'epinephrine-cri',
    name: 'Adrenalina CRI',
    group: 'Vasoactivos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 0.04,
    doseMin: 0.04,
    doseMax: 0.1,
    doseUnit: 'mcg/kg/min',
    doseLabel: '0.04-0.1 mcg/kg/min',
    concentrations: [
      { label: '10 mcg/ml diluida', value: 10, unit: 'mcg/ml' },
      { label: '5 mcg/ml diluida', value: 5, unit: 'mcg/ml' },
    ],
  },
  {
    id: 'lidocaine-antiarrhythmic',
    name: 'Lidocaina antiarritmica',
    group: 'Antiarritmicos',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 2,
    doseMin: 2,
    doseMax: 8,
    doseUnit: 'mg/kg',
    doseLabel: '2-8 mg/kg',
    concentrations: [{ label: '20 mg/ml (2%)', value: 20, unit: 'mg/ml' }],
  },
  {
    id: 'lidocaine-cri',
    name: 'Lidocaina CRI',
    group: 'Antiarritmicos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 50,
    doseMin: 50,
    doseMax: 80,
    doseUnit: 'mcg/kg/min',
    doseLabel: '50-80 mcg/kg/min',
    concentrations: [{ label: '20 mg/ml (2%)', value: 20, unit: 'mg/ml' }],
  },
  {
    id: 'procainamide',
    name: 'Procainamida',
    group: 'Antiarritmicos',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 6,
    doseMin: 6,
    doseMax: 8,
    doseUnit: 'mg/kg',
    doseLabel: '6-8 mg/kg',
    concentrations: [{ label: '100 mg/ml', value: 100, unit: 'mg/ml' }],
  },
  {
    id: 'diltiazem',
    name: 'Diltiazem',
    group: 'Antiarritmicos',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.1,
    doseMin: 0.1,
    doseMax: 0.25,
    doseUnit: 'mg/kg',
    doseLabel: '0.1-0.25 mg/kg',
    concentrations: [{ label: '5 mg/ml', value: 5, unit: 'mg/ml' }],
  },
  {
    id: 'esmolol',
    name: 'Esmolol',
    group: 'Beta bloqueantes',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.05,
    doseMin: 0.05,
    doseMax: 0.1,
    doseUnit: 'mg/kg',
    doseLabel: '0.05-0.1 mg/kg',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
  },
  {
    id: 'sotalol',
    name: 'Sotalol',
    group: 'Beta bloqueantes',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.5,
    doseMin: 0.5,
    doseMax: 2,
    doseUnit: 'mg/kg',
    doseLabel: '0.5-2 mg/kg',
    concentrations: [{ label: '10 mg/ml', value: 10, unit: 'mg/ml' }],
    notes: 'Administrar lento en 10 minutos.',
  },
  {
    id: 'furosemide',
    name: 'Furosemida',
    group: 'Diureticos',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 2,
    doseMin: 2,
    doseMax: 4,
    doseUnit: 'mg/kg',
    doseLabel: '2-4 mg/kg',
    concentrations: [{ label: '50 mg/ml', value: 50, unit: 'mg/ml' }],
  },
  {
    id: 'furosemide-cri',
    name: 'Furosemida CRI',
    group: 'Diureticos',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 1,
    doseMin: 1,
    doseMax: 1,
    doseUnit: 'mg/kg/h',
    doseLabel: '1 mg/kg/h',
    concentrations: [{ label: '50 mg/ml', value: 50, unit: 'mg/ml' }],
  },
  {
    id: 'mannitol',
    name: 'Manitol 20%',
    group: 'Urgencias',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.5,
    doseMin: 0.5,
    doseMax: 1,
    doseUnit: 'g/kg',
    doseLabel: '0.5-1 g/kg',
    concentrations: [{ label: '0.2 g/ml (20%)', value: 0.2, unit: 'g/ml' }],
  },
  {
    id: 'regular-insulin-hyperkalemia',
    name: 'Insulina regular (rápida)',
    nameEn: 'Regular (short-acting) insulin',
    group: 'Hiperpotasemia / rescate',
    groupEn: 'Hyperkalaemia / rescue',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.25,
    doseMin: 0.25,
    doseMax: 0.5,
    doseUnit: 'IU/kg',
    doseLabel: '0.25-0.5 IU/kg',
    concentrations: [{ label: '100 IU/ml', value: 100, unit: 'IU/ml' }],
    notes: 'Hiperpotasemia: administrar con 2 g de dextrosa por cada IU de insulina. Monitorizar estrechamente la glucemia; puede requerir dextrosa CRI. No sustituye a un protocolo de cetoacidosis diabética.',
    notesEn: 'Hyperkalaemia: give with 2 g dextrose per IU insulin. Monitor blood glucose closely; a dextrose CRI may be required. This is not a diabetic ketoacidosis protocol.',
    source: {
      label: 'Can Vet J 2024',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10880400/',
    },
  },
  {
    id: 'nitroprusside',
    name: 'Nitroprusiato',
    group: 'Vasodilatadores',
    route: 'IV CRI',
    species: ['dog', 'cat'],
    mode: 'cri',
    dose: 1,
    doseMin: 1,
    doseMax: 5,
    doseUnit: 'mcg/kg/min',
    doseLabel: '1-5 mcg/kg/min',
    concentrations: [{ label: '250 mcg/ml diluida', value: 250, unit: 'mcg/ml' }],
  },
  {
    id: 'hydralazine',
    name: 'Hidralazina',
    group: 'Vasodilatadores',
    route: 'IV',
    species: ['dog', 'cat'],
    mode: 'single',
    dose: 0.5,
    doseMin: 0.5,
    doseMax: 0.5,
    doseUnit: 'mg/kg',
    doseLabel: '0.5 mg/kg',
    concentrations: [{ label: '2 mg/ml diluida', value: 2, unit: 'mg/ml' }],
  },
  {
    id: 'pimobendan-oral',
    name: 'Pimobendan oral',
    group: 'Cardiaco oral',
    route: 'PO',
    species: ['dog'],
    mode: 'tablet',
    dose: 0.25,
    doseMin: 0.1,
    doseMax: 0.3,
    doseUnit: 'mg/kg',
    doseLabel: '0.1-0.3 mg/kg q12h',
    concentrations: [
      { label: '1.25 mg comp.', value: 1.25, unit: 'mg/tablet' },
      { label: '2.5 mg comp.', value: 2.5, unit: 'mg/tablet' },
      { label: '5 mg comp.', value: 5, unit: 'mg/tablet' },
      { label: '10 mg comp.', value: 10, unit: 'mg/tablet' },
      { label: '1.5 mg/ml solucion oral', value: 1.5, unit: 'mg/ml' },
    ],
    notes: 'Dosis diaria autorizada 0.2-0.6 mg/kg/dia, dividida en dos tomas.',
  },
  {
    id: 'pimobendan-iv',
    name: 'Pimobendan IV',
    group: 'Cardiaco IV',
    route: 'IV',
    species: ['dog'],
    mode: 'single',
    dose: 0.15,
    doseMin: 0.15,
    doseMax: 0.15,
    doseUnit: 'mg/kg',
    doseLabel: '0.15 mg/kg',
    concentrations: [{ label: '0.75 mg/ml inyectable', value: 0.75, unit: 'mg/ml' }],
    notes: 'Dosis unica IV en perro.',
  },
];

const defaultEnabled = () => Object.fromEntries(ANESTHESIA_DRUGS.map((drug) => [drug.id, true]));
const defaultConcentrationSelection = () => Object.fromEntries(ANESTHESIA_DRUGS.map((drug) => [drug.id, 0]));
const sortDrugsByName = (left: { drug: AnesthesiaDrug }, right: { drug: AnesthesiaDrug }) =>
  left.drug.name.localeCompare(right.drug.name, 'es', { sensitivity: 'base' });

const getDefaultSettings = (): AnesthesiaSettings => ({
  concentrationSelection: defaultConcentrationSelection(),
  customConcentrations: {},
  doseOverrides: {},
  enabled: defaultEnabled(),
  hideUnavailable: false,
});

const normalizeSettings = (settings?: Partial<AnesthesiaSettings>): AnesthesiaSettings => ({
  concentrationSelection: { ...defaultConcentrationSelection(), ...(settings?.concentrationSelection ?? {}) },
  customConcentrations: settings?.customConcentrations ?? {},
  doseOverrides: settings?.doseOverrides ?? {},
  enabled: { ...defaultEnabled(), ...(settings?.enabled ?? {}) },
  hideUnavailable: settings?.hideUnavailable ?? false,
});

const parseNumber = (value: string | number | undefined, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const normalized = (value ?? '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundValue = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatNumber = (lang: Language, value: number, decimals = 2) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: value > 0 && value < 0.1 ? Math.min(decimals, 3) : 0,
  }).format(value);

const getAmountUnit = (doseUnit: DoseUnit) => {
  if (doseUnit.startsWith('mcg')) return 'mcg';
  if (doseUnit.startsWith('IU')) return 'IU';
  if (doseUnit.startsWith('mmol')) return 'mmol';
  if (doseUnit.startsWith('g/')) return 'g';
  if (doseUnit.startsWith('ml/')) return 'ml';
  if (doseUnit.startsWith('mU')) return 'mU';
  return 'mg';
};

const getCalculatedAmount = (dose: number, doseUnit: DoseUnit, weight: number) => {
  if (doseUnit.endsWith('/m²')) {
    const canineBodySurfaceArea = (10.1 * weight ** (2 / 3)) / 100;
    return dose * canineBodySurfaceArea;
  }
  const base = dose * weight;
  if (doseUnit.endsWith('/min')) return base * 60;
  return base;
};

const getAmountLabel = (mode: CalculationMode, amountUnit: string) => (mode === 'cri' ? `${amountUnit}/h` : amountUnit);

const normalizeAmountForConcentration = (amount: number, amountUnit: string, concentrationUnit: ConcentrationUnit) => {
  if (amountUnit === 'ml') return amount;
  if (amountUnit === 'mcg' && concentrationUnit === 'mg/ml') return amount / 1000;
  if (amountUnit === 'mg' && concentrationUnit === 'mcg/ml') return amount * 1000;
  if (amountUnit === 'IU' && concentrationUnit === 'mU/ml') return amount * 1000;
  if (amountUnit === 'mU' && concentrationUnit === 'IU/ml') return amount / 1000;
  return amount;
};

const calculateDrug = (
  drug: AnesthesiaDrug,
  weight: number,
  concentration: ConcentrationOption,
  doseOverride?: string,
): DrugResult | null => {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const dose = Math.max(0, parseNumber(doseOverride, drug.dose));
  const minDose = Math.max(0, drug.doseMin ?? drug.dose);
  const maxDose = Math.max(0, drug.doseMax ?? drug.dose);
  const amountUnit = getAmountUnit(drug.doseUnit);
  const amount = getCalculatedAmount(dose, drug.doseUnit, weight);
  const minAmount = getCalculatedAmount(minDose, drug.doseUnit, weight);
  const maxAmount = getCalculatedAmount(maxDose, drug.doseUnit, weight);
  const normalizedAmount = normalizeAmountForConcentration(amount, amountUnit, concentration.unit);
  const normalizedMinAmount = normalizeAmountForConcentration(minAmount, amountUnit, concentration.unit);
  const normalizedMaxAmount = normalizeAmountForConcentration(maxAmount, amountUnit, concentration.unit);
  const volume = concentration.value > 0 ? normalizedAmount / concentration.value : null;
  const minVolume = concentration.value > 0 ? normalizedMinAmount / concentration.value : null;
  const maxVolume = concentration.value > 0 ? normalizedMaxAmount / concentration.value : null;
  const isTablet = concentration.unit === 'mg/tablet';

  return {
    amount,
    amountUnit,
    concentration,
    dose,
    doseUnit: drug.doseUnit,
    drug,
    maxAmount,
    maxVolume,
    minAmount,
    minVolume,
    volume,
    volumeLabel: isTablet ? 'comp.' : drug.mode === 'cri' ? 'ml/h' : 'ml',
  };
};

const formatVolume = (lang: Language, value: number | null, label: string) =>
  value === null ? '--' : `${formatNumber(lang, roundValue(value, 3), 3)} ${label}`;

const formatVolumeRange = (lang: Language, result: DrugResult | null) => {
  if (!result || result.minVolume === null || result.maxVolume === null) return '--';
  const min = roundValue(result.minVolume, 3);
  const max = roundValue(result.maxVolume, 3);
  if (min === max) return `${formatNumber(lang, min, 3)} ${result.volumeLabel}`;
  return `${formatNumber(lang, min, 3)}-${formatNumber(lang, max, 3)} ${result.volumeLabel}`;
};

export default function AnesthesiaToolkit({ lang }: Props) {
  const t = copy[lang];
  const [patient, setPatient] = useState<PatientData>({
    species: 'dog',
    breed: '',
    name: '',
    chip: '',
    weight: '',
  });
  const [enabled, setEnabled] = useState<Record<string, boolean>>(defaultEnabled);
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [concentrationSelection, setConcentrationSelection] = useState<Record<string, number>>(defaultConcentrationSelection);
  const [customConcentrations, setCustomConcentrations] = useState<Record<string, string>>({});
  const [doseOverrides, setDoseOverrides] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<AnesthesiaProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [profileName, setProfileName] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const applySettings = (settings: Partial<AnesthesiaSettings>) => {
    const normalized = normalizeSettings(settings);
    setEnabled(normalized.enabled);
    setConcentrationSelection(normalized.concentrationSelection);
    setCustomConcentrations(normalized.customConcentrations);
    setDoseOverrides(normalized.doseOverrides);
    setHideUnavailable(normalized.hideUnavailable);
  };

  const getCurrentSettings = (): AnesthesiaSettings => ({
    concentrationSelection,
    customConcentrations,
    doseOverrides,
    enabled,
    hideUnavailable,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        activeProfileId?: string;
        enabled?: Record<string, boolean>;
        concentrationSelection?: Record<string, number>;
        customConcentrations?: Record<string, string>;
        doseOverrides?: Record<string, string>;
        hideUnavailable?: boolean;
        profiles?: AnesthesiaProfile[];
        settings?: Partial<AnesthesiaSettings>;
      };
      const normalizedProfiles = (parsed.profiles ?? []).map((profile) => ({
        ...normalizeSettings(profile),
        id: profile.id,
        name: profile.name,
        updatedAt: profile.updatedAt,
      }));
      setProfiles(normalizedProfiles);
      setActiveProfileId(parsed.activeProfileId ?? '');
      const activeProfile = normalizedProfiles.find((profile) => profile.id === parsed.activeProfileId);
      if (activeProfile) setProfileName(activeProfile.name);
      applySettings(parsed.settings ?? parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeProfileId,
        profiles,
        settings: getCurrentSettings(),
      }),
    );
  }, [activeProfileId, concentrationSelection, customConcentrations, doseOverrides, enabled, hideUnavailable, isHydrated, profiles]);

  const weight = parseNumber(patient.weight);

  const results = useMemo(() => {
    return ANESTHESIA_DRUGS.map((drug) => {
      const selected = drug.concentrations[concentrationSelection[drug.id]] ?? drug.concentrations[0];
      const customValue = parseNumber(customConcentrations[drug.id], 0);
      const concentration = customValue > 0 ? { ...selected, label: `${customValue} ${selected.unit}`, value: customValue } : selected;
      const result = calculateDrug(drug, weight, concentration, doseOverrides[drug.id]);
      return { drug, result };
    });
  }, [concentrationSelection, customConcentrations, doseOverrides, weight]);

  const visibleResults = results.filter(({ drug }) => !hideUnavailable || enabled[drug.id]).sort(sortDrugsByName);
  const enabledCount = ANESTHESIA_DRUGS.filter((drug) => enabled[drug.id]).length;

  const setPatientField = (field: keyof PatientData, value: string) => {
    setPatient((current) => ({ ...current, [field]: value }));
  };

  const loadProfile = (profileId: string) => {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;
    applySettings(profile);
    setActiveProfileId(profile.id);
    setProfileName(profile.name);
  };

  const saveProfile = () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) return;
    const profileId = activeProfileId || `profile-${Date.now()}`;
    const updatedProfile: AnesthesiaProfile = {
      ...getCurrentSettings(),
      id: profileId,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    };
    setProfiles((current) => {
      const withoutCurrent = current.filter((profile) => profile.id !== profileId && profile.name.toLowerCase() !== trimmedName.toLowerCase());
      return [...withoutCurrent, updatedProfile].sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));
    });
    setActiveProfileId(profileId);
  };

  const deleteProfile = () => {
    if (!activeProfileId) return;
    setProfiles((current) => current.filter((profile) => profile.id !== activeProfileId));
    setActiveProfileId('');
    setProfileName('');
  };

  return (
    <section className="anesthesia-toolkit">
      <div className="anesthesia-screen-only anesthesia-header">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </div>
        <div className="anesthesia-action-panel">
          <strong>
            {enabledCount}/{ANESTHESIA_DRUGS.length} {t.selected}
          </strong>
          <button type="button" className="generate-button" onClick={() => window.print()}>
            {t.print}
          </button>
        </div>
      </div>

      <div className="anesthesia-screen-only anesthesia-config">
        <section className="anesthesia-panel">
          <div className="anesthesia-panel-heading">
            <h4>{t.patient}</h4>
          </div>
          <div className="anesthesia-patient-grid">
            <label>
              {t.species}
              <select value={patient.species} onChange={(event) => setPatientField('species', event.target.value as Species)}>
                <option value="dog">{t.dog}</option>
                <option value="cat">{t.cat}</option>
              </select>
            </label>
            <label>
              {t.weight}
              <input
                type="number"
                min="0"
                step="0.1"
                autoComplete="off"
                value={patient.weight}
                onChange={(event) => setPatientField('weight', event.target.value)}
              />
            </label>
            <label>
              {t.name}
              <input type="text" autoComplete="off" value={patient.name} onChange={(event) => setPatientField('name', event.target.value)} />
            </label>
            <label>
              {t.breed}
              <input type="text" autoComplete="off" value={patient.breed} onChange={(event) => setPatientField('breed', event.target.value)} />
            </label>
            <label className="anesthesia-chip-field">
              {t.chip}
              <input type="text" autoComplete="off" value={patient.chip} onChange={(event) => setPatientField('chip', event.target.value)} />
            </label>
          </div>
        </section>

        <section className="anesthesia-panel">
          <div className="anesthesia-panel-heading">
            <h4>{t.inventory}</h4>
            <p>{t.inventoryHelp}</p>
          </div>
          <div className="anesthesia-toolbar">
            <label className="anesthesia-checkbox">
              <input type="checkbox" checked={hideUnavailable} onChange={(event) => setHideUnavailable(event.target.checked)} />
              <span>{t.hideUnavailable}</span>
            </label>
            <button type="button" className="secondary-button" onClick={() => setEnabled(defaultEnabled())}>
              {t.reset}
            </button>
          </div>
        </section>

        <section className="anesthesia-panel anesthesia-profile-panel">
          <div className="anesthesia-panel-heading">
            <h4>{t.profiles}</h4>
            <p>{t.profilesHelp}</p>
          </div>
          <div className="anesthesia-profile-grid">
            <label>
              {t.profileSelect}
              <select
                value={activeProfileId}
                onChange={(event) => {
                  const selectedProfileId = event.target.value;
                  if (!selectedProfileId) {
                    setActiveProfileId('');
                    setProfileName('');
                    return;
                  }
                  loadProfile(selectedProfileId);
                }}
              >
                <option value="">{t.noProfile}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.profileName}
              <input type="text" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Dr. Garcia" />
            </label>
            <div className="anesthesia-profile-actions">
              <button type="button" className="generate-button" onClick={saveProfile} disabled={!profileName.trim()}>
                {t.saveProfile}
              </button>
              <button type="button" className="secondary-button" onClick={() => loadProfile(activeProfileId)} disabled={!activeProfileId}>
                {t.loadProfile}
              </button>
              <button type="button" className="secondary-button" onClick={deleteProfile} disabled={!activeProfileId}>
                {t.deleteProfile}
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="anesthesia-print-sheet" aria-label={t.sheetTitle}>
        <div className="anesthesia-sheet-head">
          <div>
            <p className="section-kicker">{t.kicker}</p>
            <h3>{t.sheetTitle}</h3>
          </div>
          <dl className="anesthesia-patient-summary">
            <div>
              <dt>{t.species}</dt>
              <dd>{patient.species === 'dog' ? t.dog : t.cat}</dd>
            </div>
            <div>
              <dt>{t.weight}</dt>
              <dd>{weight > 0 ? `${formatNumber(lang, weight, 2)} kg` : '--'}</dd>
            </div>
            <div>
              <dt>{t.name}</dt>
              <dd>{patient.name || '--'}</dd>
            </div>
            <div>
              <dt>{t.breed}</dt>
              <dd>{patient.breed || '--'}</dd>
            </div>
            <div>
              <dt>{t.chip}</dt>
              <dd>{patient.chip || '--'}</dd>
            </div>
          </dl>
        </div>

        <div className="anesthesia-table-shell">
          <table className="anesthesia-table">
            <colgroup>
              <col className="anesthesia-col-stock" />
              <col className="anesthesia-col-drug" />
              <col className="anesthesia-col-route" />
              <col className="anesthesia-col-dose" />
              <col className="anesthesia-col-concentration" />
              <col className="anesthesia-col-amount" />
              <col className="anesthesia-col-volume-range" />
              <col className="anesthesia-col-volume" />
              <col className="anesthesia-col-notes" />
            </colgroup>
            <thead>
              <tr>
                <th>{t.inventory}</th>
                <th>{t.drug}</th>
                <th>{t.route}</th>
                <th>{t.doseRange}</th>
                <th>{t.concentration}</th>
                <th>{t.amount}</th>
                <th>{t.volumeRange}</th>
                <th>{t.volume}</th>
                <th>{t.notes}</th>
              </tr>
            </thead>
            <tbody>
              {visibleResults.map(({ drug, result }) => {
                const stocked = enabled[drug.id];
                const selectedIndex = concentrationSelection[drug.id] ?? 0;
                const speciesMatches = drug.species.includes(patient.species);
                return (
                  <tr key={drug.id} className={!stocked ? 'anesthesia-row-disabled' : ''}>
                    <td>
                      <label className="anesthesia-stock-toggle anesthesia-screen-only">
                        <input
                          type="checkbox"
                          checked={stocked}
                          onChange={(event) => setEnabled((current) => ({ ...current, [drug.id]: event.target.checked }))}
                        />
                        <span>{stocked ? t.available : t.unavailable}</span>
                      </label>
                      <span className="anesthesia-print-only">{stocked ? 'Si' : 'No'}</span>
                    </td>
                    <td>
                      <strong>{lang === 'en' ? drug.nameEn ?? drug.name : drug.name}</strong>
                      <span>{lang === 'en' ? drug.groupEn ?? drug.group : drug.group}</span>
                      {!speciesMatches ? <em>{t.speciesWarning}</em> : null}
                    </td>
                    <td>{drug.route}</td>
                    <td>
                      <div className="anesthesia-dose-cell">
                        <strong>{drug.doseLabel}</strong>
                        <span>
                          {t.selectedDose}: {doseOverrides[drug.id] ? `${doseOverrides[drug.id]} ${drug.doseUnit}` : `${drug.dose} ${drug.doseUnit}`}
                        </span>
                        <input
                          className="anesthesia-screen-only"
                          type="number"
                          min="0"
                          step="0.001"
                          value={doseOverrides[drug.id] ?? ''}
                          placeholder={t.customDose}
                          title={t.customDose}
                          onChange={(event) => setDoseOverrides((current) => ({ ...current, [drug.id]: event.target.value }))}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="anesthesia-concentration-cell">
                        <select
                          className="anesthesia-screen-only"
                          value={selectedIndex}
                          onChange={(event) =>
                            setConcentrationSelection((current) => ({ ...current, [drug.id]: Number(event.target.value) }))
                          }
                        >
                          {drug.concentrations.map((concentration, index) => (
                            <option key={`${drug.id}-${concentration.label}`} value={index}>
                              {concentration.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="anesthesia-screen-only"
                          type="number"
                          min="0"
                          step="0.001"
                          value={customConcentrations[drug.id] ?? ''}
                          placeholder={t.customConcentration}
                          title={t.customConcentration}
                          onChange={(event) => setCustomConcentrations((current) => ({ ...current, [drug.id]: event.target.value }))}
                        />
                        <span className="anesthesia-print-value">{result?.concentration.label ?? drug.concentrations[selectedIndex]?.label}</span>
                      </div>
                    </td>
                    <td>
                      {result
                        ? `${formatNumber(lang, result.amount, 3)} ${getAmountLabel(drug.mode, result.amountUnit)}`
                        : t.noWeight}
                    </td>
                    <td>
                      <strong>{formatVolumeRange(lang, result)}</strong>
                    </td>
                    <td>
                      <strong>{result ? formatVolume(lang, result.volume, result.volumeLabel) : '--'}</strong>
                    </td>
                    <td>
                      {drug.id === 'pimobendan-oral'
                        ? t.pimobendanNote
                        : drug.id === 'pimobendan-iv'
                          ? t.pimobendanIvNote
                          : lang === 'en'
                            ? drug.notesEn ?? drug.notes ?? ''
                            : drug.notes ?? ''}
                      {drug.source ? (
                        <a className="anesthesia-source-link" href={drug.source.url} target="_blank" rel="noreferrer">
                          {t.source}: {drug.source.label}
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="anesthesia-disclaimer">{t.disclaimer}</p>
      </section>
    </section>
  );
}
