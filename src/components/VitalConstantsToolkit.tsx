import { useMemo, useState } from 'react';
import { Language } from '../i18n';

type ConstantMetricKey = 'temperature' | 'heartRate' | 'respiratoryRate' | 'bloodPressure' | 'crt' | 'mucosa';
type SpeciesAccent = 'companion' | 'equine' | 'ruminant' | 'bovine' | 'porcine' | 'exotic' | 'reptile' | 'avian';

interface ConstantMetric {
  key: ConstantMetricKey;
  label: { es: string; en: string };
  value: string;
  unit?: string;
  note: { es: string; en: string };
}

interface ReproductiveFact {
  label: { es: string; en: string };
  value: string;
}

interface SpeciesConstants {
  id: string;
  name: { es: string; en: string };
  group: { es: string; en: string };
  accent: SpeciesAccent;
  metrics: ConstantMetric[];
  reproductive: ReproductiveFact[];
  quickNotes: Array<{ es: string; en: string }>;
}

const metricLabels: Record<ConstantMetricKey, { es: string; en: string }> = {
  temperature: { es: 'Temperatura', en: 'Temperature' },
  heartRate: { es: 'FC', en: 'HR' },
  respiratoryRate: { es: 'FR', en: 'RR' },
  bloodPressure: { es: 'PANI', en: 'NIBP' },
  crt: { es: 'TRC', en: 'CRT' },
  mucosa: { es: 'Mucosas', en: 'Mucous membranes' },
};

const metric = (key: ConstantMetricKey, value: string, unit: string | undefined, noteEs: string, noteEn = noteEs): ConstantMetric => ({
  key,
  label: metricLabels[key],
  value,
  unit,
  note: { es: noteEs, en: noteEn },
});

const fact = (labelEs: string, labelEn: string, value: string): ReproductiveFact => ({
  label: { es: labelEs, en: labelEn },
  value,
});

const smallMammalExamNotes = [
  { es: 'Manipular poco tiempo: la contencion altera FC, FR y temperatura.', en: 'Keep handling brief: restraint alters HR, RR, and temperature.' },
  { es: 'Apetito, heces y actitud suelen detectar problemas antes que un unico valor.', en: 'Appetite, feces, and attitude often detect problems before one value does.' },
];

const reptileExamNotes = [
  { es: 'Interpretar siempre con temperatura ambiental y zona termica del terrario.', en: 'Always interpret with ambient temperature and the enclosure thermal zone.' },
  { es: 'Perfusion, hidratacion y respuesta neuromuscular pesan mas que una PANI aislada.', en: 'Perfusion, hydration, and neuromuscular response matter more than one NIBP reading.' },
];

const avianExamNotes = [
  { es: 'En aves, primero observar respiracion, postura y cola antes de manipular.', en: 'In birds, observe breathing, posture, and tail motion before handling.' },
  { es: 'La contencion prolongada puede descompensar pacientes respiratorios.', en: 'Prolonged restraint can destabilize respiratory patients.' },
];

const speciesConstants: SpeciesConstants[] = [
  {
    id: 'dog',
    name: { es: 'Perro', en: 'Dog' },
    group: { es: 'Pequenos animales', en: 'Companion animal' },
    accent: 'companion',
    metrics: [
      metric('temperature', '37.5-39.2', 'C', 'Rectal, adulto en reposo.', 'Rectal, resting adult.'),
      metric('heartRate', '70-120', 'lpm', 'Sube con tamano pequeno, dolor o estres.', 'Higher in small breeds, pain, or stress.'),
      metric('respiratoryRate', '18-34', 'rpm', 'Valorar mejor en reposo o sueno.', 'Best assessed at rest or asleep.'),
      metric('bloodPressure', '110-160 / 60-100', 'mmHg', 'Sistolica orientativa; repetir si hay estres.', 'Indicative systolic range; repeat if stressed.'),
      metric('crt', '< 2', 's', 'Perfusion periferica normal.', 'Normal peripheral perfusion.'),
      metric('mucosa', 'Rosa humeda', undefined, 'Alertan palidez, cianosis o ictericia.', 'Pallor, cyanosis, or icterus are warning signs.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-13 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Cada 6-7 meses; estro aprox. 9 dias'),
      fact('Gestacion', 'Gestation', '62-64 dias'),
      fact('Camada', 'Litter size', '4-8 cachorros, muy variable por raza'),
    ],
    quickNotes: [
      { es: 'Usa la tendencia del paciente mas que una lectura aislada.', en: 'Use the patient trend more than one isolated value.' },
      { es: 'La FR dormido es una referencia sensible en pacientes cardiacos.', en: 'Sleeping RR is a sensitive marker in cardiac patients.' },
    ],
  },
  {
    id: 'cat',
    name: { es: 'Gato', en: 'Cat' },
    group: { es: 'Pequenos animales', en: 'Companion animal' },
    accent: 'companion',
    metrics: [
      metric('temperature', '38.1-39.2', 'C', 'Rectal, adulto en reposo.', 'Rectal, resting adult.'),
      metric('heartRate', '120-180', 'lpm', 'Puede subir mucho por miedo en consulta.', 'Can rise markedly with clinic stress.'),
      metric('respiratoryRate', '20-30', 'rpm', 'Observar sin manipular.', 'Observe without handling.'),
      metric('bloodPressure', '120-150', 'mmHg sistolica', 'PANI Doppler/oscilometrica con varias lecturas.', 'Doppler/oscillometric NIBP with repeated readings.'),
      metric('crt', '< 2', 's', 'Interpretar junto a pulso y temperatura distal.', 'Interpret with pulse quality and distal temperature.'),
      metric('mucosa', 'Rosa humeda', undefined, 'Palidez o respiracion oral requieren urgencia.', 'Pallor or open-mouth breathing needs urgent attention.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '12-16 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Poliestrica estacional; 14-21 dias'),
      fact('Gestacion', 'Gestation', '63-65 dias'),
      fact('Camada', 'Litter size', '3-5 gatitos'),
    ],
    quickNotes: [
      { es: 'El gato disneaico se explora con minima contencion.', en: 'A dyspneic cat should be handled with minimal restraint.' },
      { es: 'La PANI necesita ambiente tranquilo para evitar falsos altos.', en: 'NIBP needs a quiet setting to avoid false highs.' },
    ],
  },
  {
    id: 'rabbit',
    name: { es: 'Conejo', en: 'Rabbit' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '38.6-40.1', 'C', 'Rectal con contencion suave.', 'Rectal with gentle restraint.'),
      metric('heartRate', '180-350', 'lpm', 'Muy dependiente de estres y dolor.', 'Highly affected by stress and pain.'),
      metric('respiratoryRate', '30-60', 'rpm', 'La taquipnea puede aparecer por calor, dolor o miedo.', 'Tachypnea may reflect heat, pain, or fear.'),
      metric('bloodPressure', '90-130 / 60-90', 'mmHg', 'PANI orientativa; tecnica muy variable.', 'Indicative NIBP; technique is highly variable.'),
      metric('crt', '< 2', 's', 'Valorar tambien orejas y pulso femoral.', 'Also assess ears and femoral pulse.'),
      metric('mucosa', 'Rosa', undefined, 'La hipersalivacion o cianosis son alarmas.', 'Hypersalivation or cyanosis are warning signs.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '8-12 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Ovulacion inducida; receptividad recurrente'),
      fact('Gestacion', 'Gestation', '31-32 dias'),
      fact('Camada', 'Litter size', '4-8 gazapos'),
    ],
    quickNotes: [
      { es: 'No ayunar como perro/gato; vigilar ileo y apetito.', en: 'Do not fast like dogs/cats; monitor appetite and ileus.' },
      { es: 'Temperatura, dolor y motilidad digestiva suelen ir de la mano.', en: 'Temperature, pain, and gut motility often move together.' },
    ],
  },
  {
    id: 'horse',
    name: { es: 'Caballo', en: 'Horse' },
    group: { es: 'Equidos', en: 'Equine' },
    accent: 'equine',
    metrics: [
      metric('temperature', '37.2-38.3', 'C', 'Adulto en reposo.', 'Resting adult.'),
      metric('heartRate', '28-40', 'lpm', 'El dolor abdominal puede elevarla pronto.', 'Abdominal pain can raise it early.'),
      metric('respiratoryRate', '10-24', 'rpm', 'Contar sin alterar al animal.', 'Count without disturbing the animal.'),
      metric('bloodPressure', '120 / 70', 'mmHg', 'Referencia en estacion; MAP objetivo aprox. >70.', 'Standing reference; MAP target approx. >70.'),
      metric('crt', '< 2', 's', 'Revisar mucosa oral y pulso digital.', 'Check oral mucosa and digital pulse.'),
      metric('mucosa', 'Rosa palido', undefined, 'Linea toxica o congestion orientan gravedad.', 'Toxic line or congestion suggest severity.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '25-30 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Poliestrica estacional; ciclo 19-23 dias'),
      fact('Gestacion', 'Gestation', '335-345 dias'),
      fact('Camada', 'Litter size', '1 potro'),
    ],
    quickNotes: [
      { es: 'En colico, FC, mucosas, TRC y lactato cambian la prioridad.', en: 'In colic, HR, mucosa, CRT, and lactate change priority.' },
      { es: 'Pulso digital aumentado sugiere vigilar laminitis.', en: 'Increased digital pulse suggests laminitis monitoring.' },
    ],
  },
  {
    id: 'cattle',
    name: { es: 'Bovino', en: 'Cattle' },
    group: { es: 'Rumiantes', en: 'Ruminants' },
    accent: 'bovine',
    metrics: [
      metric('temperature', '38.0-39.3', 'C', 'Adulto, rectal.', 'Adult, rectal.'),
      metric('heartRate', '48-84', 'lpm', 'Interpretar con edad, produccion y manejo.', 'Interpret with age, production, and handling.'),
      metric('respiratoryRate', '18-28', 'rpm', 'Calor, dolor y acidosis elevan la FR.', 'Heat, pain, and acidosis raise RR.'),
      metric('bloodPressure', '140 / 90', 'mmHg', 'Referencia orientativa; PANI no siempre rutinaria.', 'Indicative reference; NIBP is not always routine.'),
      metric('crt', '< 2', 's', 'Valorar hidratacion, extremidades y pulso.', 'Assess hydration, limbs, and pulse quality.'),
      metric('mucosa', 'Rosa', undefined, 'Palidez, congestion o ictericia orientan triaje.', 'Pallor, congestion, or icterus guide triage.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '15-20 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Poliestrica; ciclo 21 dias, celo 12-18 h'),
      fact('Gestacion', 'Gestation', '279-287 dias'),
      fact('Camada', 'Litter size', '1 ternero'),
    ],
    quickNotes: [
      { es: 'Anade motilidad ruminal, llenado ruminal y produccion de leche.', en: 'Add rumen motility, rumen fill, and milk yield.' },
      { es: 'En granja, compara con lote, temperatura ambiental y manejo reciente.', en: 'On farm, compare with herd, weather, and recent handling.' },
    ],
  },
  {
    id: 'pig',
    name: { es: 'Cerdo', en: 'Pig' },
    group: { es: 'Porcino', en: 'Porcine' },
    accent: 'porcine',
    metrics: [
      metric('temperature', '38.7-39.8', 'C', 'Adulto, rectal.', 'Adult, rectal.'),
      metric('heartRate', '60-90', 'lpm', 'El manejo puede elevarla rapidamente.', 'Handling can raise it quickly.'),
      metric('respiratoryRate', '8-18', 'rpm', 'Observar antes de sujetar.', 'Observe before restraint.'),
      metric('bloodPressure', '150 / 100', 'mmHg', 'Referencia orientativa en adulto.', 'Indicative adult reference.'),
      metric('crt', '< 2', 's', 'Valorar color, perfusion y temperatura periferica.', 'Assess color, perfusion, and peripheral temperature.'),
      metric('mucosa', 'Rosa', undefined, 'Cianosis o disnea requieren prioridad.', 'Cyanosis or dyspnea require priority.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-15 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Poliestrica; ciclo 21 dias, celo 2-3 dias'),
      fact('Gestacion', 'Gestation', '114 dias'),
      fact('Camada', 'Litter size', '8-14 lechones'),
    ],
    quickNotes: [
      { es: 'El calor y el transporte alteran rapido FR y temperatura.', en: 'Heat and transport quickly alter RR and temperature.' },
      { es: 'En granja, compara con el lote y con animales centinela.', en: 'On farm, compare with the group and sentinel animals.' },
    ],
  },
  {
    id: 'sheep',
    name: { es: 'Oveja', en: 'Sheep' },
    group: { es: 'Rumiantes pequenos', en: 'Small ruminants' },
    accent: 'ruminant',
    metrics: [
      metric('temperature', '38.3-39.9', 'C', 'Adulto, rectal.', 'Adult, rectal.'),
      metric('heartRate', '70-80', 'lpm', 'Aumenta con estres, dolor o toxemia.', 'Increases with stress, pain, or toxemia.'),
      metric('respiratoryRate', '10-30', 'rpm', 'Calor y manejo elevan la FR.', 'Heat and handling raise RR.'),
      metric('bloodPressure', '120 / 70', 'mmHg', 'Referencia orientativa en adulto.', 'Indicative adult reference.'),
      metric('crt', '< 2', 's', 'Combinar con hidratacion y extremidades.', 'Combine with hydration and limb temperature.'),
      metric('mucosa', 'Rosa', undefined, 'Comprobar anemia con FAMACHA si procede.', 'Check anemia with FAMACHA when relevant.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-12 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional; ciclo 16-17 dias, celo 24-36 h'),
      fact('Gestacion', 'Gestation', '145-150 dias'),
      fact('Camada', 'Litter size', '1-3 corderos'),
    ],
    quickNotes: [
      { es: 'En rumiantes, anade motilidad ruminal y llenado ruminal.', en: 'In ruminants, add rumen motility and fill.' },
      { es: 'La temperatura se interpreta con ambiente, lana y manejo reciente.', en: 'Interpret temperature with weather, fleece, and recent handling.' },
    ],
  },
  {
    id: 'goat',
    name: { es: 'Cabra', en: 'Goat' },
    group: { es: 'Rumiantes pequenos', en: 'Small ruminants' },
    accent: 'ruminant',
    metrics: [
      metric('temperature', '38.5-39.7', 'C', 'Adulto, rectal.', 'Adult, rectal.'),
      metric('heartRate', '70-80', 'lpm', 'Puede subir mucho durante contencion.', 'Can rise markedly during restraint.'),
      metric('respiratoryRate', '10-30', 'rpm', 'Valorar tras unos minutos de calma.', 'Assess after a few calm minutes.'),
      metric('bloodPressure', '110-140 / 70-90', 'mmHg', 'PANI orientativa; repetir lecturas.', 'Indicative NIBP; repeat readings.'),
      metric('crt', '< 2', 's', 'Revisar hidratacion y perfusion distal.', 'Check hydration and distal perfusion.'),
      metric('mucosa', 'Rosa', undefined, 'Palidez: valorar parasitosis/anemia.', 'Pallor: assess parasites/anemia.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-15 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional; ciclo 21 dias, celo 24-48 h'),
      fact('Gestacion', 'Gestation', '150 dias'),
      fact('Camada', 'Litter size', '1-3 cabritos'),
    ],
    quickNotes: [
      { es: 'El estres de manejo altera FC, FR y PANI con facilidad.', en: 'Handling stress easily alters HR, RR, and NIBP.' },
      { es: 'Combina constantes con apetito, rumia y actitud del lote.', en: 'Combine vitals with appetite, rumination, and herd attitude.' },
    ],
  },
  {
    id: 'ferret',
    name: { es: 'Huron', en: 'Ferret' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '37.8-39.4', 'C', 'Rango interno medio.', 'Average internal range.'),
      metric('heartRate', '200-250', 'lpm', 'Auscultar rapido antes de estresar.', 'Auscultate quickly before stress rises.'),
      metric('respiratoryRate', '30-40', 'rpm', 'Observar patron y esfuerzo.', 'Observe pattern and effort.'),
      metric('bloodPressure', '90-130', 'mmHg sistolica', 'PANI orientativa si el paciente lo permite.', 'Indicative NIBP when tolerated.'),
      metric('crt', '< 2', 's', 'Valorar con mucosa oral y pulso.', 'Assess with oral mucosa and pulse.'),
      metric('mucosa', 'Rosa humeda', undefined, 'Palidez o melena cambian prioridad.', 'Pallor or melena changes priority.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '6-10 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Poliestrica estacional; ovulacion inducida'),
      fact('Gestacion', 'Gestation', '41-42 dias'),
      fact('Camada', 'Litter size', '6-8 crias'),
    ],
    quickNotes: [
      { es: 'Revisar glucemia si hay debilidad, colapso o salivacion.', en: 'Check glucose with weakness, collapse, or salivation.' },
      { es: 'El manejo suave reduce falsos aumentos de FC y FR.', en: 'Gentle handling reduces false HR and RR increases.' },
    ],
  },
  {
    id: 'guinea-pig',
    name: { es: 'Cobaya', en: 'Guinea pig' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '37.5-39.5', 'C', 'Adulto, referencia Merck.', 'Adult, Merck reference.'),
      metric('heartRate', '230-380', 'lpm', 'Contar pronto tras sacar de la jaula.', 'Count soon after removal from the cage.'),
      metric('respiratoryRate', '40-100', 'rpm', 'Tambien se citan rangos mas altos en estres.', 'Higher ranges are also cited with stress.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Priorizar perfusion, hidratacion y actitud.', 'Prioritize perfusion, hydration, and attitude.'),
      metric('crt', '< 2', 's', 'Util si la contencion permite verlo.', 'Useful if restraint allows assessment.'),
      metric('mucosa', 'Rosa', undefined, 'Vigilar sialorrea y perdida de peso.', 'Watch for drooling and weight loss.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '5-8 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', '13-25 dias'),
      fact('Gestacion', 'Gestation', '59-72 dias'),
      fact('Camada', 'Litter size', '1-7 crias, habitual 3'),
    ],
    quickNotes: smallMammalExamNotes,
  },
  {
    id: 'chinchilla',
    name: { es: 'Chinchilla', en: 'Chinchilla' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '37.0-38.0', 'C', 'Evitar sobrecalentamiento durante manejo.', 'Avoid overheating during handling.'),
      metric('heartRate', '100-150', 'lpm', 'Puede aumentar mucho por estres.', 'Can rise markedly with stress.'),
      metric('respiratoryRate', '40-80', 'rpm', 'Observar antes de sujetar.', 'Observe before restraint.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Usar perfusion y estado general.', 'Use perfusion and general status.'),
      metric('crt', '< 2', 's', 'Orientativo si se visualiza bien.', 'Indicative if visible.'),
      metric('mucosa', 'Rosa', undefined, 'Vigilar calor, dolor dental y anorexia.', 'Watch heat, dental pain, and anorexia.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-15 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', '30-50 dias'),
      fact('Gestacion', 'Gestation', '111 dias'),
      fact('Camada', 'Litter size', '1-3 crias'),
    ],
    quickNotes: smallMammalExamNotes,
  },
  {
    id: 'hamster',
    name: { es: 'Hamster', en: 'Hamster' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '36.1-38.3', 'C', 'Muy sensible a ambiente y torpor.', 'Very sensitive to environment and torpor.'),
      metric('heartRate', '280-412', 'lpm', 'Rango alto normal en reposo.', 'High resting range is normal.'),
      metric('respiratoryRate', '36-127', 'rpm', 'Contar observando sin sujetar.', 'Count by observing without restraint.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Valorar color, temperatura y actividad.', 'Assess color, temperature, and activity.'),
      metric('crt', '< 2', 's', 'Dificil de medir; orientativo.', 'Difficult to measure; indicative only.'),
      metric('mucosa', 'Rosa', undefined, 'La hipotermia o letargia requieren prioridad.', 'Hypothermia or lethargy need priority.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '1.5-3 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', '4 dias'),
      fact('Gestacion', 'Gestation', '16-18 dias'),
      fact('Camada', 'Litter size', '6-10 crias'),
    ],
    quickNotes: smallMammalExamNotes,
  },
  {
    id: 'tortoise',
    name: { es: 'Tortuga', en: 'Tortoise / turtle' },
    group: { es: 'Reptiles', en: 'Reptiles' },
    accent: 'reptile',
    metrics: [
      metric('temperature', 'Ectotermo', undefined, 'Depende de especie y gradiente termico.', 'Depends on species and thermal gradient.'),
      metric('heartRate', '10-40', 'lpm', 'Muy variable por temperatura y apnea.', 'Highly variable with temperature and apnea.'),
      metric('respiratoryRate', '2-12', 'rpm', 'Patron intermitente normal en reposo.', 'Intermittent pattern can be normal at rest.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Usar perfusion, hidratacion y tono.', 'Use perfusion, hydration, and tone.'),
      metric('crt', 'Variable', undefined, 'No extrapolar como mamifero.', 'Do not extrapolate as in mammals.'),
      metric('mucosa', 'Rosa palido', undefined, 'Mucosas secas sugieren deshidratacion.', 'Dry mucosa suggests dehydration.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '30-80 anos segun especie'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional, dependiente de fotoperiodo'),
      fact('Incubacion', 'Incubation', '60-120 dias'),
      fact('Puesta', 'Clutch size', '2-12 huevos'),
    ],
    quickNotes: reptileExamNotes,
  },
  {
    id: 'bearded-dragon',
    name: { es: 'Pogona', en: 'Bearded dragon' },
    group: { es: 'Reptiles', en: 'Reptiles' },
    accent: 'reptile',
    metrics: [
      metric('temperature', 'Ectotermo', undefined, 'Medir ambiente, zona fria y asoleo.', 'Measure ambient, cool zone, and basking zone.'),
      metric('heartRate', '40-80', 'lpm', 'Variable por temperatura y manipulacion.', 'Variable with temperature and handling.'),
      metric('respiratoryRate', '6-30', 'rpm', 'Boca abierta puede ser termorregulacion o disnea.', 'Open mouth can be thermoregulation or dyspnea.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Priorizar perfusion y estado neurologico.', 'Prioritize perfusion and neurologic status.'),
      metric('crt', 'Variable', undefined, 'Interpretar con hidratacion y temperatura.', 'Interpret with hydration and temperature.'),
      metric('mucosa', 'Rosa palido', undefined, 'Mucosa pegajosa orienta deshidratacion.', 'Tacky mucosa suggests dehydration.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '8-12 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional, dependiente de luz y temperatura'),
      fact('Incubacion', 'Incubation', '55-75 dias'),
      fact('Puesta', 'Clutch size', '10-30 huevos'),
    ],
    quickNotes: reptileExamNotes,
  },
  {
    id: 'gecko',
    name: { es: 'Gecko', en: 'Gecko' },
    group: { es: 'Reptiles', en: 'Reptiles' },
    accent: 'reptile',
    metrics: [
      metric('temperature', 'Ectotermo', undefined, 'Usar rango optimo de la especie.', 'Use the species preferred optimal range.'),
      metric('heartRate', '30-80', 'lpm', 'Variable por temperatura.', 'Temperature dependent.'),
      metric('respiratoryRate', '6-25', 'rpm', 'Observar sin manipular.', 'Observe without handling.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'No util como cribado habitual.', 'Not useful as routine screening.'),
      metric('crt', 'Variable', undefined, 'Mejor valorar hidratacion y tono.', 'Better assess hydration and tone.'),
      metric('mucosa', 'Rosa palido', undefined, 'Vigilar mudas retenidas y deshidratacion.', 'Watch retained sheds and dehydration.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-20 anos segun especie'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional o dependiente de manejo'),
      fact('Incubacion', 'Incubation', '35-90 dias'),
      fact('Puesta', 'Clutch size', '1-2 huevos por puesta'),
    ],
    quickNotes: reptileExamNotes,
  },
  {
    id: 'sugar-glider',
    name: { es: 'Petauro', en: 'Sugar glider' },
    group: { es: 'Exoticos', en: 'Exotics' },
    accent: 'exotic',
    metrics: [
      metric('temperature', '35.8-36.6', 'C', 'Marsupial pequeno; evitar enfriamiento.', 'Small marsupial; avoid chilling.'),
      metric('heartRate', '200-300', 'lpm', 'Auscultacion breve y suave.', 'Brief, gentle auscultation.'),
      metric('respiratoryRate', '16-40', 'rpm', 'Observar antes de sujetar.', 'Observe before restraint.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Usar perfusion, tono y actividad.', 'Use perfusion, tone, and activity.'),
      metric('crt', '< 2', 's', 'Orientativo si se visualiza bien.', 'Indicative if visible.'),
      metric('mucosa', 'Rosa', undefined, 'Vigilar deshidratacion y caquexia.', 'Watch dehydration and cachexia.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-12 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', '29 dias aprox.'),
      fact('Gestacion', 'Gestation', '15-17 dias + bolsa'),
      fact('Camada', 'Litter size', '1-2 crias'),
    ],
    quickNotes: smallMammalExamNotes,
  },
  {
    id: 'budgerigar',
    name: { es: 'Periquito', en: 'Budgerigar' },
    group: { es: 'Aves', en: 'Birds' },
    accent: 'avian',
    metrics: [
      metric('temperature', '40.5-42.0', 'C', 'Las aves pequenas tienen temperatura alta.', 'Small birds have high body temperature.'),
      metric('heartRate', '250-500', 'lpm', 'Muy dificil sin monitorizacion adecuada.', 'Hard to assess without proper monitoring.'),
      metric('respiratoryRate', '60-100', 'rpm', 'Cola oscilante o esfuerzo son alarma.', 'Tail bobbing or effort is a warning sign.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Priorizar respiracion y perfusion.', 'Prioritize breathing and perfusion.'),
      metric('crt', 'No fiable', undefined, 'No usar como unico marcador.', 'Do not use as a sole marker.'),
      metric('mucosa', 'Rosa', undefined, 'Cianosis o disnea requieren oxigeno.', 'Cyanosis or dyspnea need oxygen.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '5-10 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Reproductor oportunista/estacional'),
      fact('Incubacion', 'Incubation', '18 dias'),
      fact('Puesta', 'Clutch size', '4-6 huevos'),
    ],
    quickNotes: avianExamNotes,
  },
  {
    id: 'canary',
    name: { es: 'Canario', en: 'Canary' },
    group: { es: 'Aves', en: 'Birds' },
    accent: 'avian',
    metrics: [
      metric('temperature', '40.5-42.0', 'C', 'Orientativa en paseriformes pequenos.', 'Indicative for small passerines.'),
      metric('heartRate', '300-600', 'lpm', 'Ritmo muy rapido; minimizar contencion.', 'Very rapid rhythm; minimize restraint.'),
      metric('respiratoryRate', '70-120', 'rpm', 'Observar cola y esfuerzo respiratorio.', 'Observe tail motion and respiratory effort.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'No habitual en consulta general.', 'Not routine in general practice.'),
      metric('crt', 'No fiable', undefined, 'Valorar color, postura y respuesta.', 'Assess color, posture, and response.'),
      metric('mucosa', 'Rosa', undefined, 'Respiracion con pico abierto es alarma.', 'Open-mouth breathing is a warning sign.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '8-12 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional por fotoperiodo'),
      fact('Incubacion', 'Incubation', '13-14 dias'),
      fact('Puesta', 'Clutch size', '3-5 huevos'),
    ],
    quickNotes: avianExamNotes,
  },
  {
    id: 'parrots-lories',
    name: { es: 'Loridos y loros', en: 'Parrots and lories' },
    group: { es: 'Aves', en: 'Birds' },
    accent: 'avian',
    metrics: [
      metric('temperature', '40.0-42.0', 'C', 'Variable por especie y tamano.', 'Varies by species and size.'),
      metric('heartRate', '180-450', 'lpm', 'Menor en especies grandes.', 'Lower in large species.'),
      metric('respiratoryRate', '20-60', 'rpm', 'Aumenta con estres, calor o disnea.', 'Increases with stress, heat, or dyspnea.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Monitorizar si anestesia o UCI.', 'Monitor during anesthesia or ICU care.'),
      metric('crt', 'No fiable', undefined, 'Usar perfusion, color y temperatura distal.', 'Use perfusion, color, and distal temperature.'),
      metric('mucosa', 'Rosa', undefined, 'Cianosis es tardia y grave.', 'Cyanosis is late and serious.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '15-60 anos segun especie'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional u oportunista'),
      fact('Incubacion', 'Incubation', '18-30 dias'),
      fact('Puesta', 'Clutch size', '2-5 huevos'),
    ],
    quickNotes: avianExamNotes,
  },
  {
    id: 'iguana',
    name: { es: 'Iguana', en: 'Iguana' },
    group: { es: 'Reptiles', en: 'Reptiles' },
    accent: 'reptile',
    metrics: [
      metric('temperature', 'Ectotermo', undefined, 'Depende de gradiente y especie.', 'Depends on gradient and species.'),
      metric('heartRate', '30-80', 'lpm', 'Muy dependiente de temperatura corporal.', 'Highly dependent on body temperature.'),
      metric('respiratoryRate', '4-20', 'rpm', 'Patron lento; valorar esfuerzo.', 'Slow pattern; assess effort.'),
      metric('bloodPressure', 'No rutinaria', undefined, 'Poco practica en consulta general.', 'Rarely practical in general practice.'),
      metric('crt', 'Variable', undefined, 'Interpretar con hidratacion y calor.', 'Interpret with hydration and heat.'),
      metric('mucosa', 'Rosa palido', undefined, 'Mucosa pegajosa sugiere deshidratacion.', 'Tacky mucosa suggests dehydration.'),
    ],
    reproductive: [
      fact('Esperanza de vida', 'Life expectancy', '10-20 anos'),
      fact('Ciclo/celo', 'Cycle/estrus', 'Estacional, dependiente de fotoperiodo'),
      fact('Incubacion', 'Incubation', '65-90 dias'),
      fact('Puesta', 'Clutch size', '20-40 huevos'),
    ],
    quickNotes: reptileExamNotes,
  },
];

const sources = [
  { label: 'Merck temperatura', url: 'https://www.merckvetmanual.com/multimedia/table/normal-rectal-temperature-ranges' },
  { label: 'Merck FC', url: 'https://www.merckvetmanual.com/reference-values-and-conversion-tables/reference-guides/resting-heart-rates' },
  { label: 'Merck reproduccion', url: 'https://www.merckvetmanual.com/reproductive-system/reproductive-system-introduction/the-reproductive-system-in-animals' },
  { label: 'Merck cobayas', url: 'https://www.merckvetmanual.com/all-other-pets/guinea-pigs/introduction-to-guinea-pigs' },
  { label: 'Merck hurones', url: 'https://www.merckvetmanual.com/multimedia/table/ferrets-at-a-glance' },
];

export default function VitalConstantsToolkit({ lang }: { lang: Language }) {
  const [activeSpeciesId, setActiveSpeciesId] = useState(speciesConstants[0].id);
  const activeSpecies = useMemo(
    () => speciesConstants.find((item) => item.id === activeSpeciesId) ?? speciesConstants[0],
    [activeSpeciesId],
  );

  return (
    <section className="toolkit-utility vital-constants-toolkit">
      <div className="toolkit-utility-header vital-constants-header">
        <div>
          <p className="section-kicker">{lang === 'es' ? 'Constantes por especie' : 'Species constants'}</p>
          <h3>{lang === 'es' ? 'Constantes vitales basicas' : 'Basic vital constants'}</h3>
          <p>
            {lang === 'es'
              ? 'Rangos orientativos para adultos en reposo, con reproduccion y senales rapidas de exploracion.'
              : 'Indicative adult resting ranges, with reproduction and quick exam cues.'}
          </p>
        </div>
        <div className="toolkit-utility-note vital-constants-note">
          <strong>{lang === 'es' ? 'Gratis' : 'Free'}</strong>
          <p>
            {lang === 'es'
              ? 'Todas las especies visibles tienen ficha cargada. Elige una para ver solo sus constantes.'
              : 'Every visible species has a loaded sheet. Choose one to view its constants.'}
          </p>
        </div>
      </div>

      <div className="vital-species-toolbar" aria-label={lang === 'es' ? 'Especies con constantes' : 'Species with constants'}>
        {speciesConstants.map((species) => (
          <button
            key={species.id}
            type="button"
            className={`vital-species-button is-available ${activeSpecies.id === species.id ? 'is-active' : ''}`}
            onClick={() => setActiveSpeciesId(species.id)}
          >
            <span>{species.name[lang]}</span>
            <small>{species.group[lang]}</small>
          </button>
        ))}
      </div>

      <section className={`vital-species-panel tone-${activeSpecies.accent}`}>
        <div className="vital-species-title">
          <div>
            <span>{activeSpecies.group[lang]}</span>
            <h4>{activeSpecies.name[lang]}</h4>
          </div>
          <strong>{lang === 'es' ? 'Ficha activa' : 'Active sheet'}</strong>
        </div>

        <div className="vital-metric-grid">
          {activeSpecies.metrics.map((item) => (
            <article key={item.key} className={`vital-metric vital-metric-${item.key}`}>
              <span>{item.label[lang]}</span>
              <strong>{item.value}</strong>
              {item.unit ? <small>{item.unit}</small> : null}
              <p>{item.note[lang]}</p>
            </article>
          ))}
        </div>

        <div className="vital-detail-grid">
          <section className="vital-detail-block">
            <h5>{lang === 'es' ? 'Vida y reproduccion' : 'Life and reproduction'}</h5>
            <div className="vital-fact-list">
              {activeSpecies.reproductive.map((item) => (
                <div key={item.label.es} className="vital-fact-row">
                  <span>{item.label[lang]}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="vital-detail-block">
            <h5>{lang === 'es' ? 'Lectura clinica rapida' : 'Quick clinical read'}</h5>
            <ul className="vital-note-list">
              {activeSpecies.quickNotes.map((item) => (
                <li key={item.es}>{item[lang]}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <article className="toolkit-source-note vital-source-note">
        <strong>{lang === 'es' ? 'Nota de uso' : 'Use note'}</strong>
        <p>
          {lang === 'es'
            ? 'Rangos de cribado: interpretar por edad, raza, tamano, ambiente, manejo, dolor y tendencia individual.'
            : 'Screening ranges: interpret by age, breed, size, environment, handling, pain, and individual trend.'}
        </p>
        <div className="vital-source-links">
          {sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}
