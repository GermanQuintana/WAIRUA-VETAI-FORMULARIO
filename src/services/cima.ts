interface CimaNameItem {
  id?: number;
  codigo?: string;
  nombre: string;
}

interface CimaDocument {
  tipo: number;
  url: string;
  urlHtml?: string;
  secc?: boolean;
  fecha?: number;
}

interface CimaAtcItem {
  codigo: string;
  nombre: string;
  nivel: number;
}

interface CimaPrincipioActivo {
  id?: number;
  codigo?: string;
  nombre: string;
  cantidad?: string;
  unidad?: string;
  orden?: number;
}

interface CimaPresentation {
  cn: string;
  nombre: string;
  comerc?: boolean;
  psum?: boolean;
  envaseClinico?: boolean;
}

export interface CimaMedicationSummary {
  nregistro: string;
  nombre: string;
  pactivos?: string;
  labtitular?: string;
  labcomercializador?: string;
  cpresc?: string;
  comerc?: boolean;
  receta?: boolean;
  generico?: boolean;
  conduc?: boolean;
  triangulo?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  psum?: boolean;
  ema?: boolean;
  docs?: CimaDocument[];
  viasAdministracion?: CimaNameItem[];
  formaFarmaceutica?: CimaNameItem;
  formaFarmaceuticaSimplificada?: CimaNameItem;
  vtm?: CimaNameItem;
  dosis?: string;
}

export interface CimaMedicationDetail extends CimaMedicationSummary {
  atcs?: CimaAtcItem[];
  principiosActivos?: CimaPrincipioActivo[];
  presentaciones?: CimaPresentation[];
}

interface CimaListResponse {
  totalFilas?: number;
  pagina?: number;
  tamanioPagina?: number;
  resultados?: CimaMedicationSummary[];
}

interface CimaMedicationPage {
  total: number;
  page: number;
  pageSize: number;
  results: CimaMedicationSummary[];
}

export interface CimaConfig {
  baseUrl: string;
  parallelRequests?: number;
}

export interface CimaSearchOptions {
  includeTradeNameSearch?: boolean;
  includeActiveIngredientSearch?: boolean;
}

const DEFAULT_CIMA_BASE_URL = 'https://cima.aemps.es/cima/rest';

export const resolveCimaBaseUrl = (raw?: string) => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return DEFAULT_CIMA_BASE_URL;

  const lowered = trimmed.toLowerCase();
  if (lowered.includes('example') || lowered.includes('api.cima.example')) {
    return DEFAULT_CIMA_BASE_URL;
  }

  return trimmed;
};

const withTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const buildCimaEndpointUrl = (baseUrl: string, endpoint: 'medicamentos' | 'medicamento') =>
  new URL(endpoint, withTrailingSlash(baseUrl));

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const scoreMedication = (medication: CimaMedicationSummary, query: string) => {
  const q = normalizeSearchText(query);
  const tradeName = normalizeSearchText(medication.nombre);
  const activeIngredient = normalizeSearchText(medication.pactivos ?? medication.vtm?.nombre ?? '');

  let score = 0;

  if (tradeName === q) score += 120;
  if (activeIngredient === q) score += 110;
  if (tradeName.startsWith(q)) score += 40;
  if (activeIngredient.startsWith(q)) score += 35;
  if (tradeName.includes(q)) score += 25;
  if (activeIngredient.includes(q)) score += 20;
  if (medication.comerc) score += 8;
  if (medication.receta) score += 3;

  return score;
};

export class CimaService {
  constructor(private readonly config: CimaConfig) {}

  private async fetchMedicationPage(
    page: number,
    params: {
      nombre?: string;
      practiv1?: string;
    } = {},
  ): Promise<CimaMedicationPage> {
    const url = buildCimaEndpointUrl(this.config.baseUrl, 'medicamentos');
    url.searchParams.set('pagina', String(page));
    if (params.nombre) url.searchParams.set('nombre', params.nombre);
    if (params.practiv1) url.searchParams.set('practiv1', params.practiv1);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`CIMA list error: ${response.status}`);

    const data = (await response.json()) as CimaListResponse;
    return {
      total: data.totalFilas ?? 0,
      page: data.pagina ?? page,
      pageSize: data.tamanioPagina ?? 200,
      results: data.resultados ?? [],
    };
  }

  private async fetchMedicationPageWithRetry(
    page: number,
    params: {
      nombre?: string;
      practiv1?: string;
    } = {},
    retries = 3,
  ) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        return await this.fetchMedicationPage(page, params);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise((resolve) => window.setTimeout(resolve, attempt * 250));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('CIMA page fetch failed');
  }

  private async fetchAllPages(params: { nombre?: string; practiv1?: string }) {
    const firstPage = await this.fetchMedicationPageWithRetry(1, params);
    const all = [...firstPage.results];
    const pageSize = Math.max(firstPage.pageSize, 1);
    const totalPages = Math.ceil(firstPage.total / pageSize);
    const parallelRequests = this.config.parallelRequests ?? 4;

    for (let page = 2; page <= totalPages; page += parallelRequests) {
      const batchPages = Array.from(
        { length: Math.min(parallelRequests, totalPages - page + 1) },
        (_, offset) => page + offset,
      );

      const batchResponses = await Promise.all(
        batchPages.map((batchPage) => this.fetchMedicationPageWithRetry(batchPage, params)),
      );
      batchResponses.forEach((batch) => all.push(...batch.results));
    }

    return all;
  }

  async searchByTradeName(query: string) {
    return this.fetchAllPages({ nombre: query });
  }

  async searchByActiveIngredient(query: string) {
    return this.fetchAllPages({ practiv1: query });
  }

  async searchMedications(query: string, options: CimaSearchOptions = {}) {
    const q = query.trim();
    if (q.length < 2) return [];

    const includeTradeNameSearch = options.includeTradeNameSearch ?? true;
    const includeActiveIngredientSearch = options.includeActiveIngredientSearch ?? true;
    const searches: Array<Promise<CimaMedicationSummary[]>> = [];

    if (includeTradeNameSearch) searches.push(this.searchByTradeName(q));
    if (includeActiveIngredientSearch) searches.push(this.searchByActiveIngredient(q));

    const results = await Promise.all(searches);
    const merged = new Map<string, CimaMedicationSummary>();

    results.flat().forEach((medication) => {
      const current = merged.get(medication.nregistro);
      if (!current || scoreMedication(medication, q) > scoreMedication(current, q)) {
        merged.set(medication.nregistro, medication);
      }
    });

    return Array.from(merged.values()).sort((left, right) => scoreMedication(right, q) - scoreMedication(left, q));
  }

  async getMedicationByRegistration(nregistro: string): Promise<CimaMedicationDetail> {
    const url = buildCimaEndpointUrl(this.config.baseUrl, 'medicamento');
    url.searchParams.set('nregistro', nregistro);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`CIMA detail error: ${response.status}`);

    return (await response.json()) as CimaMedicationDetail;
  }
}

export const buildCimaRecordUrl = (baseUrl: string, nregistro: string) => {
  const url = buildCimaEndpointUrl(baseUrl, 'medicamento');
  url.searchParams.set('nregistro', nregistro);
  return url.toString();
};

export const createCimaServiceFromEnv = () => {
  const baseUrl = resolveCimaBaseUrl(import.meta.env.VITE_CIMA_BASE_URL);
  return new CimaService({ baseUrl });
};
