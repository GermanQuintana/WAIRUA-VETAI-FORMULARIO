export type FluidGuideText = { es: string; en: string };
const root = 'https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/';
export const FLUID_SOURCES = {
  replacement: `${root}section-3-fluids-for-replacement-and-maintenance/`,
  anesthesia: `${root}section-4-fluid-therapy-and-anesthesia/`,
  illness: `${root}section-5-fluid-therapy-in-ill-patients/`,
  overload: `${root}section-6-fluid-overload/`,
  colloids: `${root}section-7-questions-and-controversies-in-fluid-therapy/`,
  monitoring: `${root}section-8-fluid-administration-and-monitoring/`,
};
export interface FluidGuideRecord {
  id: string; tone: 'teal' | 'blue' | 'violet' | 'amber' | 'red';
  title: FluidGuideText; examples: FluidGuideText; purpose: FluidGuideText;
  uses: FluidGuideText; precautions: FluidGuideText; monitor: FluidGuideText;
  evidence: FluidGuideText; sources: Array<{ label: string; url: string }>;
}
export const FLUID_GUIDE: FluidGuideRecord[] = [
  {
    id: 'balanced', tone: 'teal', title: { es: 'Cristaloides isotónicos balanceados', en: 'Balanced isotonic crystalloids' },
    examples: { es: 'Ringer lactato · Plasma-Lyte · Normosol-R', en: 'Lactated Ringer’s · Plasma-Lyte · Normosol-R' },
    purpose: { es: 'Reposición y perfusión', en: 'Replacement and perfusion' },
    uses: { es: 'Perros y gatos: pérdidas extracelulares, deshidratación, hipovolemia y apoyo durante anestesia, según evaluación. Separar el bolo de resucitación del plan posterior.', en: 'Dogs and cats: extracellular losses, dehydration, hypovolemia, and anesthesia support according to assessment. Separate resuscitation boluses from the subsequent plan.' },
    precautions: { es: 'Individualizar en cardiopatía, oliguria/anuria y alteraciones de sodio. No todos los productos tienen la misma composición: Ringer lactato contiene calcio y K; otros contienen K y Mg. Comprobar compatibilidad de aditivos y transfusiones.', en: 'Individualize with heart disease, oliguria/anuria, and sodium disorders. Products differ: lactated Ringer’s contains calcium and K; others contain K and Mg. Check compatibility with additives and transfusions.' },
    monitor: { es: 'Perfusión, peso, balance, respiración y Na/K/Cl. Revalorar después de cada bolo.', en: 'Perfusion, weight, balance, respiration, and Na/K/Cl. Reassess after every bolus.' },
    evidence: { es: 'Guía AAHA 2024, perros y gatos. Ver composición en tabla 8.', en: 'AAHA 2024 guideline, dogs and cats. See composition in Table 8.' },
    sources: [{ label: 'AAHA · reposición y mantenimiento', url: FLUID_SOURCES.replacement }, { label: 'AAHA · anestesia', url: FLUID_SOURCES.anesthesia }],
  },
  {
    id: 'saline', tone: 'blue', title: { es: 'Cloruro sódico 0,9%', en: '0.9% sodium chloride' },
    examples: { es: 'NaCl 0,9% · isotónico no balanceado', en: '0.9% NaCl · unbalanced isotonic' },
    purpose: { es: 'Elección según electrolitos', en: 'Selection by electrolytes' },
    uses: { es: 'Perros y gatos: reposición cuando su carga de sodio/cloro y ausencia de potasio se ajustan al problema. La elección depende del ionograma, equilibrio ácido-base y objetivo.', en: 'Dogs and cats: replacement when its sodium/chloride load and absence of potassium suit the problem. Selection depends on electrolytes, acid–base status, and the goal.' },
    precautions: { es: 'No es intercambiable sin revisión con un balanceado: Na y Cl 154 mEq/L, sin K ni tampón. Puede aumentar la carga de cloro. AAHA aconseja evitar la vía SC por su pH bajo y posible dolor.', en: 'Review before substituting for a balanced fluid: Na and Cl 154 mEq/L, no K or buffer. It can increase chloride load. AAHA advises avoiding SC administration because low pH may cause pain.' },
    monitor: { es: 'Cloro, sodio, equilibrio ácido-base, función renal y balance.', en: 'Chloride, sodium, acid–base status, kidney function, and balance.' },
    evidence: { es: 'Guía AAHA 2024, tabla 8 y recomendaciones de vía SC.', en: 'AAHA 2024 guideline, Table 8 and SC route recommendations.' },
    sources: [{ label: 'AAHA · composición y vías', url: FLUID_SOURCES.replacement }],
  },
  {
    id: 'maintenance', tone: 'violet', title: { es: 'Soluciones de mantenimiento / hipotónicas', en: 'Maintenance / hypotonic solutions' },
    examples: { es: 'NaCl 0,45% · formulaciones de mantenimiento', en: '0.45% NaCl · maintenance formulations' },
    purpose: { es: 'Necesidades diarias', en: 'Daily requirements' },
    uses: { es: 'Perros y gatos euvolémicos sin ingesta suficiente: seleccionar una solución de mantenimiento según pérdidas de agua y electrolitos. Contabilizar agua enteral y medicaciones IV.', en: 'Euvolemic dogs and cats with inadequate intake: choose a maintenance solution according to water and electrolyte losses. Count enteral water and IV medications.' },
    precautions: { es: 'No usar para resucitar hipovolemia. Vigilar sodio y evitar cambios bruscos de tonicidad, especialmente en trastornos de sodio crónicos.', en: 'Not for hypovolemic resuscitation. Monitor sodium and avoid abrupt tonicity changes, especially in chronic sodium disorders.' },
    monitor: { es: 'Na/K, ingesta, diuresis, peso y necesidad de continuar la vía IV.', en: 'Na/K, intake, urine output, weight, and ongoing need for IV therapy.' },
    evidence: { es: 'Guía AAHA 2024: reposición y mantenimiento tienen objetivos diferentes.', en: 'AAHA 2024 guideline: replacement and maintenance have different goals.' },
    sources: [{ label: 'AAHA · mantenimiento', url: FLUID_SOURCES.replacement }, { label: 'AAHA · trastornos de sodio', url: FLUID_SOURCES.illness }],
  },
  {
    id: 'dextrose', tone: 'amber', title: { es: 'Dextrosa y soluciones glucosadas', en: 'Dextrose-containing solutions' },
    examples: { es: 'Glucosa en agua · dextrosa añadida a cristaloide', en: 'Dextrose in water · dextrose added to crystalloid' },
    purpose: { es: 'Glucemia / agua libre', en: 'Glucose / free water' },
    uses: { es: 'Perros y gatos: soporte de hipoglucemia según signos y controles; aporte de agua libre cuando esté indicado por el trastorno de sodio. La glucosa en agua y un cristaloide con dextrosa no cumplen el mismo objetivo.', en: 'Dogs and cats: hypoglycemia support according to signs and monitoring; free water when appropriate for a sodium disorder. Dextrose in water and a dextrose-supplemented crystalloid serve different purposes.' },
    precautions: { es: 'Glucosa al 5% en agua no sirve para resucitar hipovolemia. Confirmar dilución y acceso; concentraciones >5% requieren valorar vía central por riesgo de flebitis. En insulinoma, usar la concentración mínima eficaz y controlar respuesta.', en: '5% dextrose in water is not for hypovolemic resuscitation. Confirm dilution and access; concentrations >5% require consideration of a central line because of phlebitis risk. With insulinoma, use the lowest effective concentration and monitor response.' },
    monitor: { es: 'Glucosa seriada, Na, sitio de infusión y respuesta clínica.', en: 'Serial glucose, Na, infusion site, and clinical response.' },
    evidence: { es: 'Guía AAHA 2024: hipoglucemia y formulación de soluciones glucosadas.', en: 'AAHA 2024 guideline: hypoglycemia and dextrose solution formulation.' },
    sources: [{ label: 'AAHA · hipoglucemia y dextrosa', url: FLUID_SOURCES.illness }],
  },
  {
    id: 'hypertonic', tone: 'red', title: { es: 'Salino hipertónico', en: 'Hypertonic saline' },
    examples: { es: 'NaCl 3–7,5% · uso monitorizado', en: '3–7.5% NaCl · monitored use' },
    purpose: { es: 'Indicaciones específicas', en: 'Specific indications' },
    uses: { es: 'Perros y gatos: expansión intravascular con poco volumen en casos seleccionados, o manejo específico de hipertensión intracraneal / hiponatremia sintomática. La concentración y pauta dependen de la indicación.', en: 'Dogs and cats: low-volume intravascular expansion in selected cases, or specific management of intracranial hypertension / symptomatic hyponatremia. Concentration and regimen depend on the indication.' },
    precautions: { es: 'No equivale a rehidratar. Requiere plan posterior y controles; especial cuidado con hipernatremia y alteraciones crónicas de Na. No aplicar una pauta de shock a la corrección de sodio.', en: 'It does not replace rehydration. Requires a subsequent plan and monitoring; particular care with hypernatremia and chronic Na disorders. Do not apply a shock regimen to sodium correction.' },
    monitor: { es: 'Perfusión, Na seriado, estado neurológico y balance.', en: 'Perfusion, serial Na, neurologic status, and balance.' },
    evidence: { es: 'Guía AAHA 2024; evidencia veterinaria limitada en algunas indicaciones neurológicas.', en: 'AAHA 2024 guideline; limited veterinary evidence for some neurologic indications.' },
    sources: [{ label: 'AAHA · paciente enfermo y sodio', url: FLUID_SOURCES.illness }],
  },
  {
    id: 'colloids', tone: 'violet', title: { es: 'Coloides sintéticos', en: 'Synthetic colloids' },
    examples: { es: 'Hidroxietilalmidón · gelatinas · dextranos', en: 'Hydroxyethyl starch · gelatins · dextrans' },
    purpose: { es: 'Soporte oncótico seleccionado', en: 'Selected oncotic support' },
    uses: { es: 'Perros y gatos: solo tras valorar beneficio/riesgo y alternativas. No son una elección rutinaria cuando el paciente responde a cristaloides.', en: 'Dogs and cats: only after assessing benefits, risks, and alternatives. Not a routine choice when the patient responds to crystalloids.' },
    precautions: { es: 'Uso controvertido; no sustituyen la albúmina. Evitar o extremar precaución con azotemia previa, coagulopatía, anemia o trombocitopenia. Minimizar dosis y duración según protocolo.', en: 'Controversial use; they do not replace albumin. Avoid or exercise particular caution with pre-existing azotemia, coagulopathy, anemia, or thrombocytopenia. Minimize dose and duration according to protocol.' },
    monitor: { es: 'Función renal, coagulación, hematocrito, plaquetas y respuesta hemodinámica.', en: 'Kidney function, coagulation, hematocrit, platelets, and hemodynamic response.' },
    evidence: { es: 'AAHA 2024: evidencia limitada y sin consenso sobre el uso óptimo.', en: 'AAHA 2024: limited evidence and no consensus on optimal use.' },
    sources: [{ label: 'AAHA · controversias sobre coloides', url: FLUID_SOURCES.colloids }],
  },
  {
    id: 'blood', tone: 'red', title: { es: 'Hemoderivados y albúmina', en: 'Blood products and albumin' },
    examples: { es: 'Concentrado eritrocitario · plasma · albúmina específica', en: 'Packed red cells · plasma · species-specific albumin' },
    purpose: { es: 'Componente deficitario', en: 'Deficient component' },
    uses: { es: 'Perros y gatos: escoger por objetivo, como transporte de oxígeno en hemorragia/anemia o soporte de componentes plasmáticos. Son protocolos transfusionales, no fluidos de mantenimiento.', en: 'Dogs and cats: select by goal, such as oxygen delivery in hemorrhage/anemia or support of plasma components. These are transfusion protocols, not maintenance fluids.' },
    precautions: { es: 'Confirmar compatibilidad, indicación y vigilancia transfusional. La albúmina humana puede causar reacciones; plasma para elevar albúmina es poco eficiente y puede provocar sobrecarga.', en: 'Confirm compatibility, indication, and transfusion monitoring. Human albumin may cause reactions; plasma is inefficient for raising albumin and can cause overload.' },
    monitor: { es: 'Reacciones, temperatura, perfusión, hematocrito/proteínas y respiración.', en: 'Reactions, temperature, perfusion, hematocrit/proteins, and respiration.' },
    evidence: { es: 'AAHA 2024: selección por componente e indicación; eficacia variable para hipoalbuminemia.', en: 'AAHA 2024: selection by component and indication; variable efficacy for hypoalbuminemia.' },
    sources: [{ label: 'AAHA · anemia e hipoalbuminemia', url: FLUID_SOURCES.illness }],
  },
  {
    id: 'routes', tone: 'teal', title: { es: 'Agua enteral y fluidos subcutáneos', en: 'Enteral water and subcutaneous fluids' },
    examples: { es: 'Vía oral / sonda · cristaloide balanceado SC', en: 'Oral / feeding tube · balanced crystalloid SC' },
    purpose: { es: 'Paciente estable', en: 'Stable patient' },
    uses: { es: 'Perros y gatos con perfusión adecuada: priorizar agua enteral si la toleran. Vía SC para pacientes seleccionados y estables con necesidad real de hidratación.', en: 'Dogs and cats with adequate perfusion: prioritize enteral water when tolerated. SC therapy for selected stable patients with a genuine hydration requirement.' },
    precautions: { es: 'La hipovolemia requiere IV/IO. No dar SC por rutina a un paciente euhidratado; cautela con cardiopatía e hipoproteinemia. No usar soluciones hipertónicas por vía SC.', en: 'Hypovolemia requires IV/IO. Do not routinely give SC fluids to euhydrated patients; caution with heart disease and hypoproteinemia. Do not use hypertonic solutions SC.' },
    monitor: { es: 'Tolerancia, ingesta, hidratación, peso y perfusión.', en: 'Tolerance, intake, hydration, weight, and perfusion.' },
    evidence: { es: 'Guía AAHA 2024. Las recomendaciones SC son empíricas; evidencia limitada sobre selección y frecuencia óptimas.', en: 'AAHA 2024 guideline. SC recommendations are empirical; limited evidence on optimal selection and frequency.' },
    sources: [{ label: 'AAHA · selección de vías', url: FLUID_SOURCES.replacement }],
  },
];
