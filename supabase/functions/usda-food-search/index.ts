import { corsHeaders } from '../_shared/cors.ts';

type Species = 'Dog' | 'Cat';

interface FdcFoodNutrient {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

interface FdcSearchFood {
  fdcId?: number;
  description?: string;
  dataType?: string;
  foodCategory?: string;
  foodNutrients?: FdcFoodNutrient[];
}

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const MAX_PAGE_SIZE = 15;

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
  });

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeSpecies = (value: unknown): Species => (value === 'Cat' ? 'Cat' : 'Dog');

const nutrientValue = (nutrients: FdcFoodNutrient[], nutrientIds: number[], names: string[]) => {
  const nutrient = nutrients.find((item) => {
    const itemName = normalizeText(item.nutrientName).toLowerCase();
    return nutrientIds.includes(Number(item.nutrientId)) || names.some((name) => itemName.includes(name));
  });

  const value = Number(nutrient?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const toFoodIngredient = (food: FdcSearchFood, species: Species) => {
  const fdcId = Number(food.fdcId ?? 0);
  const description = normalizeText(food.description);
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

  return {
    id: `usda-fdc-${fdcId}`,
    foodName: description,
    category: normalizeText(food.foodCategory) || normalizeText(food.dataType) || 'USDA FoodData Central',
    preparation: normalizeText(food.dataType) || 'FoodData Central',
    species: [species],
    notes: {
      es: `Datos de USDA FoodData Central, FDC ID ${fdcId}. Revisar tolerancia individual y adecuacion veterinaria antes de prescribir.`,
      en: `Data from USDA FoodData Central, FDC ID ${fdcId}. Check individual tolerance and veterinary suitability before prescribing.`,
    },
    nutrientsPer100g: {
      energyKcal: nutrientValue(nutrients, [1008, 2047, 2048], ['energy']),
      proteinG: nutrientValue(nutrients, [1003], ['protein']),
      fatG: nutrientValue(nutrients, [1004], ['total lipid', 'total fat']),
      carbohydrateG: nutrientValue(nutrients, [1005], ['carbohydrate']),
      fiberG: nutrientValue(nutrients, [1079, 2033], ['fiber']),
      calciumMg: nutrientValue(nutrients, [1087], ['calcium']),
      phosphorusMg: nutrientValue(nutrients, [1091], ['phosphorus']),
      sodiumMg: nutrientValue(nutrients, [1093], ['sodium']),
      potassiumMg: nutrientValue(nutrients, [1092], ['potassium']),
      magnesiumMg: nutrientValue(nutrients, [1090], ['magnesium']),
      zincMg: nutrientValue(nutrients, [1095], ['zinc']),
      taurineMg: nutrientValue(nutrients, [], ['taurine']),
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  const apiKey = normalizeText(Deno.env.get('USDA_FDC_API_KEY'));
  if (!apiKey) {
    return json({ error: 'Missing USDA_FDC_API_KEY.' }, { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query = normalizeText(body?.query);
    const species = normalizeSpecies(body?.species);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.round(Number(body?.pageSize ?? 8))));

    if (query.length < 2) {
      return json({ foods: [] }, { headers: corsHeaders });
    }

    const url = new URL(`${USDA_BASE_URL}/foods/search`);
    url.searchParams.set('api_key', apiKey);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        pageSize,
        pageNumber: 1,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
      }),
    });

    if (!response.ok) {
      return json({ error: 'USDA request failed.' }, { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();
    const foods = ((Array.isArray(data?.foods) ? data.foods : []) as FdcSearchFood[])
      .filter((food) => Number(food.fdcId) > 0 && normalizeText(food.description))
      .map((food) => toFoodIngredient(food, species));

    return json({ foods }, { headers: corsHeaders });
  } catch (_error) {
    return json({ error: 'Could not search USDA foods.' }, { status: 500, headers: corsHeaders });
  }
});
