// Clinical recording, not automated diagnosis. Nomenclature: https://avdc.org/avdc-nomenclature/
// Legacy import provenance: A_Marosa_Dental_v4.zip, supplied by the user, 2026-10-29.
export type DentalSpecies = "dog" | "cat";
export type DentalLang = "es" | "en";
export const MARKS = {
  ausente: ["Ausente", "Missing", "#718096", "f"],
  fractura: ["Fractura", "Fracture", "#e0526d", "f"],
  periodontal: ["Enf. periodontal", "Periodontal disease", "#c47b14", "f"],
  calculo: ["Cálculo", "Calculus", "#947438", "f"],
  gingivitis: ["Gingivitis", "Gingivitis", "#cd5394", "f"],
  reabsorcion: ["Reabsorción", "Resorption", "#925bc0", "f"],
  decidua: [
    "Decidua persistente",
    "Persistent deciduous tooth",
    "#168d9c",
    "f",
  ],
  malposicion: ["Malposición", "Malposition", "#5068b9", "f"],
  desgaste: ["Desgaste", "Wear", "#947966", "f"],
  raiz: ["Raíz retenida", "Retained root", "#71513c", "f"],
  lesion: ["Otra lesión", "Other lesion", "#287cb2", "f"],
  extraccion: ["Exodoncia", "Extraction", "#394852", "t"],
  endodoncia: ["Endodoncia", "Endodontics", "#10867a", "t"],
  restauracion: ["Restauración", "Restoration", "#488749", "t"],
  tratamiento: ["Otro tratamiento", "Other treatment", "#867d24", "t"],
} as const;
export type DentalMark = keyof typeof MARKS;
export const SITES = ["MB", "B", "DB", "ML", "L", "DL"] as const;
export type DentalSite = (typeof SITES)[number];
export interface DentalTooth {
  findings: DentalMark[];
  treatments: DentalMark[];
  pd: string;
  mobility: string;
  furca: string;
  depth: string;
  recesion: string;
  fx: string;
  tr: string;
  trtipo: string;
  color: string;
  notes: string;
  probing: string;
  sites: Record<DentalSite, string>;
}
export interface DentalRecord {
  id: string;
  species: DentalSpecies;
  fields: Record<string, string | boolean>;
  teeth: Record<string, DentalTooth>;
  updated: number;
}
export interface DentalStore {
  records: DentalRecord[];
  currentId: string;
}
export const emptyTooth = (): DentalTooth => ({
  findings: [],
  treatments: [],
  pd: "",
  mobility: "",
  furca: "",
  depth: "",
  recesion: "",
  fx: "",
  tr: "",
  trtipo: "",
  color: "",
  notes: "",
  probing: "",
  sites: { MB: "", B: "", DB: "", ML: "", L: "", DL: "" },
});
export function toothIds(species: DentalSpecies, quad?: number): number[] {
  return (quad ? [quad] : [1, 2, 3, 4]).flatMap((q) =>
    (species === "dog"
      ? Array.from({ length: q < 3 ? 10 : 11 }, (_, i) => i + 1)
      : q < 3
        ? [1, 2, 3, 4, 6, 7, 8, 9]
        : [1, 2, 3, 4, 7, 8, 9]
    ).map((n) => q * 100 + n),
  );
}
export function newRecord(species: DentalSpecies = "dog"): DentalRecord {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return {
    id: crypto.randomUUID(),
    species,
    fields: { fecha: local },
    teeth: {},
    updated: Date.now(),
  };
}
export const markLabel = (mark: DentalMark, lang: DentalLang) =>
  MARKS[mark][lang === "es" ? 0 : 1];
export function meaningful(t: DentalTooth): boolean {
  return (
    t.findings.length + t.treatments.length > 0 ||
    Object.entries(t).some(([k, v]) =>
      k === "sites"
        ? Object.values(v).some(Boolean)
        : !["findings", "treatments"].includes(k) && String(v).trim() !== "",
    )
  );
}
export function unavailable(t: DentalTooth): boolean {
  return t.findings.includes("ausente") || t.treatments.includes("extraccion");
}
export function setPeriodontal(t: DentalTooth, pd: string): DentalTooth {
  // Stage is authoritative for these two marks; changing stage removes stale automatic findings.
  const findings: DentalMark[] = t.findings.filter(
    (k) => k !== "gingivitis" && k !== "periodontal",
  );
  if (pd === "1") findings.push("gingivitis");
  else if (["2", "3", "4"].includes(pd)) findings.push("periodontal");
  return { ...t, pd, findings };
}
export function toggleMark(
  t: DentalTooth,
  mark: DentalMark,
  add?: boolean,
): DentalTooth {
  const field = MARKS[mark][3] === "f" ? "findings" : "treatments";
  const shouldAdd = add ?? !t[field].includes(mark);
  let next = {
    ...t,
    [field]: shouldAdd
      ? [...new Set([...t[field], mark])]
      : t[field].filter((k) => k !== mark),
    color: "",
  };
  if (mark === "fractura" && !shouldAdd) next.fx = "";
  if (mark === "reabsorcion" && !shouldAdd) {
    next.tr = "";
    next.trtipo = "";
  }
  // A manual finding never assigns a disease stage without the clinician's assessment.
  if (["gingivitis", "periodontal"].includes(mark) && t.pd !== "") next.pd = "";
  return next;
}
export function revisionOf(r: DentalRecord): DentalRecord {
  const next = newRecord(r.species);
  for (const key of [
    "paciente",
    "historia",
    "tutor",
    "telefono",
    "raza",
    "sexo",
    "edad",
    "peso",
    "veterinario",
    "clinica",
  ])
    if (r.fields[key] !== undefined) next.fields[key] = r.fields[key];
  for (const [id, t] of Object.entries(r.teeth)) {
    const tooth = unavailable(t)
      ? { ...emptyTooth(), findings: ["ausente"] as DentalMark[] }
      : { ...structuredClone(t), treatments: [], notes: "" };
    if (meaningful(tooth)) next.teeth[id] = tooth;
  }
  return next;
}
const obj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const fail = (): never => {
  throw Error("invalid-dental-file");
};
function text(v: unknown, max = 12000): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string" || v.length > max) return fail();
  return v;
}
function mm(v: unknown): string {
  const n = text(
    typeof v === "number" && Number.isFinite(v) ? String(v) : v,
    16,
  );
  if (n !== "" && (!/^\d+(\.\d+)?$/.test(n) || +n > 30)) return fail();
  return n;
}
function option(v: unknown, values: string[]): string {
  const s = text(
    typeof v === "number" && Number.isFinite(v) ? String(v) : v,
    40,
  );
  if (s && !values.includes(s)) return fail();
  return s;
}
function marks(v: unknown, group: "f" | "t"): DentalMark[] {
  if (v === undefined) return [];
  if (
    !Array.isArray(v) ||
    v.some(
      (k) =>
        typeof k !== "string" ||
        !Object.prototype.hasOwnProperty.call(MARKS, k) ||
        MARKS[k as DentalMark][3] !== group,
    )
  )
    return fail();
  return [...new Set(v)] as DentalMark[];
}
export function validateRecord(raw: unknown): DentalRecord {
  if (
    !obj(raw) ||
    !["dog", "cat"].includes(String(raw.species)) ||
    !obj(raw.fields) ||
    !obj(raw.teeth)
  )
    return fail();
  const species = raw.species as DentalSpecies;
  const fields: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(raw.fields)) {
    if (
      !/^[a-z][a-z0-9_]{0,63}$/i.test(key) ||
      ["constructor", "prototype", "__proto__"].includes(key) ||
      !(
        typeof value === "boolean" ||
        (typeof value === "string" && value.length <= 20000)
      )
    )
      return fail();
    fields[key] = value;
  }
  const teeth: Record<string, DentalTooth> = {};
  const ids = toothIds(species).map(String);
  for (const [id, value] of Object.entries(raw.teeth)) {
    if (!ids.includes(id) || !obj(value)) return fail();
    // Legacy v1 used a single status instead of arrays.
    const legacy =
      value.status === "enfermedad-periodontal"
        ? "periodontal"
        : value.status === "otro"
          ? "lesion"
          : value.status;
    const findings =
      value.findings ??
      (typeof legacy === "string" &&
      Object.prototype.hasOwnProperty.call(MARKS, legacy) &&
      MARKS[legacy as DentalMark][3] === "f"
        ? [legacy]
        : []);
    const treatments =
      value.treatments ??
      (typeof legacy === "string" &&
      Object.prototype.hasOwnProperty.call(MARKS, legacy) &&
      MARKS[legacy as DentalMark][3] === "t"
        ? [legacy]
        : []);
    let t = {
      ...emptyTooth(),
      findings: marks(findings, "f"),
      treatments: marks(treatments, "t"),
    };
    for (const key of ["notes", "probing"] as const) t[key] = text(value[key]);
    t.color = text(value.color, 7);
    if (t.color && !/^#[0-9a-f]{6}$/i.test(t.color)) return fail();
    t.depth = mm(value.depth);
    t.recesion = mm(value.recesion);
    t.pd = option(value.pd, ["0", "1", "2", "3", "4"]);
    t.mobility = option(value.mobility, ["0", "1", "2", "3"]);
    t.furca = option(value.furca, ["1", "2", "3"]);
    t.fx = option(value.fx, ["EI", "EF", "UCF", "CCF", "UCRF", "CCRF", "RF"]);
    t.tr = option(value.tr, ["1", "2", "3", "4", "4a", "4b", "4c", "5"]);
    t.trtipo = option(value.trtipo, ["1", "2", "3"]);
    if (value.sites !== undefined && !obj(value.sites)) return fail();
    for (const site of SITES)
      t.sites[site] = mm(obj(value.sites) ? value.sites[site] : undefined);
    if (t.pd !== "") t = setPeriodontal(t, t.pd);
    if (meaningful(t)) teeth[id] = t;
  }
  const id = text(raw.id, 120) || crypto.randomUUID();
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return fail();
  const updated = raw.updated === undefined ? Date.now() : raw.updated;
  if (typeof updated !== "number" || !Number.isFinite(updated) || updated < 0)
    return fail();
  return { id, species, fields, teeth, updated };
}
export function parseImport(raw: unknown): {
  records: DentalRecord[];
  single: boolean;
} {
  if (!obj(raw)) return fail();
  if (obj(raw.campos) && (obj(raw.dientes) || obj(raw.odontograma))) {
    const migrated = newRecord("dog");
    migrated.fields = { ...raw.campos } as DentalRecord["fields"];
    for (const [from, to] of [
      ["historial", "historia"],
      ["farmacos", "medicacion"],
      ["recomendaciones", "plan"],
    ])
      if (migrated.fields[from] && !migrated.fields[to])
        migrated.fields[to] = migrated.fields[from];
    for (const [id, value] of Object.entries(
      (raw.dientes ?? raw.odontograma) as Record<string, unknown>,
    )) {
      const legacy =
        typeof value === "string"
          ? { status: value, notes: raw.campos["obs_" + id] }
          : value;
      if (!obj(legacy)) return fail();
      const status =
        legacy.status === "enfermedad-periodontal"
          ? "periodontal"
          : legacy.status === "otro"
            ? "lesion"
            : legacy.status;
      const tooth = emptyTooth();
      if (
        typeof status === "string" &&
        Object.prototype.hasOwnProperty.call(MARKS, status)
      )
        tooth[
          MARKS[status as DentalMark][3] === "f" ? "findings" : "treatments"
        ] = [status as DentalMark];
      else if (
        !["normal", "personalizado", "movilidad"].includes(String(status))
      )
        return fail();
      if (status === "personalizado") tooth.color = text(legacy.color, 7);
      tooth.notes = text(legacy.notes);
      tooth.probing = text(legacy.bolsa);
      if (status === "movilidad")
        tooth.notes +=
          (tooth.notes ? " · " : "") +
          "Movilidad registrada; grado sin indicar. / Mobility recorded; grade unspecified.";
      migrated.teeth[id] = tooth;
    }
    return { records: [validateRecord(migrated)], single: true };
  }
  if (
    raw.app !== undefined &&
    !["marosa-dental", "wairua-dental"].includes(String(raw.app))
  )
    return fail();
  if (
    raw.version !== undefined &&
    (!Number.isInteger(raw.version) ||
      Number(raw.version) < 1 ||
      Number(raw.version) > 5)
  )
    return fail();
  if (Array.isArray(raw.records)) {
    if (raw.records.length > 2000) return fail();
    const records = raw.records.map(validateRecord);
    if (new Set(records.map((r) => r.id)).size !== records.length)
      return fail();
    return { records, single: false };
  }
  return { records: [validateRecord(raw.record ?? raw)], single: true };
}
export function mergeRecords(
  existing: DentalRecord[],
  incoming: DentalRecord[],
): DentalRecord[] {
  const merged = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) {
    const old = merged.get(r.id);
    if (!old || old.updated < r.updated) merged.set(r.id, r);
  }
  return [...merged.values()];
}
export function maximumDepth(t: DentalTooth): string {
  const values = [t.depth, ...Object.values(t.sites)]
    .filter((v) => v !== "")
    .map(Number);
  return values.length ? String(Math.max(...values)) : "";
}
export const storageKey = (userId: string) => `wairua:dental:v1:user:${userId}`;
