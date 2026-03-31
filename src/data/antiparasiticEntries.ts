import { EvidenceLevel, LocalizedText, TherapeuticEntry } from '../types';

const IMPORT_DATE = '2026-03-27';

const asLocalized = (es: string, en = ''): LocalizedText => ({ es, en });

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createEntry = ({
  activeIngredient,
  species,
  tags,
  systems,
  pathologies,
  indications,
  dosage,
  administrationConditions,
  adverseEffects,
  contraindications,
  interactions,
  notes,
  concentrations = [],
  tradeNames = [],
  evidenceLevel = 'Expert Consensus' as EvidenceLevel,
}: {
  activeIngredient: string;
  species: TherapeuticEntry['species'];
  tags: string[];
  systems: string[];
  pathologies: string[];
  indications: string;
  dosage: string;
  administrationConditions: string;
  adverseEffects: string;
  contraindications: string;
  interactions: string;
  notes?: string;
  concentrations?: string[];
  tradeNames?: string[];
  evidenceLevel?: EvidenceLevel;
}): TherapeuticEntry => ({
  id: normalizeId(activeIngredient),
  activeIngredient,
  tradeNames,
  species,
  tags,
  systems,
  pathologies,
  concentrations,
  indications: asLocalized(indications),
  dosage: asLocalized(dosage),
  administrationConditions: asLocalized(administrationConditions),
  adverseEffects: asLocalized(adverseEffects),
  contraindications: asLocalized(contraindications),
  interactions: asLocalized(interactions),
  notes: notes ? asLocalized(notes) : undefined,
  evidenceLevel,
  editorialStatus: 'draft',
  references: [],
  lastUpdated: IMPORT_DATE,
});

export const antiparasiticEntries: TherapeuticEntry[] = [
  createEntry({
    activeIngredient: 'Fenbendazol',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Benzimidazoles', 'Medicina interna'],
    systems: ['Aparato digestivo y metabolismo'],
    pathologies: ['Giardiosis', 'Neumonia eosinofilica'],
    indications: 'Benzimidazol de amplio uso frente a nematodos y Giardia, con aplicaciones respiratorias concretas.',
    dosage:
      'Perros/Gatos: pauta general 75 mg/kg VO cada 24 h durante 2 dias.\nPerros/Gatos: giardiosis 50 mg/kg VO cada 24 h durante 3-5 dias.\nPerros: neumonia eosinofilica 25-50 mg/kg VO cada 24 h durante 20 dias.',
    administrationConditions: 'Administrar con comida si hay intolerancia digestiva y ajustar duracion al parasito diana.',
    adverseEffects: 'Generalmente bien tolerado; ocasionalmente vomitos o diarrea.',
    contraindications: 'Precaucion en gestacion temprana.',
    interactions: 'Pocas interacciones relevantes; revisar protocolos combinados antiparasitarios.',
  }),
  createEntry({
    activeIngredient: 'Fenbendazol + pirantel + praziquantel',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Benzimidazoles'],
    systems: ['Aparato digestivo y metabolismo'],
    pathologies: ['Nematodosis intestinal', 'Cestodosis intestinal'],
    indications: 'Combinacion antihelmintica oral para desparasitacion interna de amplio espectro.',
    dosage: 'Perros: 20 + 5 + 5 mg/kg VO, respectivamente.',
    administrationConditions: 'Elegir presentacion segun peso y especie; seguir pauta de desparasitacion interna.',
    adverseEffects: 'Molestias digestivas leves ocasionales.',
    contraindications: 'No administrar a cachorros menores de 2 kg ni a hembras durante las primeras semanas de gestacion.',
    interactions: 'Revisar duplicidad con otras desparasitaciones internas simultaneas.',
  }),
  createEntry({
    activeIngredient: 'Flubendazol',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Benzimidazoles'],
    systems: ['Aparato digestivo y metabolismo'],
    pathologies: ['Nematodosis intestinal'],
    indications: 'Benzimidazol para nematodos gastrointestinales.',
    dosage: 'Perros/Gatos: 2,2 mg/kg VO cada 24 h durante 2-3 dias.',
    administrationConditions: 'Ajustar duracion segun el parasito implicado y control coproparasitario.',
    adverseEffects: 'Trastornos digestivos leves poco frecuentes.',
    contraindications: 'No administrar durante los dos primeros tercios de gestacion.',
    interactions: 'Sin interacciones destacables en uso habitual.',
  }),
  createEntry({
    activeIngredient: 'Mebendazol',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Benzimidazoles'],
    systems: ['Aparato digestivo y metabolismo'],
    pathologies: ['Nematodosis intestinal', 'Teniosis'],
    indications: 'Benzimidazol para nematodos y tenias en pautas cortas.',
    dosage:
      'Perros/Gatos: 20 mg/kg VO cada 24 h durante 3 dias en nematodosis o 5 dias en teniosis.',
    administrationConditions: 'Mantener la pauta completa y reevaluar si persisten huevos o signos clinicos.',
    adverseEffects: 'Hiporexia o diarrea leves.',
    contraindications: 'No administrar durante los dos primeros tercios de gestacion.',
    interactions: 'Pocas interacciones relevantes.',
  }),
  createEntry({
    activeIngredient: 'Levamisol',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Otros antihelminticos', 'Inmunomoduladores'],
    systems: ['Medicina interna'],
    pathologies: ['Lupus eritematoso sistemico'],
    indications: 'Uso muy puntual como inmunomodulador/antihelmintico en protocolos seleccionados.',
    dosage: 'Perros: 2-5 mg/kg VO cada 48 h, maximo 150 mg, combinado con prednisona.',
    administrationConditions: 'Reservar a indicaciones concretas y bajo seguimiento estrecho.',
    adverseEffects: 'Salivacion, vomitos, excitacion o signos colinergicos.',
    contraindications: 'Precaucion en pacientes debilitados o con enfermedad sistemica importante.',
    interactions: 'Vigilar combinacion con otros inmunomoduladores.',
  }),
  createEntry({
    activeIngredient: 'Toltrazurilo + emodepsida',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Otros antihelminticos'],
    systems: ['Aparato digestivo y metabolismo'],
    pathologies: ['Coccidiosis', 'Parasitosis intestinal mixta'],
    indications: 'Combinacion antiparasitaria util cuando se busca cubrir coccidios y nematodos en cachorro.',
    dosage: 'Perros: 9 mg/kg de toltrazurilo y 0,45 mg/kg de emodepsida VO.',
    administrationConditions: 'Ajustar por peso exacto y valorar el estatus MDR1 en razas predispuestas.',
    adverseEffects: 'Trastornos digestivos leves.',
    contraindications: 'No administrar a cachorros menores de 2 semanas o 0,4 kg, ni a collie, pastor de Shetland o bobtail sin valorar MDR1; evitar en lactacion temprana.',
    interactions: 'Precaucion con otros macrocilicos concomitantes.',
  }),
  createEntry({
    activeIngredient: 'Doramectina',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Avermectinas y milbemicinas', 'Dermatologia'],
    systems: ['Dermatologicos'],
    pathologies: ['Sarna demodecica generalizada'],
    indications: 'Lactona macrociclica para demodicosis generalizada en perros adultos.',
    dosage: 'Perros: 0,6 mg/kg SC cada 7 dias hasta obtener dos raspados negativos separados un mes.',
    administrationConditions: 'Control dermatologico seriado y evitar en razas con riesgo MDR1 sin test previo.',
    adverseEffects: 'Signos neurologicos, hipersalivacion, ataxia o depresión si hay sensibilidad a macrocilicos.',
    contraindications: 'No administrar a collie, pastor de Shetland o bobtail, o sus cruces, sin valorar MDR1; precaucion en pacientes con dirofilariosis.',
    interactions: 'Evitar sumar otras lactonas macrociclicas salvo indicacion muy clara.',
  }),
  createEntry({
    activeIngredient: 'Ivermectina',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Avermectinas y milbemicinas', 'Dermatologia', 'Cardiologia'],
    systems: ['Dermatologicos', 'Aparato cardiovascular'],
    pathologies: ['Sarna sarcoptica', 'Otodectes', 'Cheyletiella', 'Dirofilariosis', 'Microfilaremia'],
    indications: 'Lactona macrociclica para ectoparasitos y prevencion/eliminacion de filarias en situaciones concretas.',
    dosage:
      'Perros/Gatos: sarna sarcoptica, notoedrica, otodectica, dermatitis por Cheyletiella 0,3 mg/kg semanal VO o SC durante 4-8 semanas.\nPerros: prevencion de dirofilariosis 6-12 mcg/kg VO mensual o 24 mcg/kg VO mensual segun producto.\nPerros: eliminacion de microfilarias 50 mcg/kg VO.',
    administrationConditions: 'Seguir normas de prevencion de dirofilariosis y ajustar estrictamente por peso.',
    adverseEffects: 'Neurotoxicidad, ataxia, midriasis, hipersalivacion y depresión en sensibles.',
    contraindications: 'No administrar a collie, pastor de Shetland o bobtail, o sus cruces, sin valorar MDR1.',
    interactions: 'Riesgo aumentado con otros macrocilicos o farmacos que atraviesan la barrera hematoencefalica.',
  }),
  createEntry({
    activeIngredient: 'Milbemicina + praziquantel',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Avermectinas y milbemicinas'],
    systems: ['Aparato digestivo y metabolismo', 'Aparato respiratorio'],
    pathologies: ['Nematodosis intestinal', 'Cestodosis intestinal', 'Angiostrongylosis', 'Neumonia eosinofilica'],
    indications: 'Combinacion antiparasitaria interna de amplio espectro con utilidad adicional frente a angiostrongylus.',
    dosage:
      'Perros: minimo 0,5 mg/kg de milbemicina + 5 mg/kg de praziquantel; en angiostrongylosis, dos dosis separadas una semana de milbemicina; en neumonia eosinofilica, ver articulo correspondiente.\nGatos: minimo 2 mg/kg de milbemicina + 5 mg/kg de praziquantel.',
    administrationConditions: 'Seleccionar presentacion segun peso y especie.',
    adverseEffects: 'Signos digestivos leves y, raramente, letargia transitoria.',
    contraindications: 'No administrar a perros menores de 2 semanas o 0,5 kg ni a gatos menores de 6 semanas o 0,5 kg.',
    interactions: 'Precaucion si se combina con otras lactonas macrociclicas.',
  }),
  createEntry({
    activeIngredient: 'Moxidectina',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios internos', 'Avermectinas y milbemicinas', 'Cardiologia'],
    systems: ['Aparato cardiovascular'],
    pathologies: ['Dirofilariosis', 'Microfilarias'],
    indications: 'Lactona macrociclica utilizada en prevencion de dirofilariosis y control de microfilarias.',
    dosage:
      'Perros: prevencion de dirofilariosis y eliminacion de microfilarias 3 mcg/kg IV mensualmente como preventivo, segun el producto y combinacion.\nPerros: otra pauta descrita, 0,17 mg/kg SC cada 12 meses, 0,05 mL/kg SC un mes antes del periodo de riesgo.',
    administrationConditions: 'La pauta depende mucho de la formulacion comercial; ajustar a producto y calendario.',
    adverseEffects: 'Letargia, signos digestivos y, en sensibles, neurotoxicidad.',
    contraindications: 'No administrar ciertas presentaciones inyectables a animales menores de 6 meses.',
    interactions: 'Precaucion con otras lactonas macrociclicas.',
    notes: 'La pagina mezcla pautas preventivas segun presentacion; conviene revisar ficha tecnica al convertir esto en preset de calculadora.',
  }),
  createEntry({
    activeIngredient: 'Afoxolaner',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antiparasitarios externos', 'Isoxazolinas', 'Dermatologia'],
    systems: ['Dermatologicos'],
    pathologies: ['Miasis', 'Pulgas', 'Garrapatas'],
    indications: 'Isoxazolina oral para ectoparasitosis, con referencia explicita a miasis en estas paginas.',
    dosage: 'Perros: miasis, 1 comprimido VO; en otras parasitosis, seguir frecuencia segun tabla y peso.',
    administrationConditions: 'Seleccionar el comprimido por peso exacto.',
    adverseEffects: 'Vomitos, diarrea, prurito o letargia leves.',
    contraindications: 'No ha quedado demostrada su seguridad en cachorros menores de 8 semanas o 2 kg, ni durante la gestacion y lactancia.',
    interactions: 'Precaucion en pacientes con antecedentes neurologicos.',
  }),
  createEntry({
    activeIngredient: 'Nitenpiram',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antiparasitarios externos', 'Otros antiparasitarios externos', 'Dermatologia'],
    systems: ['Dermatologicos'],
    pathologies: ['Pulgas', 'Dermatitis alergica por pulgas', 'Miasis'],
    indications: 'Adulticida oral rapido para pulgas, con uso puntual en DAPP y miasis.',
    dosage:
      'Perros/Gatos: pulgas, 1 comprimido VO con la frecuencia requerida.\nGatos: diagnostico de dermatitis alergica por pulgas, 1 comprimido VO cada 48 h durante 1 mes.\nPerros: miasis, 1 comprimido VO.',
    administrationConditions: 'Util como herramienta de derribo rapido, no como control ambiental sostenido.',
    adverseEffects: 'Prurito transitorio, vocalizacion o hipersalivacion por muerte rapida de pulgas.',
    contraindications: 'No administrar a animales menores de 4 semanas o de menos de 1 kg.',
    interactions: 'Puede combinarse con otros ectoparasiticidas de mantenimiento bajo criterio clinico.',
  }),
  createEntry({
    activeIngredient: 'Alopurinol',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antileishmanicos', 'Medicina interna', 'Urinario y nefrologia'],
    systems: ['Medicina interna', 'Urinario y nefrologia'],
    pathologies: ['Leishmaniosis', 'Urolitos de urato'],
    indications: 'Leishmaniostatico oral y tambien herramienta para manejo de urolitos de urato.',
    dosage:
      'Perros: leishmaniosis 10 mg/kg VO cada 12 h durante 6-12 meses.\nGatos: leishmaniosis 20 mg/kg VO al dia en una o dos tomas durante mas de 6 meses.\nPerros: urolitos de urato 15 mg/kg VO cada 12 h para disolver y 5-7 mg/kg VO cada 12-24 h para prevenir recidivas.',
    administrationConditions: 'Monitorizar cristaluria y valorar dieta baja en purinas en tratamientos prolongados.',
    adverseEffects: 'Xantinuria, urolitiasis por xantina y trastornos digestivos.',
    contraindications: 'Precaucion en insuficiencia renal o antecedentes de urolitos por xantina.',
    interactions: 'Revisar junto a dietas urinarias, miltefosina o antimoniato cuando se use frente a leishmaniosis.',
  }),
  createEntry({
    activeIngredient: 'Antimoniato de meglumina',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Antileishmanicos', 'Medicina interna'],
    systems: ['Medicina interna'],
    pathologies: ['Leishmaniosis'],
    indications: 'Leishmanicida parenteral de uso clasico en protocolos combinados.',
    dosage:
      'Perros: 100 mg/kg SC cada 24 h durante 4-6 semanas.\nGatos: 20-50 mg/kg SC cada 24 h durante 30 dias.',
    administrationConditions: 'Usar con monitorizacion renal, hepatica y pancreatica.',
    adverseEffects: 'Dolor local, letargia, pancreatitis y nefrotoxicidad.',
    contraindications: 'No administrar a pacientes con insuficiencia renal, hepatica o cardiaca.',
    interactions: 'Vigilar combinacion con alopurinol y otras terapias potencialmente nefrotoxicas.',
  }),
  createEntry({
    activeIngredient: 'Miltefosina',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antileishmanicos', 'Medicina interna'],
    systems: ['Medicina interna'],
    pathologies: ['Leishmaniosis'],
    indications: 'Leishmanicida oral como alternativa o complemento en protocolos prolongados.',
    dosage: 'Perros: 2 mg/kg VO cada 24 h durante 28 dias.',
    administrationConditions: 'Administrar con comida y monitorizar tolerancia digestiva.',
    adverseEffects: 'Vomitos, diarrea y anorexia.',
    contraindications: 'No administrar a hembras gestantes ni lactantes, ni a perros en reproduccion.',
    interactions: 'Revisar combinacion con alopurinol y otros tratamientos antileishmania.',
  }),
  createEntry({
    activeIngredient: 'Atovacuona',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Babesicidas', 'Medicina interna'],
    systems: ['Medicina interna'],
    pathologies: ['Babesiosis canina', 'Cytauxzoonosis felina'],
    indications: 'Antiprotozoario clave en babesiosis canina y cytauxzoonosis felina, generalmente combinado con azitromicina.',
    dosage:
      'Perros: babesiosis por B. gibsoni y B. vulpes, 13,3 mg/kg VO cada 8 h asociado a azitromicina, o 17-25 mg/kg VO cada 12 h en formulacion atovacuona-proguanil.\nGatos: cytauxzoonosis, 15 mg/kg VO cada 8 h durante 15 dias asociado a azitromicina.',
    administrationConditions: 'Idealmente administrar con comida grasa para mejorar absorcion.',
    adverseEffects: 'Diarrea, hiporexia y vomitos.',
    contraindications: 'Precaucion en pacientes muy debilitados o con hepatopatia.',
    interactions: 'Valorar siempre junto con azitromicina en estos protocolos.',
  }),
  createEntry({
    activeIngredient: 'Imidocarb',
    species: ['Dog', 'Cat'],
    tags: ['Antiparasitarios', 'Babesicidas', 'Medicina interna'],
    systems: ['Medicina interna'],
    pathologies: ['Babesiosis', 'Hepatozoonosis'],
    indications: 'Antiprotozoario parenteral para babesiosis y algunas pautas frente a hepatozoonosis.',
    dosage:
      'Perros: babesiosis por Babesia canis y Babesia vogeli, 6,6 mg/kg IM/SC en dos dosis separadas 15 dias.\nGatos: babesiosis por Babesia canis, 3,5-5,0 mg/kg IM/SC en dos dosis separadas 10 dias.\nPerros: hepatozoonosis 5 mg/kg SC cada 7 dias durante 4 semanas.',
    administrationConditions: 'Premedicar si procede para reducir efectos colinergicos y monitorizar tras la inyeccion.',
    adverseEffects: 'Dolor local, salivacion, vomitos, diarrea y signos colinergicos.',
    contraindications: 'Precaucion en pacientes debilitados o con enfermedad hepatica/renal.',
    interactions: 'Puede requerir soporte anticolinergico segun tolerancia.',
  }),
  createEntry({
    activeIngredient: 'Melarsomina',
    species: ['Dog'],
    tags: ['Antiparasitarios', 'Antifilaricos', 'Cardiologia', 'Medicina interna'],
    systems: ['Aparato cardiovascular', 'Medicina interna'],
    pathologies: ['Dirofilariosis adulta'],
    indications: 'Adulticida de eleccion frente a dirofilariosis canina.',
    dosage:
      'Perros: 2,5 mg/kg IM profundo, dos dosis separadas 24 horas; en parasitosis intensa se recomienda un mes antes una sola dosis.',
    administrationConditions: 'Integrar dentro del protocolo completo de dirofilariosis con restriccion de ejercicio estricta.',
    adverseEffects: 'Dolor local, inflamacion y riesgo tromboembolico por muerte de vermes.',
    contraindications: 'No administrar a pacientes con insuficiencia renal o hepatica ni a hembras gestantes.',
    interactions: 'Coordinar con preventivos macrocilicos, doxiciclina y antiinflamatorios segun protocolo.',
  }),
];

export const antiparasiticEntryNames = antiparasiticEntries.map((entry) => entry.activeIngredient);
