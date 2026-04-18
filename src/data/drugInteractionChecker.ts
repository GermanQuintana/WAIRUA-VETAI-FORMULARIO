import { LocalizedText } from '../types';

export type InteractionSeverity = 'major' | 'moderate' | 'minor' | 'unknown';

export interface InteractionCheckerProfile {
  name: string;
  aliases?: string[];
  classes: string[];
  metabolism?: LocalizedText;
  excretion?: LocalizedText;
  cautions?: LocalizedText;
}

export interface InteractionRule {
  id: string;
  severity: InteractionSeverity;
  drugs?: string[];
  requiredClasses?: string[];
  title: LocalizedText;
  summary: LocalizedText;
  management: LocalizedText;
}

export const normalizeInteractionName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const interactionProfiles: InteractionCheckerProfile[] = [
  {
    name: 'Meloxicam',
    aliases: ['Metacam', 'Meloxidyl'],
    classes: ['nsaid'],
    metabolism: {
      es: 'Metabolizacion hepatica con alto impacto clinico si baja perfusion renal o hidratacion.',
      en: 'Hepatic metabolism with high clinical impact when renal perfusion or hydration drops.',
    },
    excretion: {
      es: 'Eliminacion mixta, pero el riesgo practico suele ser renal/hemodinamico.',
      en: 'Mixed elimination, though the practical risk is usually renal/hemodynamic.',
    },
    cautions: {
      es: 'No mezclar con corticoides ni otros AINEs; vigilar si convive con IECA o diureticos.',
      en: 'Do not combine with corticosteroids or other NSAIDs; monitor closely with ACE inhibitors or diuretics.',
    },
  },
  {
    name: 'Carprofeno',
    classes: ['nsaid'],
    metabolism: {
      es: 'Predominio hepatobiliar.',
      en: 'Predominantly hepatobiliary.',
    },
    excretion: {
      es: 'Eliminacion biliar/fecal relevante.',
      en: 'Relevant biliary/fecal elimination.',
    },
  },
  {
    name: 'Robenacoxib',
    classes: ['nsaid'],
    metabolism: {
      es: 'Metabolizacion hepatica rapida.',
      en: 'Rapid hepatic metabolism.',
    },
    excretion: {
      es: 'Eliminacion biliar y renal.',
      en: 'Biliary and renal elimination.',
    },
  },
  { name: 'Firocoxib', classes: ['nsaid'] },
  {
    name: 'Prednisolona',
    classes: ['corticosteroid'],
    metabolism: {
      es: 'Transformacion y aclaramiento hepaticos.',
      en: 'Hepatic transformation and clearance.',
    },
    excretion: {
      es: 'Metabolitos renales.',
      en: 'Renal metabolite excretion.',
    },
  },
  { name: 'Dexametasona', classes: ['corticosteroid'] },
  {
    name: 'Furosemida',
    classes: ['diuretic'],
    metabolism: {
      es: 'Menor biotransformacion; efecto muy ligado a perfusion renal y respuesta tubular.',
      en: 'Limited biotransformation; effect strongly tied to renal perfusion and tubular response.',
    },
    excretion: {
      es: 'Predominantemente renal.',
      en: 'Predominantly renal.',
    },
  },
  { name: 'Espironolactona', classes: ['diuretic'] },
  { name: 'Benazepril', classes: ['ace_inhibitor'] },
  { name: 'Enalapril', classes: ['ace_inhibitor'] },
  { name: 'Ramipril', classes: ['ace_inhibitor'] },
  {
    name: 'Digoxina',
    classes: ['digoxin'],
    metabolism: {
      es: 'Poca metabolizacion; farmaco de margen estrecho.',
      en: 'Minimal metabolism; narrow-therapeutic-index drug.',
    },
    excretion: {
      es: 'Mayormente renal.',
      en: 'Mostly renal.',
    },
    cautions: {
      es: 'La funcion renal y las interacciones de conduccion cambian mucho su seguridad.',
      en: 'Renal function and conduction-related interactions strongly shift safety.',
    },
  },
  { name: 'Diltiazem', classes: ['conduction_depressant'] },
  { name: 'Amiodarona', classes: ['conduction_depressant'] },
  { name: 'Atenolol', classes: ['conduction_depressant'] },
  {
    name: 'Ciclosporina',
    classes: ['cyp3a_substrate', 'p_gp_substrate'],
    metabolism: {
      es: 'Sustrato claro de CYP3A y P-gp.',
      en: 'Clear CYP3A and P-gp substrate.',
    },
    excretion: {
      es: 'Eliminacion principalmente biliar tras metabolismo.',
      en: 'Mainly biliary elimination after metabolism.',
    },
    cautions: {
      es: 'Azoles y macrolidos pueden subir mucho la exposicion.',
      en: 'Azoles and macrolides can markedly increase exposure.',
    },
  },
  {
    name: 'Ketoconazol',
    classes: ['cyp3a_inhibitor', 'azole_antifungal'],
    metabolism: {
      es: 'Inhibidor potente de CYP3A/P-gp con impacto clinico real.',
      en: 'Potent CYP3A/P-gp inhibitor with real clinical impact.',
    },
    excretion: {
      es: 'Predominio biliar.',
      en: 'Predominantly biliary.',
    },
  },
  {
    name: 'Itraconazol',
    classes: ['cyp3a_inhibitor', 'azole_antifungal'],
    metabolism: {
      es: 'Inhibidor importante de CYP3A y P-gp.',
      en: 'Relevant CYP3A and P-gp inhibitor.',
    },
    excretion: {
      es: 'Principalmente biliar/fecal.',
      en: 'Mainly biliary/fecal.',
    },
  },
  {
    name: 'Fluconazol',
    classes: ['azole_antifungal'],
    metabolism: {
      es: 'Menor metabolismo que otros azoles; aun asi modifica interacciones concretas.',
      en: 'Less metabolized than other azoles, yet still changes specific interactions.',
    },
    excretion: {
      es: 'Mayormente renal.',
      en: 'Mostly renal.',
    },
  },
  {
    name: 'Fenobarbital',
    classes: ['enzyme_inducer', 'antiepileptic'],
    metabolism: {
      es: 'Inductor enzimatico clasico con gran capacidad de cambiar exposicion de otros farmacos.',
      en: 'Classic enzyme inducer with strong ability to alter exposure of other drugs.',
    },
    excretion: {
      es: 'Metabolizacion hepatica y parte renal sin cambios.',
      en: 'Hepatic metabolism with some unchanged renal excretion.',
    },
  },
  {
    name: 'Zonisamida',
    classes: ['antiepileptic'],
    metabolism: {
      es: 'Parte hepatica, parte renal; sensible a induccion enzimatica.',
      en: 'Part hepatic, part renal; sensitive to enzyme induction.',
    },
    excretion: {
      es: 'Mixta renal/hepatica.',
      en: 'Mixed renal/hepatic elimination.',
    },
  },
  {
    name: 'Levetiracetam',
    classes: ['antiepileptic'],
    metabolism: {
      es: 'Escasa metabolizacion hepatica.',
      en: 'Minimal hepatic metabolism.',
    },
    excretion: {
      es: 'Principalmente renal.',
      en: 'Primarily renal.',
    },
  },
  { name: 'Clopidogrel', classes: ['antiplatelet'] },
  { name: 'Heparina sodica', aliases: ['Heparina'], classes: ['anticoagulant'] },
  {
    name: 'Maropitant',
    aliases: ['Cerenia'],
    classes: ['cyp3a_substrate'],
    metabolism: {
      es: 'Metabolizacion hepatica relevante, sobre todo si coincide con hepatopatia o inhibidores enzimaticos.',
      en: 'Relevant hepatic metabolism, especially with liver disease or enzyme inhibitors.',
    },
    excretion: {
      es: 'Eliminacion biliar predominante.',
      en: 'Predominantly biliary elimination.',
    },
  },
  {
    name: 'Ondansetron',
    classes: ['cyp3a_substrate'],
    metabolism: {
      es: 'Metabolizacion hepatica.',
      en: 'Hepatic metabolism.',
    },
    excretion: {
      es: 'Mixta, con metabolitos renales.',
      en: 'Mixed, with renal metabolite excretion.',
    },
  },
  {
    name: 'Metronidazol',
    classes: ['cyp3a_substrate'],
    metabolism: {
      es: 'Metabolizacion hepatica con riesgo de acumulacion si hay disfuncion hepática.',
      en: 'Hepatic metabolism with accumulation risk in hepatic dysfunction.',
    },
    excretion: {
      es: 'Renal y fecal.',
      en: 'Renal and fecal.',
    },
  },
  {
    name: 'Claritromicina',
    classes: ['cyp3a_inhibitor'],
    metabolism: {
      es: 'Macrolido con inhibicion metabolica clinicamente util.',
      en: 'Macrolide with clinically relevant metabolic inhibition.',
    },
    excretion: {
      es: 'Mixta hepatica y renal.',
      en: 'Mixed hepatic and renal.',
    },
  },
  {
    name: 'Omeprazol',
    classes: ['cyp3a_substrate'],
    metabolism: {
      es: 'Metabolizacion hepatica.',
      en: 'Hepatic metabolism.',
    },
    excretion: {
      es: 'Metabolitos renales y biliares.',
      en: 'Renal and biliary metabolite excretion.',
    },
  },
];

export const interactionRules: InteractionRule[] = [
  {
    id: 'nsaid-corticosteroid',
    severity: 'major',
    requiredClasses: ['nsaid', 'corticosteroid'],
    title: {
      es: 'AINE + corticoide',
      en: 'NSAID + corticosteroid',
    },
    summary: {
      es: 'Aumenta claramente el riesgo de ulceracion gastrointestinal, perforacion y daño renal.',
      en: 'Clearly increases the risk of gastrointestinal ulceration, perforation, and renal injury.',
    },
    management: {
      es: 'Evitar salvo decision muy justificada; respetar lavado farmacologico y buscar alternativa.',
      en: 'Avoid unless strongly justified; respect washout periods and seek an alternative.',
    },
  },
  {
    id: 'nsaid-nsaid',
    severity: 'major',
    requiredClasses: ['nsaid', 'nsaid'],
    title: {
      es: 'Doble AINE',
      en: 'Dual NSAID exposure',
    },
    summary: {
      es: 'Suma toxicidad gastrointestinal y renal sin beneficio habitual que compense el riesgo.',
      en: 'Adds GI and renal toxicity without the usual clinical benefit to justify the risk.',
    },
    management: {
      es: 'No combinar; revisar duplicidades por alta, medicacion domiciliaria o cambios de protocolo.',
      en: 'Do not combine; check for duplication from discharge meds, home treatment, or protocol changes.',
    },
  },
  {
    id: 'triple-whammy',
    severity: 'major',
    requiredClasses: ['nsaid', 'ace_inhibitor', 'diuretic'],
    title: {
      es: 'AINE + IECA + diuretico',
      en: 'NSAID + ACE inhibitor + diuretic',
    },
    summary: {
      es: 'Combinacion clasica de deterioro renal hemodinamico, especialmente en pacientes deshidratados o cardiacos.',
      en: 'Classic hemodynamic renal-injury combination, especially in dehydrated or cardiac patients.',
    },
    management: {
      es: 'Si no se puede evitar, hidratar, monitorizar creatinina/electrolitos y revisar la necesidad real de cada pieza.',
      en: 'If unavoidable, hydrate, monitor creatinine/electrolytes, and reassess the real need for each component.',
    },
  },
  {
    id: 'digoxin-conduction',
    severity: 'major',
    requiredClasses: ['digoxin', 'conduction_depressant'],
    title: {
      es: 'Digoxina + depresores de conduccion',
      en: 'Digoxin + conduction-depressing agents',
    },
    summary: {
      es: 'Puede aumentar bradicardia, bloqueo AV y toxicidad clinica, sobre todo si hay enfermedad cardiaca avanzada.',
      en: 'May increase bradycardia, AV block, and clinical toxicity, especially in advanced heart disease.',
    },
    management: {
      es: 'Ajustar y monitorizar con ECG, frecuencia cardiaca y, si procede, niveles o signos compatibles con toxicidad.',
      en: 'Adjust and monitor with ECG, heart rate, and when appropriate serum levels or toxicity signs.',
    },
  },
  {
    id: 'cyclo-ketoconazole',
    severity: 'moderate',
    drugs: ['Ciclosporina', 'Ketoconazol'],
    title: {
      es: 'Ciclosporina + ketoconazol',
      en: 'Cyclosporine + ketoconazole',
    },
    summary: {
      es: 'Puede aumentar mucho la exposicion a ciclosporina. A veces se usa de forma intencional como ahorro de dosis.',
      en: 'Can markedly increase cyclosporine exposure. It is sometimes used intentionally as a dose-sparing strategy.',
    },
    management: {
      es: 'Solo con plan consciente de monitorizacion clinica y analitica; no mezclar como si fuera una combinacion inocua.',
      en: 'Use only with deliberate clinical and laboratory monitoring; do not treat it as an innocuous combination.',
    },
  },
  {
    id: 'cyclo-itraconazole',
    severity: 'moderate',
    drugs: ['Ciclosporina', 'Itraconazol'],
    title: {
      es: 'Ciclosporina + itraconazol',
      en: 'Cyclosporine + itraconazole',
    },
    summary: {
      es: 'Interaccion del mismo eje metabolico que puede potenciar exposición e inmunosupresion.',
      en: 'Same metabolic-axis interaction that can increase exposure and immunosuppression.',
    },
    management: {
      es: 'Ajustar dosis y vigilar toxicidad gastrointestinal, hepatica y el contexto infeccioso del paciente.',
      en: 'Adjust dose and monitor GI/hepatic toxicity plus the patient infectious-risk context.',
    },
  },
  {
    id: 'cyclo-clarithromycin',
    severity: 'moderate',
    drugs: ['Ciclosporina', 'Claritromicina'],
    title: {
      es: 'Ciclosporina + claritromicina',
      en: 'Cyclosporine + clarithromycin',
    },
    summary: {
      es: 'La claritromicina puede aumentar la exposicion a ciclosporina por inhibicion metabolica.',
      en: 'Clarithromycin can increase cyclosporine exposure through metabolic inhibition.',
    },
    management: {
      es: 'Vigilar toxicidad digestiva, inmunosupresion y necesidad de ajustar dosis.',
      en: 'Monitor digestive toxicity, immunosuppression, and the need for dose adjustment.',
    },
  },
  {
    id: 'phenobarbital-zonisamide',
    severity: 'moderate',
    drugs: ['Fenobarbital', 'Zonisamida'],
    title: {
      es: 'Fenobarbital + zonisamida',
      en: 'Phenobarbital + zonisamide',
    },
    summary: {
      es: 'La induccion enzimatica por fenobarbital puede reducir concentraciones de zonisamida y obligar a reajuste.',
      en: 'Phenobarbital enzyme induction can lower zonisamide concentrations and force dose adjustment.',
    },
    management: {
      es: 'Revisar control de crisis, sedacion, enzimas hepaticas y si hace falta adaptar dosis.',
      en: 'Review seizure control, sedation, liver enzymes, and adapt dose if needed.',
    },
  },
  {
    id: 'phenobarbital-cyclosporine',
    severity: 'moderate',
    drugs: ['Fenobarbital', 'Ciclosporina'],
    title: {
      es: 'Fenobarbital + ciclosporina',
      en: 'Phenobarbital + cyclosporine',
    },
    summary: {
      es: 'La induccion enzimatica puede bajar la exposicion de ciclosporina y reducir eficacia clinica.',
      en: 'Enzyme induction can lower cyclosporine exposure and reduce clinical efficacy.',
    },
    management: {
      es: 'Revisar respuesta clinica e interpretar posibles fallos terapeuticos antes de subir dosis a ciegas.',
      en: 'Review clinical response and interpret therapeutic failure before blindly increasing dose.',
    },
  },
  {
    id: 'metronidazole-phenobarbital',
    severity: 'moderate',
    drugs: ['Metronidazol', 'Fenobarbital'],
    title: {
      es: 'Metronidazol + fenobarbital',
      en: 'Metronidazole + phenobarbital',
    },
    summary: {
      es: 'Puede alterarse el aclaramiento de uno o ambos y aumentar neurotoxicidad/sedacion en determinados pacientes.',
      en: 'Clearance of one or both agents may change and neurotoxicity/sedation can increase in selected patients.',
    },
    management: {
      es: 'Usar la dosis minima eficaz y vigilar signos neurologicos, ataxia o sedacion excesiva.',
      en: 'Use the minimum effective dose and monitor for neurologic signs, ataxia, or excessive sedation.',
    },
  },
  {
    id: 'ondansetron-maropitant',
    severity: 'minor',
    drugs: ['Ondansetron', 'Maropitant'],
    title: {
      es: 'Ondansetron + maropitant',
      en: 'Ondansetron + maropitant',
    },
    summary: {
      es: 'Combinacion frecuente; el punto clave no suele ser prohibirla sino revisar si hay duplicidad o necesidad real.',
      en: 'Common combination; the key point is usually not prohibition but checking whether the combination is truly needed.',
    },
    management: {
      es: 'Mantener si la indicacion esta clara y el paciente lo requiere; revisar plan antiemetico global.',
      en: 'Keep it if clinically justified and the patient needs it; review the overall antiemetic strategy.',
    },
  },
  {
    id: 'clopidogrel-anticoag',
    severity: 'moderate',
    requiredClasses: ['antiplatelet', 'anticoagulant'],
    title: {
      es: 'Antiagregante + anticoagulante',
      en: 'Antiplatelet + anticoagulant',
    },
    summary: {
      es: 'Aumenta el riesgo de sangrado clinicamente relevante.',
      en: 'Increases the risk of clinically relevant bleeding.',
    },
    management: {
      es: 'Valorar indicacion exacta, control de hemorragia y si la combinacion tiene respaldo real para ese paciente.',
      en: 'Reassess exact indication, bleeding surveillance, and whether the combination is truly justified for that patient.',
    },
  },
];
