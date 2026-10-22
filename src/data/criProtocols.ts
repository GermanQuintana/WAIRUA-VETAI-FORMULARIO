import type { LocalizedText } from "../types";

export type CriUnit = "mg/kg/h" | "µg/kg/h" | "mg/kg/min" | "µg/kg/min";
export type CriSpecies = "dog" | "cat";
export interface CriDrug {
  id: string;
  name: LocalizedText;
  min: number;
  max: number;
  unit: CriUnit;
}
export interface CriProtocol {
  id: string;
  name: LocalizedText;
  indication: LocalizedText;
  species: CriSpecies[];
  category: "anesthesia" | "analgesia" | "critical" | "status";
  administration?: "loading";
  requiresDilution?: boolean;
  drugs: CriDrug[];
  caution: LocalizedText;
  monitor: LocalizedText;
  loading: LocalizedText;
  evidence: LocalizedText;
  sources: { label: string; url: string }[];
}
const drug = (
  id: string,
  es: string,
  en: string,
  min: number,
  max: number,
  unit: CriUnit,
): CriDrug => ({ id, name: { es, en }, min, max, unit });
const postoperative = {
  label: "Gutiérrez-Blanco et al. · 2015 · doi:10.1111/vaa.12215",
  url: "https://pubmed.ncbi.nlm.nih.gov/25039918/",
};
const seizures = {
  label: "Charalambous et al. · ACVIM 2024 · doi:10.1111/jvim.16928",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10800221/",
};
const gioeni = {
  label: "Gioeni et al. · 2020 · doi:10.1111/vec.12956",
  url: "https://pubmed.ncbi.nlm.nih.gov/32372564/",
};
export const SEIZURE_SOURCES = [
  seizures,
  {
    label: "Emergency Approach to Acute Seizures · 2024 · tabla 2 / table 2",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11209469/",
  },
];

export const DEXDOMITOR_SOURCE = "https://ec.europa.eu/health/documents/community-register/2026/20260122168568/anx_168568_es.pdf";
const aahaAnesthesia = {
  label: "AAHA 2020 · anestesia / anesthesia · figura / figure 9",
  url: "https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/2020-anesthesia/anesthesia_and_monitoring_guidelines_final.pdf",
};

/** Doses retain the indication and species of the cited source. Not a formulary range. */
export const CRI_PROTOCOLS: CriProtocol[] = [
  {
    id: "lido-postoperative", name: { es: "Lidocaína · posoperatorio", en: "Lidocaine · postoperative" },
    category: "analgesia", species: ["dog"],
    indication: { es: "Analgesia posoperatoria · 4 h tras ovariohisterectomía", en: "Postoperative analgesia · 4 h after ovariohysterectomy" },
    drugs: [drug("lido", "Lidocaína", "Lidocaine", 25, 25, "µg/kg/min")],
    loading: { es: "Estudio: 2 mg/kg IV al inicio de anestesia; no repetir automáticamente al iniciar la fase posoperatoria.", en: "Study: 2 mg/kg IV at anesthesia start; do not automatically repeat when starting the postoperative phase." },
    caution: { es: "Solo perros. Toxicidad neurológica y cardiovascular; precaución en enfermedad hepática y trastornos de conducción. Como único analgésico puede ser insuficiente.", en: "Dogs only. Neurological and cardiovascular toxicity; caution with hepatic disease and conduction disorders. May be insufficient as the sole analgesic." },
    monitor: { es: "Dolor, sedación, ECG, PA, SpO₂ y ventilación.", en: "Pain, sedation, ECG, BP, SpO₂ and ventilation." },
    evidence: { es: "Ensayo aleatorizado en 54 perras. Pauta de la fase posoperatoria de 4 h; no extrapolar a otros procedimientos o especies. Uso potencialmente fuera de ficha.", en: "Randomized trial in 54 female dogs. Protocol from the 4 h postoperative phase; do not extrapolate to other procedures or species. Use may be off-label." },
    sources: [postoperative],
  },

  {
    id: "fentanyl-postoperative", name: { es: "Fentanilo · posoperatorio", en: "Fentanyl · postoperative" },
    category: "analgesia", species: ["dog"],
    indication: { es: "Analgesia posoperatoria · 4 h tras ovariohisterectomía", en: "Postoperative analgesia · 4 h after ovariohysterectomy" },
    drugs: [drug("fentanyl", "Fentanilo", "Fentanyl", 2.5, 2.5, "µg/kg/h")],
    loading: { es: "Estudio: 5 µg/kg IV al inicio de anestesia; no repetir automáticamente al iniciar la fase posoperatoria.", en: "Study: 5 µg/kg IV at anesthesia start; do not automatically repeat when starting the postoperative phase." },
    caution: { es: "Depresión respiratoria, bradicardia y sedación; soporte ventilatorio y rescate disponibles.", en: "Respiratory depression, bradycardia and sedation; ventilatory support and rescue available." },
    monitor: { es: "Dolor, sedación, ECG, PA, SpO₂ y ventilación.", en: "Pain, sedation, ECG, BP, SpO₂ and ventilation." },
    evidence: { es: "Ensayo aleatorizado en 54 perras. Pauta de la fase posoperatoria de 4 h; no extrapolar a otros procedimientos o especies. Uso potencialmente fuera de ficha.", en: "Randomized trial in 54 female dogs. Protocol from the 4 h postoperative phase; do not extrapolate to other procedures or species. Use may be off-label." },
    sources: [postoperative],
  },

  {
    id: "dobutamine", name: { es: "Dobutamina", en: "Dobutamine" },
    category: "critical", species: ["dog", "cat"], requiresDilution: true,
    indication: { es: "Soporte de presión arterial durante anestesia · titular a respuesta", en: "Blood-pressure support during anesthesia · titrate to response" },
    drugs: [drug("dobutamine", "Dobutamina", "Dobutamine", 1, 10, "µg/kg/min")],
    loading: { es: "Sin bolo automático. Iniciar infusión diluida según el producto y titular bajo monitorización.", en: "No automatic bolus. Start a diluted infusion according to the product and titrate under monitoring." },
    caution: { es: "Valorar contractilidad y volemia. Riesgo de taquicardia, arritmias y respuesta variable de la presión arterial.", en: "Assess contractility and volume status. Tachycardia, arrhythmia and variable blood-pressure response risk." },
    monitor: { es: "PA continua o frecuente, ECG, frecuencia cardiaca, perfusión y acceso IV. Bomba de infusión.", en: "Continuous or frequent BP, ECG, heart rate, perfusion and IV access. Infusion pump." },
    evidence: { es: "Guía de consenso AAHA 2020, figura 9, perros y gatos anestesiados. No es una pauta universal para shock séptico. Confirmar formulación y compatibilidad; uso potencialmente fuera de ficha.", en: "AAHA 2020 consensus guideline, figure 9, anesthetized dogs and cats. Not a universal septic shock protocol. Confirm formulation and compatibility; use may be off-label." },
    sources: [aahaAnesthesia],
  },

  {
    id: "dopamine", name: { es: "Dopamina", en: "Dopamine" },
    category: "critical", species: ["dog", "cat"], requiresDilution: true,
    indication: { es: "Soporte de presión arterial durante anestesia · titular a respuesta", en: "Blood-pressure support during anesthesia · titrate to response" },
    drugs: [drug("dopamine", "Dopamina", "Dopamine", 1, 15, "µg/kg/min")],
    loading: { es: "Sin bolo automático. Iniciar infusión diluida según el producto y titular bajo monitorización.", en: "No automatic bolus. Start a diluted infusion according to the product and titrate under monitoring." },
    caution: { es: "Riesgo de taquiarritmias. Corregir causas de hipotensión; no usar una dosis «renal» para prevenir lesión renal.", en: "Tachyarrhythmia risk. Correct causes of hypotension; do not use a “renal dose” to prevent kidney injury." },
    monitor: { es: "PA continua o frecuente, ECG, frecuencia cardiaca, perfusión y acceso IV. Bomba de infusión.", en: "Continuous or frequent BP, ECG, heart rate, perfusion and IV access. Infusion pump." },
    evidence: { es: "Guía de consenso AAHA 2020, figura 9, perros y gatos anestesiados. No es una pauta universal para shock séptico. Confirmar formulación y compatibilidad; uso potencialmente fuera de ficha.", en: "AAHA 2020 consensus guideline, figure 9, anesthetized dogs and cats. Not a universal septic shock protocol. Confirm formulation and compatibility; use may be off-label." },
    sources: [aahaAnesthesia],
  },

  {
    id: "norepinephrine", name: { es: "Noradrenalina", en: "Norepinephrine" },
    category: "critical", species: ["dog", "cat"], requiresDilution: true,
    indication: { es: "Soporte de presión arterial durante anestesia · titular a respuesta", en: "Blood-pressure support during anesthesia · titrate to response" },
    drugs: [drug("norepinephrine", "Noradrenalina", "Norepinephrine", 0.05, 0.3, "µg/kg/min")],
    loading: { es: "Sin bolo automático. Iniciar infusión diluida según el producto y titular bajo monitorización.", en: "No automatic bolus. Start a diluted infusion according to the product and titrate under monitoring." },
    caution: { es: "Corregir causas de hipotensión y valorar volemia antes de escalar. Riesgo de vasoconstricción/isquemia y lesión por extravasación.", en: "Correct causes of hypotension and assess volume status before escalation. Vasoconstriction/ischemia and extravasation injury risk." },
    monitor: { es: "PA continua o frecuente, ECG, frecuencia cardiaca, perfusión y acceso IV. Bomba de infusión.", en: "Continuous or frequent BP, ECG, heart rate, perfusion and IV access. Infusion pump." },
    evidence: { es: "Guía de consenso AAHA 2020, figura 9, perros y gatos anestesiados. No es una pauta universal para shock séptico. Confirmar formulación y compatibilidad; uso potencialmente fuera de ficha.", en: "AAHA 2020 consensus guideline, figure 9, anesthetized dogs and cats. Not a universal septic shock protocol. Confirm formulation and compatibility; use may be off-label." },
    sources: [aahaAnesthesia],
  },

  {
    id: "midazolam-status",
    name: { es: "Midazolam · status", en: "Midazolam · status" },
    category: "status", species: ["dog", "cat"],
    indication: { es: "Status epiléptico recurrente · benzodiacepina en CRI", en: "Recurrent status epilepticus · benzodiazepine CRI" },
    drugs: [drug("midazolam", "Midazolam", "Midazolam", 0.3, 0.4, "mg/kg/h")],
    loading: { es: "Bolo IV de referencia: 0,3 mg/kg. Si recurre tras dos bolos, ACVIM contempla otro bolo seguido de CRI; iniciar también el anticonvulsivante de mayor duración.", en: "Reference IV bolus: 0.3 mg/kg. For recurrence after two boluses, ACVIM supports a further bolus followed by CRI; also initiate a longer-acting antiseizure drug." },
    caution: { es: "Depresión respiratoria y sedación, especialmente con otros depresores del SNC. Soporte de vía aérea disponible; ajustar a respuesta y función hepatorrenal.", en: "Respiratory depression and sedation, especially with other CNS depressants. Airway support available; adjust to response and hepatic/renal function." },
    monitor: { es: "Actividad convulsiva/EEG, respiración, SpO₂, PA y sedación.", en: "Seizure activity/EEG, breathing, SpO₂, BP and sedation." },
    evidence: { es: "ACVIM: recomendación A en perros y B en gatos para CRI. Intervalo numérico de la tabla 2 de la revisión 2024; uso anticonvulsivante potencialmente fuera de ficha.", en: "ACVIM: CRI recommendation A in dogs and B in cats. Numeric interval from the 2024 review table 2; antiseizure use may be off-label." },
    sources: SEIZURE_SOURCES,
  },
  {
    id: "dexmedetomidine-anesthesia",
    name: { es: "Dexmedetomidina · anestesia", en: "Dexmedetomidine · anesthesia" },
    category: "anesthesia", species: ["dog", "cat"], requiresDilution: true,
    indication: { es: "Coadyuvante multimodal durante anestesia inhalatoria", en: "Multimodal adjunct during inhalation anesthesia" },
    drugs: [drug("dex", "Dexmedetomidina", "Dexmedetomidine", 0.5, 1, "µg/kg/h")],
    loading: { es: "0,5–1 µg/kg IV durante al menos 10 min si no hubo premedicación con dexmedetomidina. No repetir carga si ya se premedicó.", en: "0.5–1 µg/kg IV over at least 10 min if not premedicated with dexmedetomidine. Omit loading if already premedicated." },
    caution: { es: "No usar en alteraciones cardiovasculares, enfermedad sistémica grave o pacientes moribundos. Diluir Dexdomitor 0,5 mg/mL en NaCl 0,9% o Ringer lactato; usar en 6 h y ajustar el resto de fluidos.", en: "Do not use with cardiovascular disorders, severe systemic disease or moribund patients. Dilute Dexdomitor 0.5 mg/mL in 0.9% NaCl or lactated Ringer’s; use within 6 h and adjust other fluids." },
    monitor: { es: "ECG, PA, perfusión, ventilación, temperatura y profundidad anestésica. Titular el inhalatorio y la analgesia concurrente.", en: "ECG, BP, perfusion, ventilation, temperature and anesthetic depth. Titrate inhalant and concurrent analgesia." },
    evidence: { es: "Ficha europea Dexdomitor 0,5 mg/mL, enero 2026: perros 0,5–1 y gatos 0,5–3 µg/kg/h. No extrapolar la indicación a otras formulaciones.", en: "European Dexdomitor 0.5 mg/mL label, January 2026: dogs 0.5–1 and cats 0.5–3 µg/kg/h. Do not extrapolate the indication to other formulations." },
    sources: [{ label: "Dexdomitor 0,5 mg/mL · UE / EU · 2026 · §§3.9, 5.2", url: DEXDOMITOR_SOURCE }],
  },

  {
    id: "propofol-status",
    name: { es: "Propofol · status", en: "Propofol · status" },
    category: "status",
    species: ["dog", "cat"],
    indication: {
      es: "Status epiléptico refractario · rescate anestésico",
      en: "Refractory status epilepticus · anesthetic rescue",
    },
    drugs: [drug("propofol", "Propofol", "Propofol", 0.1, 0.4, "mg/kg/min")],
    loading: {
      es: "Revisión 2024: 2–8 mg/kg IV, en fracciones del 25% cada 30 s hasta efecto. Contabilizar dosis previas.",
      en: "2024 review: 2–8 mg/kg IV, in 25% fractions every 30 s to effect. Count prior doses.",
    },
    caution: {
      es: "Intubación, oxígeno y ventilación disponibles. Apnea/hipotensión. En gatos: último recurso, duración mínima y control hematológico por riesgo de anemia oxidativa.",
      en: "Intubation, oxygen and ventilation available. Apnea/hypotension. Cats: reserve use, minimum duration and hematology monitoring for oxidative anemia.",
    },
    monitor: {
      es: "EEG si disponible, ECG, PA, SpO₂, EtCO₂ y temperatura.",
      en: "EEG if available, ECG, BP, SpO₂, EtCO₂ and temperature.",
    },
    evidence: {
      es: "ACVIM: recomendación A en perros; precaución C en gatos. Intervalo de cálculo: tabla 2 de revisión 2024; no es la pauta de mantenimiento anestésico.",
      en: "ACVIM: recommendation A in dogs; caution C in cats. Calculator interval: 2024 review table 2; distinct from routine anesthetic maintenance.",
    },
    sources: SEIZURE_SOURCES,
  },
  {
    id: "ketamine-status",
    name: { es: "Ketamina · status", en: "Ketamine · status" },
    category: "status",
    species: ["dog", "cat"],
    indication: {
      es: "Status epiléptico refractario a tratamiento inicial",
      en: "Status epilepticus refractory to initial treatment",
    },
    drugs: [drug("ket", "Ketamina", "Ketamine", 1, 1, "mg/kg/h")],
    loading: {
      es: "Revisión 2024: 1–5 mg/kg IV; titular y contabilizar lo ya administrado.",
      en: "2024 review: 1–5 mg/kg IV; titrate and count prior doses.",
    },
    caution: {
      es: "Tras fracaso del tratamiento inicial, con soporte intensivo. Valorar cardiopatía y efectos simpáticos; evidencia felina muy limitada.",
      en: "After initial treatment failure, with intensive support. Assess heart disease and sympathetic effects; very limited feline evidence.",
    },
    monitor: {
      es: "EEG si disponible, vía aérea, ECG, PA, ventilación y temperatura.",
      en: "EEG if available, airway, ECG, BP, ventilation and temperature.",
    },
    evidence: {
      es: "ACVIM: A en perros, E en gatos. CRI de 1 mg/kg/h según revisión 2024; pauta de referencia, sin asumir un intervalo universal.",
      en: "ACVIM: A in dogs, E in cats. CRI 1 mg/kg/h from the 2024 review; reference protocol, not a universal dosing interval.",
    },
    sources: SEIZURE_SOURCES,
  },
  {
    id: "phenobarbital-status",
    name: { es: "Fenobarbital · status", en: "Phenobarbital · status" },
    category: "status",
    administration: "loading",
    species: ["dog", "cat"],
    drugs: [],
    indication: {
      es: "Carga IV fraccionada · anticonvulsivante de segunda línea",
      en: "Divided IV loading · second-line antiseizure treatment",
    },
    loading: {
      es: "4 mg/kg IV cada 20–30 min, hasta 16–20 mg/kg acumulados según respuesta. No administrar la carga completa de una vez.",
      en: "4 mg/kg IV every 20–30 min, up to 16–20 mg/kg cumulative according to response. Do not administer the full load at once.",
    },
    caution: {
      es: "Sin tratamiento previo y función hepática normal. Si ya recibe fenobarbital, revisar acumulado y niveles antes de cargar. Vigilar depresión respiratoria.",
      en: "For untreated patients with normal hepatic function. If already on phenobarbital, review cumulative dose and levels before loading. Monitor respiratory depression.",
    },
    monitor: {
      es: "Sedación, PA, respiración, función hepática y niveles. Soporte ventilatorio disponible.",
      en: "Sedation, BP, breathing, hepatic function and levels. Ventilatory support available.",
    },
    evidence: {
      es: "ACVIM: A en perros, B en gatos. La pauta es carga fraccionada, no CRI; se integra aquí para escoger todos los anticonvulsivantes en el mismo sitio.",
      en: "ACVIM: A in dogs, B in cats. This is divided loading, not CRI; grouped here to select antiseizure drugs in one place.",
    },
    sources: SEIZURE_SOURCES,
  },

  {
    id: "propofol",
    name: { es: "Propofol", en: "Propofol" },
    category: "anesthesia",
    species: ["dog", "cat"],
    indication: {
      es: "Mantenimiento anestésico tras inducción",
      en: "Anesthetic maintenance after induction",
    },
    drugs: [drug("propofol", "Propofol", "Propofol", 0.2, 0.4, "mg/kg/min")],
    loading: {
      es: "Inducción IV titulada según ficha técnica y premedicación.",
      en: "Titrate IV induction according to product label and premedication.",
    },
    caution: {
      es: "Intubar, oxígeno y ventilación disponibles. Apnea/hipotensión; en gatos, recuperación prolongada y riesgo oxidativo con exposición repetida. Comprobar formulación.",
      en: "Intubate; oxygen and ventilation available. Apnea/hypotension; cats: prolonged recovery and oxidative risk with repeated exposure. Check formulation.",
    },
    monitor: {
      es: "ECG, PA, SpO₂, EtCO₂, temperatura y profundidad.",
      en: "ECG, BP, SpO₂, EtCO₂, temperature and depth.",
    },
    evidence: {
      es: "Ficha británica Propomitor: perro 0,2–0,4; gato 0,1–0,3 mg/kg/min (0,2 estudiado hasta 2 h). Un ensayo en perros evaluó 0,2 mg/kg/min frente a TCI. No acredita otras formulaciones ni uso prolongado.",
      en: "UK Propomitor label: dog 0.2–0.4; cat 0.1–0.3 mg/kg/min (0.2 studied up to 2 h). A canine trial evaluated 0.2 mg/kg/min versus TCI. Does not validate other formulations or prolonged use.",
    },
    sources: [
      {
        label: "Propomitor 10 mg/mL · UK SPC · CRI",
        url: "https://www.noahcompendium.co.uk/?id=-477048",
      },
      {
        label: "ACVIM 2024 · seguridad felina / feline safety",
        url: seizures.url,
      },
      {
        label:
          "Ensayo aleatorizado / randomized trial · 2022 · CRI vs TCI · perros / dogs",
        url: "https://pubmed.ncbi.nlm.nih.gov/35123874/",
      },
    ],
  },
  {
    id: "dexmedetomidine",
    name: { es: "Dexmedetomidina", en: "Dexmedetomidine" },
    category: "analgesia",
    species: ["dog"],
    indication: {
      es: "Coadyuvante posoperatorio · pauta estudiada durante 4 h",
      en: "Postoperative adjunct · studied for 4 h",
    },
    drugs: [drug("dex", "Dexmedetomidina", "Dexmedetomidine", 1, 1, "µg/kg/h")],
    loading: {
      es: "Estudio: 1 µg/kg IV al inicio de anestesia; no repetir automáticamente.",
      en: "Study: 1 µg/kg IV at anesthesia start; do not automatically repeat.",
    },
    caution: {
      es: "Bradicardia/vasoconstricción; evitar en compromiso cardiovascular o hipovolemia. No sustituye analgesia multimodal.",
      en: "Bradycardia/vasoconstriction; avoid with cardiovascular compromise or hypovolemia. Does not replace multimodal analgesia.",
    },
    monitor: {
      es: "ECG, PA, perfusión, sedación y dolor; rescate si precisa.",
      en: "ECG, BP, perfusion, sedation and pain; rescue if needed.",
    },
    evidence: {
      es: "Ensayo aleatorizado, 54 perras: dexmedetomidina sola no garantizó analgesia suficiente.",
      en: "Randomized trial, 54 female dogs: dexmedetomidine alone did not ensure adequate analgesia.",
    },
    sources: [postoperative],
  },
  {
    id: "ketamine",
    name: { es: "Ketamina", en: "Ketamine" },
    category: "analgesia",
    species: ["dog"],
    indication: {
      es: "Coadyuvante posoperatorio · pauta estudiada durante 4 h",
      en: "Postoperative adjunct · studied for 4 h",
    },
    drugs: [drug("ket", "Ketamina", "Ketamine", 10, 10, "µg/kg/min")],
    loading: {
      es: "Estudio: 1 mg/kg IV al inicio de anestesia.",
      en: "Study: 1 mg/kg IV at anesthesia start.",
    },
    caution: {
      es: "Disforia y efectos simpáticos; valorar cardiopatía. Sola puede ser insuficiente.",
      en: "Dysphoria and sympathetic effects; assess heart disease. May be insufficient alone.",
    },
    monitor: {
      es: "Dolor, sedación, ECG, PA y ventilación.",
      en: "Pain, sedation, ECG, BP and ventilation.",
    },
    evidence: {
      es: "Ensayo clínico: 10 µg/kg/min = 0,6 mg/kg/h; prever rescate.",
      en: "Clinical trial: 10 µg/kg/min = 0.6 mg/kg/h; plan rescue analgesia.",
    },
    sources: [postoperative],
  },
  {
    id: "lkd",
    name: {
      es: "Lidocaína + ketamina + dexmedetomidina",
      en: "Lidocaine + ketamine + dexmedetomidine",
    },
    category: "analgesia",
    species: ["dog"],
    indication: {
      es: "LKD posoperatoria · 4 h tras ovariohisterectomía",
      en: "Postoperative LKD · 4 h after ovariohysterectomy",
    },
    drugs: [
      drug("lido", "Lidocaína", "Lidocaine", 25, 25, "µg/kg/min"),
      drug("ket", "Ketamina", "Ketamine", 10, 10, "µg/kg/min"),
      drug("dex", "Dexmedetomidina", "Dexmedetomidine", 1, 1, "µg/kg/h"),
    ],
    loading: {
      es: "Estudio, inicio de anestesia: lidocaína 2 mg/kg, ketamina 1 mg/kg y dexmedetomidina 1 µg/kg IV.",
      en: "Study, anesthesia start: lidocaine 2 mg/kg, ketamine 1 mg/kg and dexmedetomidine 1 µg/kg IV.",
    },
    caution: {
      es: "Solo perros. Riesgo cardiovascular y toxicidad por lidocaína. Calcular cada jeringa por separado.",
      en: "Dogs only. Cardiovascular risk and lidocaine toxicity. Calculate each syringe separately.",
    },
    monitor: {
      es: "ECG, PA, perfusión, ventilación, dolor y sedación.",
      en: "ECG, BP, perfusion, ventilation, pain and sedation.",
    },
    evidence: {
      es: "Ensayo aleatorizado, 54 perras: ningún rescate en LKD. Población y duración limitadas.",
      en: "Randomized trial, 54 female dogs: no rescue in LKD. Limited population and duration.",
    },
    sources: [postoperative],
  },
  {
    id: "furosemide",
    name: { es: "Furosemida", en: "Furosemide" },
    category: "critical",
    species: ["dog"],
    indication: {
      es: "Edema pulmonar cardiogénico grave · enfermedad mitral",
      en: "Severe cardiogenic pulmonary edema · mitral disease",
    },
    drugs: [drug("furo", "Furosemida", "Furosemide", 0.66, 1, "mg/kg/h")],
    loading: {
      es: "Después del bolo inicial; contabilizar dosis ya administrada.",
      en: "After initial bolus; count doses already administered.",
    },
    caution: {
      es: "No usar para forzar diuresis en deshidratación o anuria. Riesgo de hipovolemia, azotemia e hipopotasemia.",
      en: "Do not use to force diuresis in dehydration or anuria. Risk of hypovolemia, azotemia and hypokalemia.",
    },
    monitor: {
      es: "FR/esfuerzo, PA, diuresis, peso, creatinina y Na/K/Cl.",
      en: "Respiratory rate/effort, BP, urine output, weight, creatinine and Na/K/Cl.",
    },
    evidence: {
      es: "ACVIM 2019: clase IIa, evidencia débil. Estudio retrospectivo en 100 perros/gatos: no demuestra superioridad causal de CRI.",
      en: "ACVIM 2019: class IIa, weak evidence. Retrospective study in 100 dogs/cats: does not establish causal CRI superiority.",
    },
    sources: [
      {
        label: "Keene et al. · ACVIM 2019 · doi:10.1111/jvim.15488",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/jvim.15488",
      },
      {
        label: "Ohad et al. · 2018 · CRI vs bolos / boluses",
        url: "https://pubmed.ncbi.nlm.nih.gov/30103918/",
      },
    ],
  },
  {
    id: "ket-dex",
    name: {
      es: "Ketamina + dexmedetomidina",
      en: "Ketamine + dexmedetomidine",
    },
    category: "status",
    species: ["dog"],
    indication: {
      es: "Status epiléptico superrefractario · UCI",
      en: "Super-refractory status epilepticus · ICU",
    },
    drugs: [
      drug("ket", "Ketamina", "Ketamine", 1, 1, "mg/kg/h"),
      drug("dex", "Dexmedetomidina", "Dexmedetomidine", 3, 7, "µg/kg/h"),
    ],
    loading: {
      es: "Serie: ketamina 1 mg/kg IV en 5 min, después dexmedetomidina 3 µg/kg IV en 5 min.",
      en: "Series: ketamine 1 mg/kg IV over 5 min, then dexmedetomidine 3 µg/kg IV over 5 min.",
    },
    caution: {
      es: "Rescate tras fracaso previo. Bradicardia/vasoconstricción: valorar perfusión y cardiopatía. Sin extrapolación a gatos.",
      en: "Rescue after previous treatment failure. Bradycardia/vasoconstriction: assess perfusion and heart disease. No extrapolation to cats.",
    },
    monitor: {
      es: "EEG si disponible, vía aérea, ECG, PA, ventilación y temperatura.",
      en: "EEG if available, airway, ECG, BP, ventilation and temperature.",
    },
    evidence: {
      es: "Evidencia muy baja: 3 perros, infusión 12 h e hipotermia controlada concomitante. No permite aislar el efecto farmacológico.",
      en: "Very low evidence: 3 dogs, 12 h infusion with concurrent controlled hypothermia. Drug effect cannot be isolated.",
    },
    sources: [gioeni, seizures],
  },
];

export function criDrugsForSpecies(
  protocol: CriProtocol,
  species: CriSpecies,
): CriDrug[] {
  return protocol.drugs.map((item) =>
    protocol.id === "propofol" && species === "cat"
      ? { ...item, min: 0.1, max: 0.3 }
      : protocol.id === "dexmedetomidine-anesthesia" && species === "cat"
        ? { ...item, min: 0.5, max: 3 }
      : item,
  );
}

export interface CriPresentation {
  id: string;
  mgMl: number;
  label: string;
  labelEn?: string;
  source?: string;
  vialMl?: number;
  seizureRestriction?: "contraindicated" | "caution";
}
export const PROPOFOL_LIPURO_SOURCE =
  "https://cimavet.aemps.es/cimavet/pdfs/es/ft/1578%20ESP/1578_ESP_ft.pdf";
export const LUMINAL_SOURCE =
  "https://cima.aemps.es/cima/dochtml/ft/3905/FT_3905.html";
export const CRI_PRESENTATIONS: Record<string, CriPresentation[]> = {
  midazolam: [{ id: "midazolam5", mgMl: 5, label: "Midazolam B. Braun · 5 mg/mL", source: "https://cima.aemps.es/cima/dochtml/ft/68903/FT_68903.html" }],
  propofol: [
    {
      id: "lipuro10",
      mgMl: 10,
      label: "Propofol Lipuro vet · 1% = 10 mg/mL",
      source: PROPOFOL_LIPURO_SOURCE,
    },
  ],
  ket: [
    {
      id: "ket100",
      mgMl: 100,
      label: "Ketamidor · 100 mg/mL · 10 mL",
      vialMl: 10,
      seizureRestriction: "contraindicated",
      source:
        "https://cimavet.aemps.es/cimavet/pdfs/es/ft/2695%2BESP/FT_2695%2BESP.pdf",
    },
    {
      id: "ketabel100",
      mgMl: 100,
      label: "Ketabel · 100 mg/mL · 10 mL",
      vialMl: 10,
      seizureRestriction: "caution",
      source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/4052%2BESP/FT_4052%2BESP.pdf",
    },
    {
      id: "ketexx100",
      mgMl: 100,
      label: "Ketexx · 100 mg/mL · 10 mL",
      vialMl: 10,
      seizureRestriction: "caution",
      source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/4090%2BESP/FT_4090%2BESP.pdf",
    },
    {
      id: "anesketin100",
      mgMl: 100,
      label: "Anesketin · 100 mg/mL · 10 mL",
      vialMl: 10,
      seizureRestriction: "contraindicated",
      source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/2834%2BESP/FT_2834%2BESP.pdf",
    },
    {
      id: "anaestamine100",
      mgMl: 100,
      label: "Anaestamine · 100 mg/mL · 10 mL",
      vialMl: 10,
      seizureRestriction: "caution",
      source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/3138%2BESP/FT_3138%2BESP.pdf",
    },
    {
      id: "ket50",
      mgMl: 50,
      label: "Ketolar · 5% = 50 mg/mL",
      vialMl: 10,
      source:
        "https://cima.aemps.es/cima/dochtml/ft/47034/FichaTecnica_47034.html",
    },
  ],
  pheno: [
    {
      id: "luminal200",
      mgMl: 200,
      label: "Luminal · 20% = 200 mg/mL",
      source: LUMINAL_SOURCE,
    },
  ],
  dex: [
    {
      id: "dex500",
      mgMl: 0.5,
      label: "Dexdomitor · 500 µg/mL = 0,5 mg/mL",
      source: DEXDOMITOR_SOURCE,
    },
  ],
  furo: [
    {
      id: "furo10",
      mgMl: 10,
      label: "Seguril · 20 mg/2 mL = 10 mg/mL",
      source:
        "https://cima.aemps.es/cima/dochtml/ft/39968/FichaTecnica_39968.html",
    },
  ],
};
