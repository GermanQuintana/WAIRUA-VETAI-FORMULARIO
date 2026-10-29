import {
  DentalLang,
  DentalRecord,
  MARKS,
  markLabel,
  maximumDepth,
  SITES,
} from "./model";
export type Field = {
  key: string;
  es: string;
  en: string;
  type?: "text" | "date" | "time" | "number" | "textarea" | "checkbox";
  options?: readonly (readonly [string, string, string])[];
};
export const patientFields: Field[] = [
  { key: "paciente", es: "Paciente", en: "Patient" },
  { key: "historia", es: "N.º de historia", en: "Record number" },
  { key: "fecha", es: "Fecha", en: "Date", type: "date" },
  { key: "raza", es: "Raza", en: "Breed" },
  {
    key: "sexo",
    es: "Sexo",
    en: "Sex",
    options: [
      ["Macho", "Macho", "Male"],
      ["Macho castrado", "Macho castrado", "Neutered male"],
      ["Hembra", "Hembra", "Female"],
      ["Hembra esterilizada", "Hembra esterilizada", "Spayed female"],
    ],
  },
  { key: "edad", es: "Edad", en: "Age" },
  { key: "peso", es: "Peso (kg)", en: "Weight (kg)", type: "number" },
  { key: "tutor", es: "Tutor/a", en: "Owner" },
  { key: "telefono", es: "Teléfono", en: "Phone" },
  { key: "veterinario", es: "Veterinario/a", en: "Veterinarian" },
  { key: "clinica", es: "Clínica", en: "Clinic" },
];
const indices = (key: string, es: string, en: string): Field => ({
  key,
  es,
  en,
  options: [
    ["0", "0 · Ausente", "0 · Absent"],
    ["1", "1 · Leve", "1 · Mild"],
    ["2", "2 · Moderado", "2 · Moderate"],
    ["3", "3 · Abundante/grave", "3 · Marked/severe"],
  ],
});
export const clinicalFields: Field[] = [
  indices("ig_placa", "Placa", "Plaque"),
  indices("ig_calculo", "Cálculo", "Calculus"),
  indices("ig_gingival", "Gingivitis", "Gingivitis"),
  {
    key: "pd_global",
    es: "Estadio periodontal global (registro manual)",
    en: "Overall periodontal stage (manual entry)",
    options: ["0", "1", "2", "3", "4"].map((v) => [v, "PD" + v, "PD" + v]),
  },
  {
    key: "oclusion",
    es: "Oclusión",
    en: "Occlusion",
    options: [
      ["Normal", "Normal", "Normal"],
      ["MAL1", "MAL1 · Clase 1", "MAL1 · Class 1"],
      ["MAL2", "MAL2 · Clase 2", "MAL2 · Class 2"],
      ["MAL3", "MAL3 · Clase 3", "MAL3 · Class 3"],
      ["MAL4", "MAL4 · Asimetría", "MAL4 · Asymmetry"],
    ],
  },
  ...[
    ["motivo", "Motivo y antecedentes", "Reason and history"],
    ["diagnostico", "Exploración y diagnóstico", "Examination and diagnosis"],
    ["medicacion", "Procedimientos y medicación", "Procedures and medication"],
    ["plan", "Cuidados y seguimiento", "Aftercare and follow-up"],
    ["indices", "Notas de índices y oclusión", "Index and occlusion notes"],
    ["mucosa", "Mucosa, paladar y lengua", "Mucosa, palate and tongue"],
    [
      "radiografias",
      "Radiografías: hallazgos y referencias",
      "Radiographs: findings and references",
    ],
    ["observaciones", "Otras observaciones", "Other observations"],
  ].map(([key, es, en]): Field => ({ key, es, en, type: "textarea" })),
];
export const procedures: Field[] = [
  ["detartraje", "Detartraje ultrasónico", "Ultrasonic scaling"],
  ["pulido", "Pulido dental", "Polishing"],
  ["curetaje", "Curetaje / alisado radicular", "Curettage / root planing"],
  ["extraccion_simple", "Exodoncia simple", "Simple extraction"],
  ["extraccion_quirurgica", "Exodoncia quirúrgica", "Surgical extraction"],
  ["gingivectomia", "Gingivectomía / colgajo", "Gingivectomy / flap"],
  ["bloqueo", "Bloqueo local", "Local block"],
  ["radiografia", "Radiografías intraorales", "Intraoral radiographs"],
  ["sutura", "Sutura", "Suturing"],
  ["endodoncia", "Endodoncia / restauración", "Endodontics / restoration"],
  ["biopsia", "Biopsia / exéresis", "Biopsy / excision"],
  ["otros", "Otros procedimientos", "Other procedures"],
].map(([key, es, en]) => ({ key, es, en, type: "checkbox" }));
export const anesthesiaFields: Field[] = [
  {
    key: "asa",
    es: "Riesgo ASA",
    en: "ASA status",
    options: ["I", "II", "III", "IV", "V"].map((v) => [v, v, v]),
  },
  { key: "hora_inicio", es: "Hora de inicio", en: "Start time", type: "time" },
  { key: "hora_fin", es: "Hora de fin", en: "End time", type: "time" },
  { key: "tubo", es: "Tubo endotraqueal", en: "Endotracheal tube" },
  ...[
    ["premedicacion", "Premedicación", "Premedication"],
    ["induccion", "Inducción", "Induction"],
    ["mantenimiento", "Mantenimiento", "Maintenance"],
    ["monitorizacion", "Monitorización", "Monitoring"],
    [
      "complicaciones",
      "Incidencias y recuperación",
      "Complications and recovery",
    ],
  ].map(([key, es, en]): Field => ({ key, es, en, type: "textarea" })),
  {
    key: "firma",
    es: "Identificación del veterinario (texto)",
    en: "Veterinarian identification (text)",
  },
  { key: "revision", es: "Fecha de revisión", en: "Review date", type: "date" },
];
export const blocks: Field[] = [
  ["bl_infraorbitario", "Infraorbitario", "Infraorbital"],
  ["bl_maxilar", "Maxilar caudal", "Caudal maxillary"],
  ["bl_mentoniano", "Mentoniano", "Mental"],
  ["bl_alveolar", "Alveolar inferior", "Inferior alveolar"],
].map(([key, es, en]) => ({ key, es, en, type: "checkbox" }));
export const fractureOptions = [
  ["EI", "Infracción del esmalte", "Enamel infraction"],
  ["EF", "Fractura del esmalte", "Enamel fracture"],
  ["UCF", "Corona no complicada", "Uncomplicated crown fracture"],
  ["CCF", "Corona complicada", "Complicated crown fracture"],
  ["UCRF", "Corona-raíz no complicada", "Uncomplicated crown-root fracture"],
  ["CCRF", "Corona-raíz complicada", "Complicated crown-root fracture"],
  ["RF", "Fractura radicular", "Root fracture"],
] as const;
export const views = {
  all: ["Multivista", "All views"],
  occlusal: ["Oclusal", "Occlusal"],
  right: ["Vestibular derecha", "Right buccal"],
  left: ["Vestibular izquierda", "Left buccal"],
  rostral: ["Rostral", "Rostral"],
  perio: ["Periodontograma", "Periodontal chart"],
} as const;
export function reportText(r: DentalRecord, lang: DentalLang): string {
  const es = lang === "es";
  const lines = ["WAIRUA VetAI · " + (es ? "Ficha dental" : "Dental chart")];
  const section = (title: string, fields: Field[]) => {
    const values = fields.filter(
      (f) =>
        r.fields[f.key] !== undefined &&
        r.fields[f.key] !== "" &&
        r.fields[f.key] !== false,
    );
    if (values.length) {
      lines.push("", title);
      for (const f of values) {
        const v = r.fields[f.key];
        const option = f.options?.find((o) => o[0] === v);
        lines.push(
          `${f[lang]}: ${v === true ? (es ? "Sí" : "Yes") : option ? option[es ? 1 : 2] : v}`,
        );
      }
    }
  };
  section(es ? "PACIENTE" : "PATIENT", patientFields);
  lines.push(
    (es ? "Especie: " : "Species: ") +
      (r.species === "dog" ? (es ? "Perro" : "Dog") : es ? "Gato" : "Cat"),
  );
  lines.push("", es ? "REGISTRO POR PIEZA" : "TOOTH RECORDS");
  for (const [id, t] of Object.entries(r.teeth).sort(([a], [b]) => +a - +b)) {
    const row: string[] = [...t.findings, ...t.treatments].map((k) =>
      markLabel(k, lang),
    );
    for (const [label, v] of [
      ["PD", t.pd],
      ["M", t.mobility],
      ["F", t.furca],
      ["FX ", t.fx],
      ["TR", t.tr],
      ["T", t.trtipo],
    ])
      if (v !== "") row.push(label + v);
    const depth = maximumDepth(t);
    if (depth !== "")
      row.push((es ? "Sondaje máx. " : "Max probing ") + depth + " mm");
    if (t.recesion !== "")
      row.push((es ? "Recesión " : "Recession ") + t.recesion + " mm");
    const sites = SITES.filter((s) => t.sites[s] !== "").map(
      (s) => s + ": " + t.sites[s],
    );
    if (sites.length) row.push(sites.join(" / ") + " mm");
    if (t.probing) row.push(t.probing);
    if (t.notes) row.push(t.notes);
    if (t.color) row.push((es ? "Color " : "Colour ") + t.color);
    lines.push(id + ": " + row.join(" · "));
  }
  if (!Object.keys(r.teeth).length)
    lines.push(es ? "Sin piezas registradas." : "No teeth recorded.");
  section(
    es ? "DIAGNÓSTICO Y SEGUIMIENTO" : "DIAGNOSIS AND FOLLOW-UP",
    clinicalFields,
  );
  section(es ? "PROCEDIMIENTOS" : "PROCEDURES", procedures);
  section(es ? "PARTE ANESTÉSICO" : "ANAESTHETIC RECORD", anesthesiaFields);
  section(es ? "BLOQUEOS" : "BLOCKS", blocks);
  lines.push(
    "",
    es
      ? "Dentición permanente. Esquemas orientativos. Nomenclatura: AVDC."
      : "Permanent dentition. Schematic illustrations. Nomenclature: AVDC.",
    "https://avdc.org/avdc-nomenclature/",
  );
  return lines.join("\n");
}
