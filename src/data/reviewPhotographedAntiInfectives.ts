import { DoseCalculatorEntry, LocalizedText } from '../types';

// The supplied photographs show the title and page numbers, but not authors,
// edition or publication year. Do not invent the missing bibliographic details.
const photographedPages: Record<string, string> = {
  Amoxicilina: '31', 'Amoxicilina + ácido clavulánico': '31–32', Ampicilina: '32',
  Bencilpenicilina: '32–33', 'Bencilpenicilina-procaína': '33', Cefadroxilo: '33', Cefalexina: '33–34',
  Cefazolina: '34', Cefotaxima: '34', Cefovecina: '34', 'Imipenem-cilastatina': '35', Meropenem: '35',
  Amikacina: '35', Estreptomicina: '35–36', Gentamicina: '36', Neomicina: '36', Paromomicina: '36',
  Tobramicina: '37', Doxiciclina: '37', Minociclina: '38', Tetraciclina: '38', Azitromicina: '38–39',
  Claritromicina: '39', Eritromicina: '39', Tilosina: '39', Clindamicina: '40', Lincomicina: '40',
  'Trimetoprim o sulfamida o combinación': '41', Enrofloxacino: '41–42', Marbofloxacino: '42–43',
  Pradofloxacino: '43', Metronidazol: '43–44', Ronidazol: '44', 'Amfotericina B': '44',
  Fluconazol: '45', Itraconazol: '45', Ketoconazol: '46', Posaconazol: '46', Terbinafina: '46',
  Voriconazol: '46', Famciclovir: '47', Remdesivir: '47', Zidovudina: '47',
  'Antitoxina tetánica': '47', 'Inmunoglobulina humana': '47',
};

const ref = {
  respiratory: 'ISCAID respiratory antimicrobial guidelines (2017), drug table: https://doi.org/10.1111/jvim.14627',
  urinary: 'ISCAID urinary tract infection guidelines (2019), drug table: https://doi.org/10.1016/j.tvjl.2019.02.008',
  skin: 'ISCAID canine pyoderma guidelines (2025): https://doi.org/10.1111/vde.13342',
  diarrhea: 'ENOVAT/WSAVA canine acute diarrhoea antimicrobial guidelines (2024): https://wsava.org/wp-content/uploads/2024/09/ENOVAT-GUIDELINES-FOR-ANTIMICROBIAL-USE-IN-CANINE-ACUTE-DIARRHEA.pdf',
  lepto: 'ACVIM canine leptospirosis consensus (2023): https://doi.org/10.1111/jvim.16903',
  malassezia: 'World Association for Veterinary Dermatology Malassezia consensus (2020): https://doi.org/10.1111/vde.12809',
  dermatophytes: 'ABCD feline dermatophytosis guidelines (2013): https://pmc.ncbi.nlm.nih.gov/articles/PMC11148949/',
  fip: 'ABCD update on feline infectious peritonitis treatment (2026): https://pmc.ncbi.nlm.nih.gov/articles/PMC13120026/',
  herpes: 'ABCD feline herpesvirus guideline (2013): https://pmc.ncbi.nlm.nih.gov/articles/PMC11148955/',
  catTetanus: 'Feline tetanus, retrospective study (2024): https://doi.org/10.3389/fvets.2024.1425917',
  enrofloxacin: 'EMA, Baytril injectable product information: https://www.ema.europa.eu/en/documents/referral/baytril-25-injectable-baytril-5-injectable-and-baytril-10-injectable-and-their-associated-names-annex-i-ii-iii_en.pdf',
  pradofloxacin: 'European Commission, Veraflox product information: https://ec.europa.eu/health/documents/community-register/2023/20231130161122/anx_161122_en.pdf',
  ameg: 'EMA veterinary antimicrobial categorisation (2024 surveillance): https://www.ema.europa.eu/en/documents/report/european-sales-use-antimicrobials-veterinary-medicine-annual-surveillance-report-2024_en.pdf',
  papilloma: 'Yagci et al. canine papillomatosis trial (2008): https://pubmed.ncbi.nlm.nih.gov/18494759/; review (2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC11728566/',
  cryptosporidium: 'ESCCAP, control of intestinal protozoa (2024): https://www.esccap.org/uploads/docs/5hk9fztt_0701_ESCCAP_Guideline_GL6_v8_1p.pdf',
  haemoplasma: 'ABCD feline haemoplasmosis guideline (updated 2026): https://www.abcdcatsvets.org/guideline-for-haemoplasmosis-in-cats/',
  cryptococcus: 'ABCD feline cryptococcosis guideline: https://www.abcdcatsvets.org/guideline-for-cryptococcosis-in-cats/',
  felineFungal: 'Invasive fungal infections and oomycoses in cats: antifungal therapy (2024): https://pmc.ncbi.nlm.nih.gov/articles/PMC10949877/',
  felv: 'ABCD feline leukaemia virus guideline: https://www.abcdcatsvets.org/guideline-for-feline-leukaemia-virus-infection/',
  brucella: 'CDC, veterinary guidance for brucellosis (2024): https://www.cdc.gov/brucellosis/hcp/animals/index.html',
  marbofloxacin: 'Marbocyl P, veterinary product information (2025): https://www.vmd.defra.gov.uk/ProductInformationDatabase/files/QRD_Documents/QRD-Auth_3060499.PDF',
};
const loc = (es: string, en: string): LocalizedText => ({ es, en });
const sourcePhase = loc('Libro fotografiado · comprobar pauta y ficha', 'Photographed book · verify regimen and product label');
const reviewPhase = loc('Discrepancia clínica · revisar antes de usar', 'Clinical discrepancy · review before use');
const unavailable = { min: Number.NaN, max: Number.NaN };
const pages = (entry: DoseCalculatorEntry) => photographedPages[entry.activeIngredient];
const photographed = (entry: DoseCalculatorEntry) => Boolean(pages(entry)) &&
  (entry.category.es === 'Antiinfecciosos Sistémicos' || (entry.category.es === 'Dermatología' && ['Ketoconazol', 'Terbinafina'].includes(entry.activeIngredient)));

// A citation labelled clinical context is not represented as proof of the exact
// historical book dose, a particular formulation, or every grouped indication.
function clinicalContext(entry: DoseCalculatorEntry): string[] {
  const indication = entry.indication.es.toLowerCase();
  const refs: string[] = [];
  if (indication.includes('diarrea aguda')) refs.push(ref.diarrhea);
  if (indication.includes('criptosporidiosis')) refs.push(ref.cryptosporidium);
  if (indication.includes('hemoplasmosis')) refs.push(ref.haemoplasma);
  if (indication.includes('criptococosis')) refs.push(ref.cryptococcus);
  if (indication.includes('aspergilosis') && ['Fluconazol', 'Itraconazol', 'Posaconazol', 'Voriconazol', 'Terbinafina', 'Ketoconazol'].includes(entry.activeIngredient)) refs.push(ref.felineFungal);
  if (indication.includes('brucelosis')) refs.push(ref.brucella);
  if (entry.activeIngredient === 'Zidovudina') refs.push(ref.felv);
  if (indication.includes('leptospirosis') && entry.activeIngredient === 'Doxiciclina') refs.push(ref.lepto);
  if ((indication.includes('respiratoria') || indication.includes('neumonía')) && ['Cefalexina', 'Minociclina', 'Doxiciclina', 'Gentamicina', 'Imipenem-cilastatina', 'Meropenem', 'Marbofloxacino'].includes(entry.activeIngredient)) refs.push(ref.respiratory);
  if (entry.activeIngredient === 'Marbofloxacino') refs.push(ref.marbofloxacin);
  if (indication.includes('tracto urinario') && ['Amoxicilina', 'Amoxicilina + ácido clavulánico'].includes(entry.activeIngredient)) refs.push(ref.urinary);
  if (indication.includes('pioderma')) refs.push(ref.skin);
  if (indication.includes('malassezia') && ['Itraconazol', 'Ketoconazol', 'Terbinafina', 'Fluconazol'].includes(entry.activeIngredient)) refs.push(ref.malassezia);
  if (indication.includes('dermatofitosis') && ['Itraconazol', 'Terbinafina'].includes(entry.activeIngredient)) refs.push(ref.dermatophytes);
  if (entry.activeIngredient === 'Remdesivir') refs.push(ref.fip);
  if (entry.activeIngredient === 'Famciclovir') refs.push(ref.herpes);
  if (entry.activeIngredient === 'Enrofloxacino') refs.push(ref.enrofloxacin);
  if (entry.activeIngredient === 'Pradofloxacino') refs.push(ref.pradofloxacin);
  if (entry.antibioticCategory === 'A' || entry.antibioticCategory === 'B') refs.push(ref.ameg);
  if (entry.activeIngredient === 'Metronidazol' && entry.species.includes('Cat') && indication === 'tétanos') refs.push(ref.catTetanus);
  if (entry.activeIngredient === 'Azitromicina' && indication === 'papilomatosis') refs.push(ref.papilloma);
  return refs;
}

function attachSources(entry: DoseCalculatorEntry): DoseCalculatorEntry {
  const contexts = clinicalContext(entry);
  const source = `Guía terapéutica del animal de compañía, p. ${pages(entry)}. Fotografías aportadas; autores, edición y año no visibles. Photographs supplied; authors, edition and year not visible.`;
  return { ...entry, dosePhase: entry.dosePhase ?? sourcePhase,
    bibliography: [entry.bibliography, source, ...contexts.map((item) => `Contexto clínico / clinical context (no valida todas las indicaciones ni la dosis exacta): ${item}`)].filter(Boolean).join('\n') };
}

function notes(entry: DoseCalculatorEntry, es: string, en: string, phase = reviewPhase): DoseCalculatorEntry {
  return { ...entry, dosePhase: phase, clinicalNotes: loc(`${es}${entry.observations ? ` Libro: ${entry.observations}` : ''}`, en) };
}
function disable(entry: DoseCalculatorEntry): DoseCalculatorEntry {
  return { ...entry, doseRangeMgKg: unavailable, defaultDoseMgKg: Number.NaN };
}

function review(entry: DoseCalculatorEntry): DoseCalculatorEntry[] {
  if (!photographed(entry)) return [entry];
  const drug = entry.activeIngredient;
  const indication = entry.indication.es;
  let item = attachSources(entry);

  // The photograph gives two alternatives with different units. Keeping both
  // numbers in one numeric mg/kg range would make 50 mg/kg selectable.
  if (drug === 'Minociclina' && entry.speciesLabel === 'Gato' && indication === 'Infecciones respiratorias') {
    const common = { ...item, doseText: undefined, observations: undefined };
    const warning = loc('Alternativas distintas · 50 mg por gato estudiados en gatos de ~5 kg', 'Different alternatives · 50 mg per cat studied in cats of ~5 kg');
    return [
      notes({ ...common, id: `${entry.id}-weight`, doseUnit: 'mg/kg', doseRangeMgKg: { min: 8.8, max: 8.8 }, defaultDoseMgKg: 8.8 }, 'Pauta por peso. La alternativa de 50 mg es dosis fija, no mg/kg. Evaluar tamaño y formulación.', 'Weight-based regimen. The alternative 50 mg is a fixed dose, not mg/kg. Assess body size and formulation.', warning),
      notes({ ...common, id: `${entry.id}-fixed`, doseUnit: 'mg', doseRangeMgKg: { min: 50, max: 50 }, defaultDoseMgKg: 50 }, 'Dosis fija por gato, no por kg. El estudio farmacocinético empleó gatos de aproximadamente 5 kg; valorar adecuación individual.', 'Fixed dose per cat, not per kg. The pharmacokinetic study used cats of approximately 5 kg; assess suitability individually.', warning),
    ];
  }
  // Keep the historical canine range separate from the labelled feline ceiling.
  if (drug === 'Enrofloxacino' && entry.species.includes('Dog') && entry.species.includes('Cat')) {
    return (['Dog', 'Cat'] as const).map((species) => {
      let part: DoseCalculatorEntry = { ...item, id: `${entry.id}-${species.toLowerCase()}`, species: [species], speciesLabel: species === 'Dog' ? 'Perro' : 'Gato' };
      if (species === 'Cat') {
        if (indication === 'Infecciones respiratorias') part = { ...part, doseText: '5', doseRangeMgKg: { min: 5, max: 5 }, defaultDoseMgKg: 5 };
        // Remove legacy alternatives of 20 mg/kg which apply only to dogs.
        if (indication === 'Otitis intensa' || indication.startsWith('Piodermas')) part = { ...part, observations: undefined };
        return notes(part, 'Gato: no superar 5 mg/kg al día; daño retiniano y ceguera pueden ocurrir incluso a dosis menores. La pauta de 20 mg/kg de la fotografía no es aplicable a gatos. Categoría AMEG B; valorar cultivo y alternativas.', 'Cat: do not exceed 5 mg/kg/day; retinal injury and blindness can occur even at lower doses. The 20 mg/kg photographed regimen does not apply to cats. AMEG B; assess culture and alternatives.', loc('Gato · máximo 5 mg/kg/día · riesgo retinal', 'Cat · maximum 5 mg/kg/day · retinal risk'));
      }
      return notes(part, 'Perro: la dosis de 20 mg/kg debe individualizarse según diagnóstico y sensibilidad. Categoría AMEG B; reservar cuando alternativas adecuadas no sean eficaces.', 'Dog: individualise any 20 mg/kg regimen to diagnosis and susceptibility. AMEG B; reserve for cases without effective appropriate alternatives.', loc('Perro · AMEG B · uso restringido', 'Dog · AMEG B · restricted use'));
    });
  }
  if (drug === 'Enrofloxacino' && entry.species.includes('Cat')) {
    item = notes(item, 'Gato: no superar 5 mg/kg al día; existe riesgo de daño retinal incluso a dosis menores. Categoría AMEG B; valorar alternativas y sensibilidad.', 'Cat: do not exceed 5 mg/kg/day; retinal injury can occur even at lower doses. AMEG B; assess alternatives and susceptibility.', loc('Gato · máximo 5 mg/kg/día · riesgo retinal', 'Cat · maximum 5 mg/kg/day · retinal risk'));
  }
  if (drug === 'Metronidazol' && indication === 'Tétanos' && entry.species.includes('Cat')) {
    item = disable(notes(item, 'El libro indica 250 mg/gato; un estudio de 2024 describió 8–15 mg/kg cada 12 h. La dosis fija puede ser excesiva: confirmar con especialista antes de usar.', 'The book states 250 mg/cat; a 2024 study reported 8–15 mg/kg every 12 h. The fixed dose may be excessive: consult a specialist before use.'));
  }
  if (drug === 'Pradofloxacino' && indication === 'Infecciones respiratorias') {
    item = disable(notes(item, 'El libro indica comprimidos 5 mg/kg c12h; la ficha europea de Veraflox indica 3 mg/kg c24h para comprimidos y 5 mg/kg c24h para suspensión felina. La indicación y la formulación condicionan el uso; confirmar.', 'The book states tablets 5 mg/kg q12h; the European Veraflox label states tablets 3 mg/kg q24h and feline suspension 5 mg/kg q24h. Indication and formulation determine use; verify.'));
  }
  if (drug === 'Famciclovir') {
    item = disable(notes(item, 'El libro usa una dosis fija de 62,5–125 mg/gato; la guía ABCD describe 90 mg/kg c8h durante 21 días. Confirmar pauta y función renal; no convertir automáticamente.', 'The book uses a fixed 62.5–125 mg/cat; the ABCD guideline describes 90 mg/kg q8h for 21 days. Confirm regimen and renal function; do not convert automatically.'));
  }
  if (drug === 'Remdesivir') {
    item = notes(item, 'La pauta depende de afectación ocular o neurológica, formulación y respuesta. Consultar guía ABCD actual y normativa local; no confundir remdesivir con GS-441524.', 'Dose depends on ocular or neurological involvement, formulation and response. Consult current ABCD guidance and local rules; do not confuse remdesivir with GS-441524.', loc('PIF · pauta según forma clínica', 'FIP · regimen depends on clinical presentation'));
  }
  if (drug === 'Fluconazol' && indication === 'Aspergilosis') {
    item = disable(notes(item, 'El libro describe esta pauta, pero una revisión felina indica que fluconazol tiene baja actividad frente a muchos mohos y no debe emplearse salvo sensibilidad demostrada. Confirmar especie fúngica, localización y alternativas.', 'The book describes this regimen, but a feline review reports poor fluconazole activity against many moulds and advises against use unless susceptibility supports it. Confirm fungal species, site and alternatives.'));
  }
  if (drug === 'Zidovudina') {
    item = notes(item, 'La guía ABCD limita el beneficio demostrado en infecciones naturales por FeLV y describe toxicidad hematológica. Valorar indicación específica y vigilar hemograma, anemia y neutropenia.', 'The ABCD guideline notes limited demonstrated benefit in naturally occurring FeLV infection and haematological toxicity. Assess the specific indication and monitor blood counts, anaemia and neutropenia.', loc('FeLV · evidencia limitada · monitorizar hemograma', 'FeLV · limited evidence · monitor blood counts'));
  }
  if (indication.toLowerCase().includes('brucelosis')) {
    item = notes(item, 'Brucella canis es zoonótica y el tratamiento no garantiza eliminar la infección o la excreción. Valorar diagnóstico, bioseguridad y normativa aplicable con las autoridades competentes.', 'Brucella canis is zoonotic and treatment does not guarantee elimination of infection or shedding. Assess diagnosis, biosecurity and applicable rules with the competent authorities.', loc('Brucelosis · zoonosis · control especializado', 'Brucellosis · zoonosis · specialist management'));
  }
  if (drug === 'Doxiciclina' && indication === 'Leptospirosis') {
    item = { ...item, route: 'VO' };
    item = notes(item, 'El consenso ACVIM recomienda 5 mg/kg VO c12h durante 14 días. Si no tolera VO, usar un protocolo parenteral adecuado y pasar a doxiciclina oral cuando sea posible; la guía no avala convertir esta pauta automáticamente a IV.', 'ACVIM recommends 5 mg/kg PO q12h for 14 days. If PO is not tolerated, use an appropriate parenteral protocol and transition to oral doxycycline when possible; the guideline does not validate automatic IV conversion.', loc('Perro · consenso ACVIM · VO 14 días', 'Dog · ACVIM consensus · PO 14 days'));
  }
  if (drug === 'Cefazolina' && indication.startsWith('Colangitis')) item = { ...item, route: 'SC/IM/IV' };
  if (drug === 'Cefovecina' && indication.startsWith('Piodermas')) item = { ...item, species: ['Dog', 'Cat'], speciesLabel: 'Perro/Gato' };
  if (drug === 'Metronidazol' && indication === 'Diarrea aguda') item = { ...item, route: 'IV' };
  if (drug === 'Trimetoprim o sulfamida o combinación') {
    const isCoccidiosis = indication === 'Coccidiosis';
    item = notes(item,
      isCoccidiosis ? 'La dosis de la fotografía es de sulfadimetoxina sola, no de trimetoprim ni de una combinación. Confirmar principio activo, presentación y diagnóstico.' : 'La dosis de la fotografía corresponde a la suma de trimetoprim y sulfamida en la combinación; no corresponde a trimetoprim solo. Confirmar composición y concentración.',
      isCoccidiosis ? 'The photographed dose is for sulfadimethoxine alone, not trimethoprim or a combination. Verify active ingredient, formulation and diagnosis.' : 'The photographed dose refers to total trimethoprim plus sulfonamide in the combination, not trimethoprim alone. Verify composition and concentration.',
      loc(isCoccidiosis ? 'Sulfadimetoxina sola · verificar producto' : 'Dosis de la combinación · verificar producto', isCoccidiosis ? 'Sulfadimethoxine alone · verify product' : 'Combined drug dose · verify product'));
  }
  if (indication === 'Criptosporidiosis') {
    item = disable(notes(item, 'ESCCAP indica que la infección suele ser autolimitada y recomienda soporte; no hay tratamiento autorizado establecido para perros o gatos en esa guía. La pauta del libro requiere valoración individual y evidencia adicional.', 'ESCCAP notes that infection is often self-limiting and recommends supportive care; its guideline identifies no established authorised treatment for dogs or cats. The book regimen requires individual assessment and further evidence.'));
  }
  if (indication.toLowerCase().includes('diarrea aguda')) {
    item = notes(item, 'En perros con diarrea aguda leve o moderada ENOVAT recomienda no usar antibióticos; considerar antimicrobianos sistémicos en enfermedad grave o circunstancias específicas. La referencia no valida esta dosis para todas las especies ni para todos los diagnósticos agrupados.', 'For mild or moderate acute diarrhoea in dogs ENOVAT recommends against antibiotics; consider systemic antimicrobials in severe disease or specific circumstances. The reference does not validate this dose for all species or grouped diagnoses.', loc('Diarrea canina · antibiótico solo si indicado', 'Canine diarrhoea · antibiotics only if indicated'));
  }
  if (drug === 'Terbinafina' && indication === 'Dermatitis por Malassezia') {
    item = notes(item, 'Consenso WAVD: evidencia débil para terbinafina intermitente; itraconazol y ketoconazol disponen de mejor evidencia. Considerar tratamiento tópico y enfermedad subyacente.', 'WAVD consensus: weak evidence for intermittent terbinafine; itraconazole and ketoconazole have stronger evidence. Consider topical treatment and underlying disease.', loc('Malassezia · evidencia débil', 'Malassezia · weak evidence'));
  }
  if (entry.antibioticCategory === 'A') {
    item = notes(item, 'AMEG A: evitar; no interpretar la categoría como autorización. La ficha, la normativa vigente y la sensibilidad bacteriana condicionan cualquier uso excepcional en animales de compañía.', 'AMEG A: avoid; the category is not authorisation. Product information, applicable law and susceptibility govern any exceptional companion-animal use.', loc('AMEG A · evitar · comprobar normativa', 'AMEG A · avoid · check applicable law'));
  }
  return [item];
}

const add = (ingredient: string, species: DoseCalculatorEntry['species'], indication: LocalizedText, min: number, max: number, frequency: string, options: { unit?: string; route?: string; duration?: string; notes?: LocalizedText; disable?: boolean } = {}): DoseCalculatorEntry => {
  const base: DoseCalculatorEntry = {
    id: `photo-2026-${ingredient.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${species.join('-').toLowerCase()}-${indication.en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    activeIngredient: ingredient, category: loc('Antiinfecciosos Sistémicos', 'Systemic anti-infectives'),
    subcategory: loc('Pautas del libro fotografiado', 'Photographed book regimens'), species,
    speciesLabel: species.map((s) => s === 'Dog' ? 'Perro' : 'Gato').join('/'),
    indication, route: options.route ?? 'VO', doseUnit: options.unit ?? 'mg/kg', doseRangeMgKg: { min, max }, defaultDoseMgKg: min,
    doseText: options.disable ? min === max ? `${min}` : `${min}–${max}` : undefined,
    antibioticCategory: ingredient === 'Marbofloxacino' || ingredient === 'Pradofloxacino' ? 'B' : undefined,
    frequency, duration: options.duration, concentration: loc('', ''), dosePhase: options.disable ? reviewPhase : sourcePhase, clinicalNotes: options.notes,
  };
  return attachSources(options.disable ? disable(base) : base);
};

const newRows: DoseCalculatorEntry[] = [
  add('Cefalexina', ['Dog'], loc('Neumonía bacteriana', 'Bacterial pneumonia'), 22, 25, 'q12h'),
  add('Cefalexina', ['Cat'], loc('Neumonía bacteriana', 'Bacterial pneumonia'), 22, 22, 'q24h', { disable: true, notes: loc('El libro indica c24h; la tabla respiratoria ISCAID indica 22–25 mg/kg c12h. Confirmar la pauta y su adecuación al paciente.', 'The book states q24h; the ISCAID respiratory table states 22–25 mg/kg q12h. Confirm regimen and patient suitability.') }),
  add('Marbofloxacino', ['Dog', 'Cat'], loc('Orquitis-epididimitis e infección urinaria bacteriana', 'Orchitis-epididymitis and bacterial urinary infection'), 2, 2, 'q24h', { route: 'VO/SC', disable: true, notes: loc('AMEG B: valorar cultivo y alternativas. Las indicaciones y pautas de inyección difieren según especie y producto; contrastar la ficha antes de elegir vía y frecuencia.', 'AMEG B: consider culture and alternatives. Indications and injection regimens differ by species and product; check the label before selecting route and interval.') }),
  add('Marbofloxacino', ['Dog', 'Cat'], loc('Piodermas y otitis intensa', 'Pyoderma and severe otitis'), 2.75, 2.75, 'q24h', { route: 'VO/SC', disable: true, notes: loc('AMEG B: valorar alternativas y cultivo. El libro menciona 5,5 mg/kg frente a Pseudomonas o pioderma intensa; las pautas dependen de la especie y la formulación.', 'AMEG B: assess alternatives and culture. The book mentions 5.5 mg/kg for Pseudomonas or severe pyoderma; regimens depend on species and formulation.') }),
  add('Azitromicina', ['Dog'], loc('Piodermas por estafilococos multirresistentes', 'Multidrug-resistant staphylococcal pyoderma'), 10, 10, 'q24h', { notes: loc('Decisión guiada por cultivo y sensibilidad; verificar eficacia y alternativas.', 'Base the decision on culture and susceptibility; verify efficacy and alternatives.'), disable: true }),
  add('Azitromicina', ['Dog', 'Cat'], loc('Rinitis alérgica o linfoplasmocitaria', 'Allergic or lymphoplasmacytic rhinitis'), 5, 5, 'q24h', { notes: loc('Pauta del libro; no se ha contrastado la eficacia para esta indicación. Evitar uso antimicrobiano sin indicación justificada.', 'Book regimen; efficacy for this indication has not been independently established. Avoid antimicrobial use without a justified indication.'), disable: true }),
  add('Azitromicina', ['Dog'], loc('Papilomatosis', 'Papillomatosis'), 10, 10, 'q24h', { duration: '10 días', notes: loc('Pauta durante 10 días en el libro. Un ensayo pequeño sugirió beneficio; una revisión posterior considera la eficacia no concluyente. Ponderar resolución espontánea y uso prudente de antibióticos.', 'Book regimen for 10 days. A small trial suggested benefit; a later review considers efficacy inconclusive. Consider spontaneous resolution and antimicrobial stewardship.'), disable: true }),
  add('Azitromicina', ['Dog'], loc('Criptosporidiosis', 'Cryptosporidiosis'), 5, 10, 'q12h', { notes: loc('Evidencia clínica y necesidad de tratamiento deben evaluarse individualmente.', 'Assess clinical evidence and the need for treatment individually.'), disable: true }),
  add('Azitromicina', ['Cat'], loc('Criptosporidiosis', 'Cryptosporidiosis'), 10, 10, 'q24h', { notes: loc('Evidencia clínica y necesidad de tratamiento deben evaluarse individualmente.', 'Assess clinical evidence and the need for treatment individually.'), disable: true }),
  add('Pradofloxacino', ['Cat'], loc('Infección respiratoria · suspensión oral', 'Respiratory infection · oral suspension'), 7.5, 7.5, 'q24h', { notes: loc('El libro indica 7,5 mg/kg; la ficha de suspensión felina recomienda 5 mg/kg c24h y la graduación produce 5–7,5 mg/kg. Comprobar indicación y presentación.', 'The book states 7.5 mg/kg; the feline suspension label recommends 5 mg/kg q24h and syringe graduation results in 5–7.5 mg/kg. Check indication and formulation.'), disable: true }),
];

export function reviewPhotographedAntiInfectives(entries: DoseCalculatorEntry[]): DoseCalculatorEntry[] {
  return [...entries.flatMap(review), ...newRows];
}
