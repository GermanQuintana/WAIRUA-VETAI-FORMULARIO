import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/dental/model.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const m = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
assert.equal(m.toothIds("dog").length, 42);
assert.equal(m.toothIds("cat").length, 30);
assert(!m.toothIds("cat").includes(305));
let tooth = m.setPeriodontal(m.emptyTooth(), "3");
assert(tooth.findings.includes("periodontal"));
tooth = m.setPeriodontal(tooth, "0");
assert.deepEqual(tooth.findings, []);
tooth = m.setPeriodontal(tooth, "1");
assert.deepEqual(tooth.findings, ["gingivitis"]);
tooth = m.setPeriodontal(tooth, "4");
assert.deepEqual(tooth.findings, ["periodontal"]);
assert.equal(
  m.toggleMark(m.emptyTooth(), "periodontal").pd,
  "",
  "A finding must not infer stage PD2",
);
const record = m.newRecord("dog");
record.fields.paciente = "Original";
record.teeth[108] = {
  ...m.emptyTooth(),
  findings: ["fractura"],
  fx: "CCF",
  sites: { MB: "3", B: "4", DB: "5", ML: "2", L: "3", DL: "2" },
};
assert.equal(m.maximumDepth(record.teeth[108]), "5");
assert.equal(m.toggleMark(record.teeth[108], "fractura", false).fx, "");
const fresh = structuredClone(record);
fresh.updated = record.updated + 1000;
fresh.fields.paciente = "Updated";
const restored = m.parseImport({
  app: "wairua-dental",
  version: 5,
  records: [fresh],
}).records;
const merged = m.mergeRecords([record], restored);
assert.equal(merged.find((r) => r.id === record.id).fields.paciente, "Updated");
assert.equal(merged[0].updated, fresh.updated);
assert.equal(m.mergeRecords([fresh], [record])[0].fields.paciente, "Updated");
const before = JSON.stringify([record]);
const bad = structuredClone(fresh);
bad.teeth[999] = m.emptyTooth();
assert.throws(() =>
  m.parseImport({ app: "wairua-dental", version: 5, records: [fresh, bad] }),
);
assert.equal(JSON.stringify([record]), before);
assert.throws(() =>
  m.parseImport({ app: "wairua-dental", version: 5, records: [fresh, fresh] }),
);
for (const [key, value] of [
  ["color", "url(javascript:1)"],
  ["pd", "9"],
  ["depth", "-1"],
  ["depth", "NaN"],
  ["fx", "bad"],
]) {
  const bad = structuredClone(record);
  bad.teeth[108][key] = value;
  assert.throws(() => m.validateRecord(bad));
}
const badSites = structuredClone(record);
badSites.teeth[108].sites.MB = "31";
assert.throws(() => m.validateRecord(badSites));
for (const version of [2, 3, 4])
  assert.equal(
    m.parseImport({ app: "marosa-dental", version, record }).records[0]
      .teeth[108].fx,
    "CCF",
  );
const legacy = m.parseImport({
  formato: "a-marosa-odontograma-canino",
  campos: {
    paciente: "Legacy",
    historial: "99",
    farmacos: "Text",
    pulido: true,
  },
  dientes: {
    108: {
      status: "personalizado",
      color: "#123abc",
      notes: "Note",
      bolsa: "3 V / 4 P",
    },
    404: "extraccion",
    409: "movilidad",
  },
}).records[0];
assert.equal(legacy.fields.historia, "99");
assert.equal(legacy.fields.medicacion, "Text");
assert.equal(legacy.fields.pulido, true);
assert.equal(legacy.teeth[108].color, "#123abc");
assert.equal(legacy.teeth[108].probing, "3 V / 4 P");
assert.deepEqual(legacy.teeth[404].treatments, ["extraccion"]);
assert.match(legacy.teeth[409].notes, /sin indicar/);
const review = m.revisionOf(legacy);
assert.notEqual(review.id, legacy.id);
assert.deepEqual(review.teeth[404].findings, ["ausente"]);
assert.deepEqual(review.teeth[404].treatments, []);
assert.equal(review.teeth[108].notes, "");
assert.notEqual(m.storageKey("user-a"), m.storageKey("user-b"));
assert.deepEqual(
  m.parseImport(
    JSON.parse(
      JSON.stringify({ app: "wairua-dental", version: 5, records: [record] }),
    ),
  ).records,
  [record],
);
console.log(
  "OK: dental stage transitions, complete backup restore, atomic validation, legacy v1–v4, six-site probing, review and account keys.",
);
