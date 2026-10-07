import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

// Check the badge rule against live CIMAVet list results. Registration numbers
// keep the cases stable if search ordering changes.
const cases = [
  { ingredient: 'lactulosa', registration: '4531 ESP', antibiotic: false },
  { ingredient: 'fitomenadiona', registration: '4048 ESP', antibiotic: false },
  { ingredient: 'furosemida', registration: '3143 ESP', antibiotic: false },
  { ingredient: 'pimobendan', registration: '4111 ESP', antibiotic: false },
  { ingredient: 'benazepril', registration: '4366 ESP', antibiotic: false },
  { ingredient: 'benazepril', registration: 'EU064 CP', antibiotic: false },
  { name: 'reconcile', registration: 'EU/2/08/080/001', antibiotic: false },
  { ingredient: 'meloxicam', registration: '4317 ESP', antibiotic: false },
  { ingredient: 'meloxicam', registration: 'EU/2/17/210/001', antibiotic: true },
  { ingredient: 'amoxicilina', registration: '4188 ESP', antibiotic: true },
];

const source = await readFile(new URL('../src/services/cimavet.ts', import.meta.url), 'utf8');
const transformed = await transformWithEsbuild(source, 'src/services/cimavet.ts');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`;
const { isCimavetAntibiotic } = await import(moduleUrl);

for (const testCase of cases) {
  const url = new URL('https://cimavet.aemps.es/cimavet/rest/medicamentos/');
  url.searchParams.set('tamanioPagina', '100');
  if (testCase.ingredient) url.searchParams.set('practiv1', testCase.ingredient);
  if (testCase.name) url.searchParams.set('nombre', testCase.name);

  let medication;
  for (let page = 1; ; page += 1) {
    url.searchParams.set('pagina', String(page));
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    assert.ok(response.ok, `CIMAVet request failed for ${testCase.ingredient ?? testCase.name}: ${response.status}`);

    const data = await response.json();
    medication = data.resultados?.find((item) => item.nregistro === testCase.registration);
    if (medication || page * (data.tamanioPagina ?? 100) >= (data.totalFilas ?? 0) || !data.resultados?.length) break;
  }
  assert.ok(medication, `Registration ${testCase.registration} missing from CIMAVet search results`);
  assert.equal(
    isCimavetAntibiotic(medication),
    testCase.antibiotic,
    `Incorrect antibiotic badge for ${medication.nombre} (${testCase.registration})`,
  );

  console.log(`${testCase.registration}: ${testCase.antibiotic ? 'Antibiótico' : 'Sin etiqueta de antibiótico'} ✓`);
}
