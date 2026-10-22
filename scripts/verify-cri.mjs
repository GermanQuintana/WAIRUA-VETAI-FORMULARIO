// Regression checks for the clinical unit conversions and final-volume preparation.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/criMath.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const {
  calculateCri,
  calculateCriForDuration,
  calculateLoadingFraction,
  propofolPreparationIssue,
  criMgKgHour,
} = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
// The same physical dose expressed using all four supported units.
for (const [dose, unit] of [
  [0.6, "mg/kg/h"],
  [600, "µg/kg/h"],
  [0.01, "mg/kg/min"],
  [10, "µg/kg/min"],
]) {
  close(criMgKgHour(dose, unit), 0.6);
  close(calculateCri(20, dose, unit, 10).pumpMlHour, 1.2);
}
close(calculateCri(20, 0.2, "mg/kg/min", 10).pumpMlHour, 24);
close(calculateCri(10, 1, "µg/kg/h", 0.5).pumpMlHour, 0.02);
const mix = calculateCri(10, 1, "µg/kg/h", 0.5, { finalMl: 50, pumpMlHour: 2 });
close(mix.drugMl, 0.5);
close(mix.diluentMl, 49.5);
close(mix.hours, 25);
close(mix.finalMgMl, 0.005);
// Independent reverse calculation: prepared mass divided by final volume and rate.
close(((((mix.drugMl * 0.5) / 50) * 2) / 10) * 1000, 1);
assert.equal(
  calculateCri(20, 1, "mg/kg/h", 0.1, { finalMl: 50, pumpMlHour: 1 }),
  null,
);
for (const value of [NaN, Infinity, 0, -1]) {
  assert.equal(calculateCri(value, 1, "mg/kg/h", 1), null);
  assert.equal(calculateCri(10, value, "mg/kg/h", 1), null);
  assert.equal(calculateCri(10, 1, "mg/kg/h", value), null);
  assert.equal(
    calculateCri(10, 1, "mg/kg/h", 1, { finalMl: value, pumpMlHour: 1 }),
    null,
  );
}
assert.equal(calculateCri(1e308, 1e308, "mg/kg/min", 1), null);
console.log(
  "CRI: unit equivalence, pump rates, mass balance, impossible dilution and invalid inputs passed.",
);

for (const finalMl of [100, 250, 500, 1000, 10000]) {
  const preparation = calculateCriForDuration(
    20,
    1,
    "mg/kg/h",
    100,
    finalMl,
    4,
  );
  close(preparation.drugMl, 0.8);
  close(preparation.diluentMl, finalMl - 0.8);
  close(preparation.pumpMlHour, finalMl / 4);
  close(
    (((preparation.drugMl * 100) / finalMl) * preparation.pumpMlHour) / 20,
    1,
  );
}
const prop = calculateCriForDuration(10, 0.2, "mg/kg/min", 10, 100, 4);
close(prop.drugMl, 48);
close(prop.diluentMl, 52);
close(prop.finalMgMl, 4.8);
assert.equal(propofolPreparationIssue(prop.finalMgMl, prop.hours), null);
assert.equal(propofolPreparationIssue(1.9, 4), "concentration");
assert.equal(propofolPreparationIssue(2, 6), null);
assert.equal(propofolPreparationIssue(2, 6.01), "duration");
assert.equal(propofolPreparationIssue(10, 12), null);
assert.equal(propofolPreparationIssue(10, 12.01), "duration");
const fraction = calculateLoadingFraction(20, 4, 200);
close(fraction.mg, 80);
close(fraction.stockMl, 0.4);
assert.equal(calculateLoadingFraction(-1, 4, 200), null);
assert.equal(calculateCriForDuration(20, 1, "mg/kg/h", 100, 100, 0), null);
assert.equal(calculateCriForDuration(20, 100, "mg/kg/h", 1, 100, 4), null);
console.log(
  "CRI planning: all bag sizes, reverse mass balance, product stability limits and phenobarbital fraction passed.",
);

const { calculateCriForConcentration } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
// Independently published syringe examples: 0.5 mg/mL stock, 1 and 5 µg/mL final.
for (const [finalMl, finalMgMl, expectedDrugMl] of [[20, .001, .04], [50, .001, .1], [100, .001, .2], [50, .005, .5]]) {
  const actual = calculateCriForConcentration(25, 1, 'µg/kg/h', .5, finalMl, finalMgMl);
  close(actual.drugMl, expectedDrugMl);
  close(actual.diluentMl + actual.drugMl, finalMl);
  close(actual.finalMgMl * actual.pumpMlHour / 25 * 1000, 1);
  close(actual.hours * actual.pumpMlHour, finalMl);
}
// The photo's feline example: 5 kg at 2 µg/kg/h, 2.5 µg/mL, 20 mL syringe.
const dexCat = calculateCriForConcentration(5, 2, 'µg/kg/h', .5, 20, .0025);
close(dexCat.drugMl, .1); close(dexCat.diluentMl, 19.9);
close(dexCat.pumpMlHour, 4); close(dexCat.hours, 5);
const midazolam = calculateCriForDuration(10, .3, 'mg/kg/h', 5, 50, 12);
close(midazolam.drugMl, 7.2); close(midazolam.diluentMl, 42.8);
close(midazolam.mgHour, 3); close(midazolam.pumpMlHour, 50/12);
assert.equal(calculateCriForConcentration(5, 1, 'mg/kg/h', 1, 20, 2), null);
for (const value of [0, -1, NaN, Infinity]) assert.equal(calculateCriForConcentration(5, 1, 'mg/kg/h', 1, 20, value), null);

const dataJs = ts.transpileModule(await readFile(new URL('../src/data/criProtocols.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const dataUrl = `data:text/javascript;base64,${Buffer.from(dataJs).toString('base64')}`;
const searchJs = ts.transpileModule(await readFile(new URL('../src/lib/criSearch.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText.replace('../data/criProtocols', dataUrl);
const { searchCriProtocols } = await import(`data:text/javascript;base64,${Buffer.from(searchJs).toString('base64')}`);
const { CRI_PROTOCOLS, CRI_PRESENTATIONS, criDrugsForSpecies } = await import(dataUrl);
assert.equal(CRI_PRESENTATIONS.dex[0].id, 'dex500');
assert.equal(CRI_PRESENTATIONS.dex[0].mgMl, .5);
assert.equal(CRI_PRESENTATIONS.ket[0].id, 'ket100');
assert.equal(CRI_PRESENTATIONS.ket[0].mgMl, 100);
for (const id of ['ket100','ketabel100','ketexx100','anesketin100','anaestamine100']) {
  const product=CRI_PRESENTATIONS.ket.find(x=>x.id===id);
  assert.equal(product.mgMl,100);
  assert.equal(product.vialMl,10);
  assert.ok(product.source.startsWith('https://cimavet.aemps.es/'));
}
assert.equal(CRI_PRESENTATIONS.ket.find(x=>x.id==='ket100').seizureRestriction,'contraindicated');
assert.equal(CRI_PRESENTATIONS.ket.find(x=>x.id==='ketabel100').seizureRestriction,'caution');
for (const query of ['propofol convulsiones', 'PROPOFOL convuls', 'seiz propofol', 'propofol epilepsia']) assert.deepEqual(searchCriProtocols(query).map(x=>x.id), ['propofol-status']);
assert.deepEqual(searchCriProtocols('propofol TIVA').map(x=>x.id), ['propofol']);
assert.deepEqual(searchCriProtocols('epilepsia midazolan').map(x=>x.id), ['midazolam-status']);
for (const brand of ['Ketamidor','Ketabel','Ketexx','Anesketin','Anaestamine']) {
  const matches=searchCriProtocols(`${brand} convuls`);
  assert.ok(matches.length>0);
  assert.ok(matches.every(x=>x.category==='status' && x.drugs.some(drug=>drug.id==='ket')));
}
assert.ok(searchCriProtocols('epilepsia').some(x=>x.id === 'phenobarbital-status'));
assert.equal(searchCriProtocols('propofol inexistente').length, 0);
assert.equal(new Set(CRI_PROTOCOLS.map(x=>x.id)).size, CRI_PROTOCOLS.length);
for (const protocol of CRI_PROTOCOLS) {
  assert.ok(protocol.sources.length > 0);
  for (const species of protocol.species) for (const drug of criDrugsForSpecies(protocol, species)) {
    assert.ok(drug.min > 0 && drug.max >= drug.min);
    assert.ok(criMgKgHour(drug.min, drug.unit) > 0);
  }
}
const dexProtocol = CRI_PROTOCOLS.find(x=>x.id==='dexmedetomidine-anesthesia');
close(criDrugsForSpecies(dexProtocol, 'dog')[0].max, 1);
close(criDrugsForSpecies(dexProtocol, 'cat')[0].max, 3);
assert.equal(CRI_PROTOCOLS.find(x=>x.id==='phenobarbital-status').administration, 'loading');
console.log('CRI: documented dilution examples, midazolam, concentration mode, bilingual multi-concept search and species ranges passed.');

const { calculateCriBag, criDoseAtPump } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const preparedPropofol = calculateCriBag(10, 100, 25, [{id:'propofol',dose:.2,unit:'mg/kg/min',stockMgMl:10}], false);
close(preparedPropofol.drugs[0].drugMl,48);
close(preparedPropofol.totalDiluentMl,52);
close(criDoseAtPump(10,preparedPropofol.drugs[0].finalMgMl,12.5,'mg/kg/min'),.1);
close(criDoseAtPump(10,preparedPropofol.drugs[0].finalMgMl,50,'mg/kg/min'),.4);
// A pump adjustment changes delivered dose and volume duration, never the prepared quantities.
close(100/12.5,8); close(100/50,2); close(preparedPropofol.drugs[0].drugMl,48);
const twoBags = calculateCriBag(20,100,10,[{id:'ket',dose:1,unit:'mg/kg/h',stockMgMl:100},{id:'dex',dose:3,unit:'µg/kg/h',stockMgMl:.5}],false);
close(twoBags.drugs[0].drugMl,2);close(twoBags.drugs[1].drugMl,1.2);
close(twoBags.totalDiluentMl,196.8);
close(criDoseAtPump(20,twoBags.drugs[1].finalMgMl,10,'µg/kg/h'),3);
assert.equal(calculateCriBag(10,100,1,[],false),null);
assert.equal(calculateCriBag(10,100,1,[{id:'x',dose:1,unit:'mg/kg/h',stockMgMl:1},{id:'x',dose:1,unit:'mg/kg/h',stockMgMl:1}],false),null);
assert.equal(calculateCriBag(10,100,10,[{id:'x',dose:6,unit:'mg/kg/h',stockMgMl:10},{id:'y',dose:6,unit:'mg/kg/h',stockMgMl:10}],true),null);
for (const invalid of [0,-1,NaN,Infinity]) assert.equal(criDoseAtPump(10,1,invalid,'mg/kg/h'),null);
const prepJs=ts.transpileModule(await readFile(new URL('../src/data/criPreparation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText.replace('./criProtocols',dataUrl);
const { criFluidStatus, CRI_PREPARATION_RULES, CRI_MIXTURE_NOTES }=await import(`data:text/javascript;base64,${Buffer.from(prepJs).toString('base64')}`);
assert.equal(criFluidStatus('lipuro10','saline',4.8),'documented');
assert.equal(criFluidStatus('lipuro10','ringer',4.8),'unsupported');
assert.equal(criFluidStatus('lipuro10','saline',1.9),'unsupported');
assert.equal(criFluidStatus('dex500','ringer',.0025),'documented');
assert.equal(criFluidStatus('dex500','glucose',.0025),'unsupported');
assert.equal(criFluidStatus('midazolam5','ringer',.12),'documented');
assert.equal(criFluidStatus('midazolam5','saline',.16),'unsupported');
assert.equal(criFluidStatus('ket50','saline',1),'documented');
assert.equal(criFluidStatus('ket50','saline',2),'documented');
assert.equal(criFluidStatus('ket50','saline',1.2),'unverified');
assert.equal(criFluidStatus('ket100','saline',1),'unverified');
assert.equal(criFluidStatus('ketabel100','saline',1),'unverified');
assert.equal(criFluidStatus('ketexx100','ringer',1),'unverified');
for (const id of ['anesketin100','anaestamine100']) {
  assert.equal(criFluidStatus(id,'saline',1),'documented');
  assert.equal(criFluidStatus(id,'ringer',1),'documented');
  assert.equal(criFluidStatus(id,'glucose',1),'unsupported');
  assert.equal(CRI_PREPARATION_RULES[id].maxHours,undefined);
}
assert.equal(criFluidStatus('custom','ringer',1),'unverified');
assert.equal(criFluidStatus('furo10','glucose',1),'unsupported');
assert.equal(CRI_PREPARATION_RULES.dex500.maxHours,6);
assert.ok(CRI_MIXTURE_NOTES['ket-dex'].text.es.includes('2 h'));
assert.ok(CRI_MIXTURE_NOTES['ket-dex'].text.es.includes('separadas'));
console.log('CRI bag workflow: stable recipe, inverse pump titration, separate bags, fluid/formulation limits and mixing evidence passed.');
