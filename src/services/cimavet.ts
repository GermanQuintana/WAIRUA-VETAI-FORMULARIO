import { TherapeuticEntry } from '../types';

interface CimavetNameItem {
  nombre: string;
}

interface CimavetSpeciesItem {
  id?: number;
  nombre: string;
}

interface CimavetAtcItem {
  codigo: string;
  nombre: string;
  nivel: number;
}

interface CimavetPrincipioActivo {
  nombre: string;
  cantidad?: string;
  unidad?: string;
}

interface CimavetPresentationItem {
  cn?: string;
  nombre: string;
  comerc?: boolean;
  psum?: boolean;
}

interface CimavetClinicalItem {
  nombre: string;
  especie?: CimavetSpeciesItem;
}

interface CimavetWithdrawalTissueItem {
  id?: number;
  nombre: string;
}

interface CimavetWithdrawalUnitItem {
  id?: number;
  nombre: string;
}

export interface CimavetWithdrawalTimeItem {
  especie?: CimavetSpeciesItem;
  tejido?: CimavetWithdrawalTissueItem;
  cantidad?: string;
  observaciones?: string;
  unidadTiempo?: CimavetWithdrawalUnitItem;
}

export interface CimavetMedicationSummary {
  nregistro: string;
  nombre: string;
  pactivos?: string;
  comerc?: boolean;
  receta?: boolean;
  antibiotico?: boolean;
  labtitular?: string;
  forma?: CimavetNameItem;
  administracion?: CimavetNameItem;
  formasFarmaceuticas?: CimavetNameItem[];
  viasAdministracion?: CimavetNameItem[];
  dispensacion?: CimavetNameItem;
}

export interface CimavetMedicationDetail extends CimavetMedicationSummary {
  especies?: CimavetSpeciesItem[];
  principiosActivos?: CimavetPrincipioActivo[];
  presentaciones?: CimavetPresentationItem[];
  indicaciones?: CimavetClinicalItem[];
  contraindicaciones?: CimavetClinicalItem[];
  atcs?: CimavetAtcItem[];
  dispensacion?: CimavetNameItem;
  administracion?: CimavetNameItem;
  labtitular?: string;
  tiemposEspera?: CimavetWithdrawalTimeItem[];
}

interface CimavetListResponse {
  totalFilas?: number;
  tamanioPagina?: number;
  resultados?: CimavetMedicationSummary[];
}

interface CimavetMedicationPage {
  total: number;
  pageSize: number;
  results: CimavetMedicationSummary[];
}

export interface CimavetConfig {
  baseUrl: string;
  apiKey?: string;
  pageSize?: number;
  parallelRequests?: number;
}

export interface CimavetSearchOptions {
  maxPages?: number;
  species?: string;
  includeActiveIngredientSearch?: boolean;
  preferExactActiveIngredient?: boolean;
}

const DEFAULT_CIMAVET_BASE_URL = 'https://cimavet.aemps.es/cimavet/rest';

export const resolveCimavetBaseUrl = (raw?: string) => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return DEFAULT_CIMAVET_BASE_URL;

  const lowered = trimmed.toLowerCase();
  if (lowered.includes('example') || lowered.includes('api.cimavet.example')) {
    return DEFAULT_CIMAVET_BASE_URL;
  }

  return trimmed;
};

const withTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const buildCimavetEndpointUrl = (baseUrl: string, endpoint: 'medicamentos' | 'medicamento') =>
  new URL(`${endpoint}/`, withTrailingSlash(baseUrl));

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ingredientQualifierPattern =
  /\b(hidrocloruro|clorhidrato|hydrochloride|hcl|maleato|mesilato|besilato|citrato|fosfato|sulfato|succinato|fumarato|lactato|acetato|nitrato|potasico|potasica|potassium|sodico|sodica|sodium|calcico|calcica|calcium)\b/g;

const normalizeIngredientFamily = (value: string) =>
  normalizeSearchText(value)
    .replace(ingredientQualifierPattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const matchesIngredientFamily = (value: string, query: string) => {
  const normalizedValue = normalizeSearchText(value);
  const normalizedQuery = normalizeSearchText(query);
  const familyValue = normalizeIngredientFamily(value);
  const familyQuery = normalizeIngredientFamily(query);

  if (!normalizedQuery) return true;

  return (
    normalizedValue.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedValue) ||
    familyValue.includes(familyQuery) ||
    familyQuery.includes(familyValue)
  );
};

const getCimavetActiveIngredientParts = (value?: string) =>
  (value ?? '')
    .split(/[;+]/)
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);

const getCimavetExactActiveIngredientMatchLevel = (medication: CimavetMedicationSummary, query: string) => {
  const q = normalizeSearchText(query);
  const familyQuery = normalizeIngredientFamily(query);
  const ingredients = getCimavetActiveIngredientParts(medication.pactivos);
  if (ingredients.length === 0) return 0;
  const matches = ingredients.some((ingredient) => ingredient === q || normalizeIngredientFamily(ingredient) === familyQuery);
  if (!matches) return 0;
  return ingredients.length === 1 ? 2 : 1;
};

const cimavetSpeciesAliasGroups = [
  ['dog', 'perro', 'perros', 'canino', 'caninos'],
  ['cat', 'gato', 'gatos', 'felino', 'felinos'],
  ['rabbit', 'conejo', 'conejos'],
  ['ferret', 'huron', 'hurones'],
  ['guinea pig', 'cobaya', 'cobayas'],
  ['chinchilla'],
  ['poultry', 'ave', 'aves', 'aves de produccion', 'pollo', 'pollos', 'gallina', 'gallinas', 'pavo', 'pavos', 'pato', 'patos'],
  ['equine', 'caballo', 'caballos', 'equino', 'equinos'],
  ['bovine', 'bovino', 'bovinos', 'vacuno', 'vacunos', 'ternero', 'terneros', 'vaca', 'vacas'],
  ['ovine', 'ovino', 'ovinos', 'oveja', 'ovejas', 'cordero', 'corderos'],
  ['caprine', 'caprino', 'caprinos', 'cabra', 'cabras', 'chivo', 'chivos'],
  ['porcine', 'porcino', 'porcinos', 'cerdo', 'cerdos', 'lechon', 'lechones', 'suino', 'suinos'],
  ['fish', 'pez', 'peces', 'acuicultura'],
  ['bee', 'abeja', 'abejas', 'apicola'],
] as const;

const expandCimavetSpeciesAliases = (value: string) => {
  const normalized = normalizeSearchText(value);
  const matchedGroup = cimavetSpeciesAliasGroups.find((group) => group.some((alias) => alias === normalized));

  return matchedGroup ? [...matchedGroup] : [normalized];
};

const cimavetSpeciesMatches = (query: string, candidate?: string) => {
  const normalizedCandidate = normalizeSearchText(candidate ?? '');
  if (!normalizedCandidate) return false;

  return expandCimavetSpeciesAliases(query).some(
    (alias) => normalizedCandidate.includes(alias) || alias.includes(normalizedCandidate),
  );
};

const parseNumericAmount = (value?: string) => {
  if (!value) return null;

  const normalized = value.replace(',', '.').trim();
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
};

export const getCimavetWithdrawalTimeItems = (detail?: CimavetMedicationDetail | null, species?: string) => {
  const items = detail?.tiemposEspera ?? [];
  if (!species) return items;

  return items.filter((item) => cimavetSpeciesMatches(species, item.especie?.nombre));
};

export const getCimavetWithdrawalTimeDays = (item: CimavetWithdrawalTimeItem) => {
  const amount = parseNumericAmount(item.cantidad);
  if (amount == null) return null;

  const unit = normalizeSearchText(item.unidadTiempo?.nombre ?? '');
  if (unit.startsWith('hora')) return amount / 24;
  if (unit.startsWith('dia')) return amount;
  if (unit.startsWith('semana')) return amount * 7;
  if (unit.startsWith('mes')) return amount * 30;

  return null;
};

export const getCimavetMaxWithdrawalDays = (detail?: CimavetMedicationDetail | null, species?: string) => {
  const days = getCimavetWithdrawalTimeItems(detail, species)
    .map((item) => getCimavetWithdrawalTimeDays(item))
    .filter((value): value is number => value != null);

  if (days.length === 0) return null;
  return Math.max(...days);
};

export class CimavetService {
  private catalogCache: CimavetMedicationSummary[] | null = null;
  private catalogPromise: Promise<CimavetMedicationSummary[]> | null = null;

  constructor(private readonly config: CimavetConfig) {}

  private buildHeaders() {
    if (!this.config.apiKey) return undefined;
    return { Authorization: `Bearer ${this.config.apiKey}` };
  }

  private async fetchMedicationPage(page: number, pageSize: number, nombre?: string): Promise<CimavetMedicationPage> {
    const url = buildCimavetEndpointUrl(this.config.baseUrl, 'medicamentos');
    url.searchParams.set('pagina', String(page));
    url.searchParams.set('tamanioPagina', String(pageSize));
    if (nombre) url.searchParams.set('nombre', nombre);

    const response = await fetch(url.toString(), { headers: this.buildHeaders() });
    if (!response.ok) throw new Error(`Cimavet list error: ${response.status}`);

    const data = (await response.json()) as CimavetListResponse;
    return {
      total: data.totalFilas ?? 0,
      pageSize: data.tamanioPagina ?? pageSize,
      results: data.resultados ?? [],
    };
  }

  private async fetchMedicationPageWithRetry(page: number, pageSize: number, nombre?: string, retries = 3) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        return await this.fetchMedicationPage(page, pageSize, nombre);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise((resolve) => window.setTimeout(resolve, attempt * 250));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Cimavet page fetch failed');
  }

  async listMedications(page = 1, pageSize = this.config.pageSize ?? 100) {
    return this.fetchMedicationPageWithRetry(page, pageSize);
  }

  async searchByTradeName(query: string, page = 1, pageSize = 25) {
    const firstPage = await this.fetchMedicationPageWithRetry(page, pageSize, query);
    const all = [...firstPage.results];
    const actualPageSize = Math.max(firstPage.pageSize, 1);
    const totalPages = Math.ceil(firstPage.total / actualPageSize);
    const parallelRequests = this.config.parallelRequests ?? 6;

    for (let i = page + 1; i <= totalPages; i += parallelRequests) {
      const batchPages = Array.from(
        { length: Math.min(parallelRequests, totalPages - i + 1) },
        (_, offset) => i + offset,
      );

      const batchResponses = await Promise.all(
        batchPages.map((batchPage) => this.fetchMedicationPageWithRetry(batchPage, actualPageSize, query)),
      );
      batchResponses.forEach((batch) => all.push(...batch.results));
    }

    return all;
  }

  async getMedicationByRegistration(nregistro: string): Promise<CimavetMedicationDetail> {
    const url = buildCimavetEndpointUrl(this.config.baseUrl, 'medicamento');
    url.searchParams.set('nregistro', nregistro);

    const response = await fetch(url.toString(), { headers: this.buildHeaders() });
    if (!response.ok) throw new Error(`Cimavet detail error: ${response.status}`);

    return (await response.json()) as CimavetMedicationDetail;
  }

  private filterCatalogByQuery(catalog: CimavetMedicationSummary[], query: string) {
    const q = normalizeSearchText(query);
    return catalog.filter((medication) => {
      const tradeName = normalizeSearchText(medication.nombre);
      const activeIngredient = normalizeSearchText(medication.pactivos ?? '');
      return tradeName.includes(q) || activeIngredient.includes(q) || matchesIngredientFamily(activeIngredient, query);
    });
  }

  async loadCatalog(options: { maxPages?: number } = {}): Promise<CimavetMedicationSummary[]> {
    if (!options.maxPages && this.catalogCache) return this.catalogCache;
    if (!options.maxPages && this.catalogPromise) return this.catalogPromise;

    const load = async () => {
      const pageSize = this.config.pageSize ?? 100;
      const parallelRequests = this.config.parallelRequests ?? 6;
      const firstPage = await this.listMedications(1, pageSize);
      const all = [...firstPage.results];
      const actualPageSize = Math.max(firstPage.pageSize, 1);
      const totalPages = Math.ceil(firstPage.total / actualPageSize);
      const pageLimit = options.maxPages ? Math.min(options.maxPages, totalPages) : totalPages;

      for (let i = 2; i <= pageLimit; i += parallelRequests) {
        const batchPages = Array.from(
          { length: Math.min(parallelRequests, pageLimit - i + 1) },
          (_, offset) => i + offset,
        );

        const batchResponses = await Promise.all(
          batchPages.map((batchPage) => this.listMedications(batchPage, actualPageSize)),
        );
        batchResponses.forEach((batch) => all.push(...batch.results));
      }

      if (!options.maxPages) this.catalogCache = all;
      return all;
    };

    if (!options.maxPages) {
      this.catalogPromise = load().finally(() => {
        this.catalogPromise = null;
      });
      return this.catalogPromise;
    }

    return load();
  }

  async searchMedications(query: string, options: CimavetSearchOptions = {}) {
    const q = normalizeSearchText(query);
    if (!q) return [];

    const includeActiveIngredientSearch = options.includeActiveIngredientSearch ?? true;
    let basicMatch: CimavetMedicationSummary[] = [];

    if (this.catalogCache) {
      basicMatch = this.filterCatalogByQuery(this.catalogCache, query);
    } else if (includeActiveIngredientSearch) {
      const catalog = await this.loadCatalog({ maxPages: options.maxPages });
      basicMatch = this.filterCatalogByQuery(catalog, query);
    } else {
      basicMatch = await this.searchByTradeName(query).catch(() => []);
    }

    let results = basicMatch;

    if (options.preferExactActiveIngredient) {
      const exactSingleMatches = results.filter((medication) => getCimavetExactActiveIngredientMatchLevel(medication, query) === 2);
      if (exactSingleMatches.length > 0) {
        results = exactSingleMatches;
      } else {
        const exactCombinationMatches = results.filter(
          (medication) => getCimavetExactActiveIngredientMatchLevel(medication, query) === 1,
        );
        if (exactCombinationMatches.length > 0) results = exactCombinationMatches;
      }
    }

    if (!options.species) return results;

    const speciesQuery = options.species;
    const details = await Promise.all(
      results.map(async (medication) => ({
        summary: medication,
        detail: await this.getMedicationByRegistration(medication.nregistro).catch(() => null),
      })),
    );

    return details
      .filter((item) => {
        if (!item.detail?.especies?.length) return true;
        return item.detail.especies.some((species) => cimavetSpeciesMatches(speciesQuery, species.nombre));
      })
      .map((item) => item.summary);
  }

  mapMedicationToDraftEntry(detail: CimavetMedicationDetail): TherapeuticEntry {
    const activeFromArray = detail.principiosActivos?.map((item) => item.nombre).filter(Boolean).join(' + ');
    const activeIngredient = activeFromArray || detail.pactivos || detail.nombre;
    const species = detail.especies?.map((item) => item.nombre).filter(Boolean) ?? ['Dog', 'Cat'];
    const indicationsText =
      detail.indicaciones?.map((item) => `${item.especie?.nombre ?? 'General'}: ${item.nombre}`).join('; ') ??
      'Pending clinical curation based on SmPC.';
    const contraindicationsText =
      detail.contraindicaciones
        ?.map((item) => `${item.especie?.nombre ?? 'General'}: ${item.nombre}`)
        .join('; ') ?? 'Pending clinical curation based on SmPC.';

    const url = buildCimavetEndpointUrl(this.config.baseUrl, 'medicamento');
    url.searchParams.set('nregistro', detail.nregistro);

    return {
      id: `cimavet-${detail.nregistro}`,
      activeIngredient,
      tradeNames: [detail.nombre],
      species: species as TherapeuticEntry['species'],
      tags: ['Imported', 'Needs Review'],
      systems: detail.atcs?.map((atc) => `[${atc.codigo}] ${atc.nombre}`) ?? ['General Medicine'],
      pathologies: ['Pending pathology indexing'],
      concentrations:
        detail.principiosActivos?.map((item) => `${item.nombre}${item.cantidad ? ` ${item.cantidad}` : ''}${item.unidad ? ` ${item.unidad}` : ''}`.trim()) ??
        [],
      indications: {
        es: indicationsText,
        en: indicationsText,
      },
      dosage: {
        es: 'Pendiente de curacion de dosis desde ficha tecnica y referencias clinicas.',
        en: 'Pending dosage curation from SmPC and clinical references.',
      },
      administrationConditions: {
        es: 'Pendiente de curacion de condiciones de administracion.',
        en: 'Pending curation of administration conditions.',
      },
      adverseEffects: {
        es: 'Pendiente de curacion de efectos adversos relevantes.',
        en: 'Pending curation of relevant adverse effects.',
      },
      contraindications: {
        es: contraindicationsText,
        en: contraindicationsText,
      },
      interactions: {
        es: 'Pendiente de curacion de interacciones clinicamente relevantes.',
        en: 'Pending curation of clinically relevant interactions.',
      },
      notes: {
        es: `Importado desde CIMAVet. Registro: ${detail.nregistro}.`,
        en: `Imported from CIMAVet. Registration: ${detail.nregistro}.`,
      },
      evidenceLevel: 'Expert Consensus',
      editorialStatus: 'draft',
      references: [
        {
          id: `ref-cimavet-${detail.nregistro}`,
          title: `CIMAVet official record: ${detail.nombre}`,
          authors: 'AEMPS (CIMAVet)',
          year: new Date().getFullYear(),
          source: 'CIMAVet',
          url: url.toString(),
        },
      ],
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
  }
}

export const buildCimavetRecordUrl = (baseUrl: string, nregistro: string) => {
  const url = buildCimavetEndpointUrl(baseUrl, 'medicamento');
  url.searchParams.set('nregistro', nregistro);
  return url.toString();
};

export const buildCimavetListUrl = (
  baseUrl: string,
  params: { pagina?: string; tamanioPagina?: string; nombre?: string },
) => {
  const url = buildCimavetEndpointUrl(baseUrl, 'medicamentos');
  if (params.pagina) url.searchParams.set('pagina', params.pagina);
  if (params.tamanioPagina) url.searchParams.set('tamanioPagina', params.tamanioPagina);
  if (params.nombre) url.searchParams.set('nombre', params.nombre);
  return url.toString();
};

export const createCimavetServiceFromEnv = () => {
  const baseUrl = resolveCimavetBaseUrl(import.meta.env.VITE_CIMAVET_BASE_URL);
  const apiKey = import.meta.env.VITE_CIMAVET_API_KEY;

  return new CimavetService({ baseUrl, apiKey });
};
