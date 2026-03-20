import fs from 'fs';

const sitemapSources = [
  {
    brandName: 'Royal Canin',
    path: '/tmp/royalcanin_es_products.xml',
    filter: (url) => /royalcanin\.com\/es\/(dogs|cats)\/products\/vet-products\//.test(url),
    exclude: (url) => /(treats|pill-assist|adult-|adult$|neutered|mature-consult)/i.test(url),
  },
  {
    brandName: "Hill's Prescription Diet",
    path: '/tmp/hills_es_sitemap.xml',
    filter: (url) => /hillspet\.es\/(dog|cat)-food\/prescription-diet-/.test(url),
    exclude: (url) => false,
  },
  {
    brandName: 'Purina Pro Plan Veterinary Diets',
    path: '/tmp/purina_es_sitemap.xml',
    filter: (url) => /purina\.es\/(perros|gatos)\/comida-(perros|gatos)\/.*pro-plan-veterinary-diets/.test(url),
    exclude: (url) => /(fortiflora)/i.test(url),
  },
  {
    brandName: 'SPECIFIC',
    path: '/tmp/specific_es_sitemap.xml',
    filter: (url) => /specific-diets\.es\/(perro|gato)\/alimento-para-necesidades-especiales\//.test(url),
    exclude: (url) => false,
  },
  {
    brandName: 'Virbac Veterinary HPM',
    path: '/tmp/virbac_es_sitemap.xml',
    filter: (url) =>
      /es\.virbac\.com\/productos\//.test(url) &&
      /(support|control|hypoallergy|kidney|digestive|weight-loss|weight-loss-control|diabetes|dermatology|renal|urolog|movilidad|articulaciones|intolerancia|piel|pelo)/i.test(
        url,
      ),
    exclude: (url) => false,
  },
];

const getSpecies = (url) => {
  if (/(\/dogs\/|dog-food|\/perros\/|\/perro\/)/.test(url)) return ['Dog'];
  if (/(\/cats\/|cat-food|\/gatos\/|\/gato\/)/.test(url)) return ['Cat'];
  return ['Dog', 'Cat'];
};

const getFormat = (slug) => {
  if (/(canned|pouch|mousse|stew|loaf|sobres|humeda|humedo|wet|liquid|lata)/.test(slug)) return 'wet';
  return 'dry';
};

const titleCase = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^(a1|a2|k1|kj1|kj2|kj3|g1|w1|fcd|fcw|fdd|fed|few|fid|fiw|fjd|fjw|fkd|fkw|fod|frd|frw|fsw|ccd|cdd|cdw|ced|cid|cjd|ckd|crd|csd|ct-hy|ad|cd|dd|id|jd|kd|ld|md|onc|rd|sd|ud|wd|yd|zd|so|uc)$/i.test(word)) {
        return word.toUpperCase();
      }
      if (word === '&') return '&';
      if (word === '+') return '+';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

const humanizeSlug = (url) => {
  const decoded = decodeURIComponent(url.split('/').pop() ?? '')
    .replace(/\/"?>?$/, '')
    .replace(/-\d+$/, '')
    .replace(/--+/g, '-')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCase(decoded);
};

const inferConditions = (slug) => {
  const normalized = slug.toLowerCase();
  const conditions = new Set();

  if (/(renal|kidney|kd|k1|kj1|kj2|kj3)/.test(normalized)) conditions.add('Chronic kidney disease');
  if (/(urinary|struvite|crystal|bladder|multicare|so|uc|sd|cd)/.test(normalized)) conditions.add('Lower urinary tract disease');
  if (/(gastro|digestive|biome|id|low-fat|low fat|fibre|fiber|pancrea)/.test(normalized)) conditions.add('Gastrointestinal disease');
  if (/(hypoallergenic|anallergenic|allergen|allergy|hypoallergy|food sensitivities|zd|dd)/.test(normalized))
    conditions.add('Adverse food reaction');
  if (/(diabetic|diabetes|glyco|glucose|endocrine|md|dm)/.test(normalized)) conditions.add('Diabetes mellitus');
  if (/(hepatic|liver|ld)/.test(normalized)) conditions.add('Hepatic disease');
  if (/(weight|satiety|metabolic|obesity|reduction|control|wd|rd)/.test(normalized)) conditions.add('Obesity');
  if (/(joint|mobility|jd|articulaciones|movilidad)/.test(normalized)) conditions.add('Osteoarthritis');
  if (/(cardiac)/.test(normalized)) conditions.add('Cardiac disease');
  if (/(skin|coat|dermat|pyoder|fod)/.test(normalized)) conditions.add('Dermatologic disease');
  if (/(thyroid|yd)/.test(normalized)) conditions.add('Hyperthyroidism');
  if (/(recovery|convalescence|urgent-care|urgent care|onc|on-care|on care|liquid)/.test(normalized)) conditions.add('Critical care');

  if (conditions.size === 0) conditions.add('General therapeutic support');
  return Array.from(conditions);
};

const buildDescription = (brandName, dietName, healthConditions) => ({
  es: `Dieta oficial de ${brandName} Espana orientada a ${healthConditions.join(', ').toLowerCase()}.`,
  en: `Official ${brandName} Spain diet oriented to ${healthConditions.join(', ').toLowerCase()}.`,
});

const buildIndications = (healthConditions) => ({
  es: `Indicada como apoyo nutricional en ${healthConditions.join(', ')}. Revisar la ficha oficial de la marca para su uso exacto.`,
  en: `Intended as nutritional support in ${healthConditions.join(', ')}. Review the official brand sheet for exact use.`,
});

const xmlLocs = (content) => [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());

const entries = [];
const seen = new Set();

for (const source of sitemapSources) {
  const xml = fs.readFileSync(source.path, 'utf8');
  const urls = xmlLocs(xml).filter((url) => source.filter(url) && !(source.exclude?.(url) ?? false));

  for (const url of urls) {
    const cleanUrl = url.replace(/"\/?>?$/, '');
    if (seen.has(cleanUrl)) continue;
    seen.add(cleanUrl);

    const slug = decodeURIComponent(cleanUrl.split('/').pop() ?? '').replace(/-\d+$/, '');
    const dietName = humanizeSlug(cleanUrl);
    const healthConditions = inferConditions(slug);

    const speciesKey = getSpecies(cleanUrl)
      .join('-')
      .toLowerCase();

    entries.push({
      id: `official-${source.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${speciesKey}-${slug.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
      brandName: source.brandName,
      dietName,
      sourceUrl: cleanUrl,
      species: getSpecies(cleanUrl),
      healthConditions,
      format: getFormat(slug),
      shortDescription: buildDescription(source.brandName, dietName, healthConditions),
      composition: {
        es: 'Consultar composicion analitica y materias primas en la ficha oficial del producto.',
        en: 'Consult the official product sheet for analytical composition and ingredients.',
      },
      indications: buildIndications(healthConditions),
      technicalSheet: {
        es: 'Producto detectado en el sitemap oficial de la marca en Espana. Abrir el enlace oficial para composicion, indicaciones, formatos y tabla de dosificacion.',
        en: 'Product detected in the brand official Spain sitemap. Open the official link for composition, indications, formats, and feeding guide.',
      },
      nutrientProfile: {},
      presentations: [],
      feedingGuide: [],
    });
  }
}

entries.sort((left, right) => {
  const brandCompare = left.brandName.localeCompare(right.brandName);
  if (brandCompare !== 0) return brandCompare;
  return left.dietName.localeCompare(right.dietName);
});

const output = `import { ClinicalDietRecord } from '../types';

export const officialClinicalDietData: ClinicalDietRecord[] = ${JSON.stringify(entries, null, 2)} as ClinicalDietRecord[];
`;

fs.writeFileSync('src/data/officialClinicalDiets.ts', output);
console.log(`generated_entries=${entries.length}`);
