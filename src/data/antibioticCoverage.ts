import { LocalizedText } from '../types';

const l = (es: string, en: string): LocalizedText => ({ es, en });
export type Coverage = 'good' | 'variable' | 'poor';
export type AmegCategory = 'D' | 'C' | 'B' | 'A';
export const antibioticSources = {
  ameg: { title: 'EMA · AMEG (actualización 2025 / 2025 update)', url: 'https://www.ema.europa.eu/en/documents/report/infographic-categorisation-antibiotics-use-animals-prudent-responsible-use_en.pdf' },
  penicillins: { title: 'MSD Veterinary Manual · Penicillins', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/penicillins-use-in-animals' },
  cephalosporins: { title: 'MSD Veterinary Manual · Cephalosporins', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/cephalosporins-and-cephamycins-use-in-animals' },
  aminoglycosides: { title: 'MSD Veterinary Manual · Aminoglycosides', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/aminoglycosides-use-in-animals' },
  tetracyclines: { title: 'MSD Veterinary Manual · Tetracyclines', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/tetracyclines-use-in-animals' },
  phenicols: { title: 'MSD Veterinary Manual · Phenicols', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/phenicols-use-in-animals' },
  macrolides: { title: 'MSD Veterinary Manual · Macrolides', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/macrolide-use-in-animals' },
  lincosamides: { title: 'MSD Veterinary Manual · Lincosamides', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/lincosamides-use-in-animals' },
  sulfonamides: { title: 'MSD Veterinary Manual · Sulfonamides', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/sulfonamides-and-sulfonamide-combinations-use-in-animals' },
  quinolones: { title: 'MSD Veterinary Manual · Quinolones', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/quinolones-including-fluoroquinolones-use-in-animals' },
  nitroimidazoles: { title: 'MSD Veterinary Manual · Nitroimidazoles', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/nitroimidazoles-use-in-animals' },
  rifamycins: { title: 'MSD Veterinary Manual · Rifamycins', url: 'https://www.msdvetmanual.com/pharmacology/antibacterial-agents/rifamycins-use-in-animals' },
  cascade: { title: 'UE / EU · Reglamento / Regulation 2024/1973 · rifamicinas / rifamycins', url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-81134' },
  polytherapy: { title: 'Merck Veterinary Manual · Antimicrobial polytherapy', url: 'https://www.merckvetmanual.com/pharmacology/antimicrobials/antimicrobial-polytherapy-for-animals' },
  peritonitis: { title: 'O’Marra & Campbell · Veterinary Surgery 2026 · peritonitis · DOI 10.1111/vsu.70051', url: 'https://doi.org/10.1111/vsu.70051' },
  stomorgyl: { title: 'AEMPS · Stomorgyl · ficha técnica / product information · 536 ESP', url: 'https://cimavet.aemps.es/cimavet/pdfs/es/ft/536%20ESP/FT_536%20ESP.pdf' },
  iscaid: { title: 'ISCAID 2017 · Respiratory tract guidelines · DOI 10.1111/jvim.14627', url: 'https://doi.org/10.1111/jvim.14627' },
};

interface AntibioticRow {
  id: string;
  group: LocalizedText;
  examples: LocalizedText;
  ameg: AmegCategory;
  // Gram+ excluding staphylococci; staphylococci; Gram− excluding Pseudomonas; Pseudomonas; strict anaerobes.
  coverage: [Coverage, Coverage, Coverage, Coverage, Coverage];
  note: LocalizedText;
  source: keyof typeof antibioticSources;
}
const g = 'good', v = 'variable', p = 'poor';
// Qualitative editorial synthesis of the cited pharmacology chapters, not an antibiogram.
export const antibioticCoverage: AntibioticRow[] = [
  { id: 'pen-g', group: l('Penicilina · penicilinas naturales', 'Penicillin · natural penicillins'), examples: l('Bencilpenicilina (penicilina G)', 'Benzylpenicillin (penicillin G)'), ameg: 'D', coverage: [g,p,p,p,g], note: l('No fiable frente a productores de penicilinasa ni Bacteroides productores de betalactamasa.', 'Unreliable against penicillinase producers and beta-lactamase-producing Bacteroides.'), source: 'penicillins' },
  { id: 'antistaphylococcal-pen', group: l('Penicilinas antiestafilocócicas', 'Antistaphylococcal penicillins'), examples: l('Oxacilina, cloxacilina, dicloxacilina', 'Oxacillin, cloxacillin, dicloxacillin'), ameg: 'D', coverage: [g,g,p,p,v], note: l('Estafilococos sensibles a meticilina, incluidos productores de penicilinasa. No cubren MRSP/MRSA ni enterococos; anaerobios: cobertura limitada.', 'Methicillin-susceptible staphylococci, including penicillinase producers. No MRSP/MRSA or enterococcal coverage; limited anaerobic coverage.'), source: 'penicillins' },
  { id: 'amino-pen', group: l('Amoxicilina y ampicilina · aminopenicilinas', 'Amoxicillin and ampicillin · aminopenicillins'), examples: l('Amoxicilina, ampicilina', 'Amoxicillin, ampicillin'), ameg: 'D', coverage: [g,p,v,p,v], note: l('Gram− sensibles seleccionados; betalactamasas limitan actividad. Sin actividad frente a Mycoplasma.', 'Selected susceptible Gram− organisms; beta-lactamases limit activity. No Mycoplasma activity.'), source: 'penicillins' },
  { id: 'amox-clav', group: l('Ácido clavulánico + amoxicilina', 'Clavulanic acid + amoxicillin'), examples: l('Aminopenicilina + inhibidor de betalactamasa', 'Aminopenicillin + beta-lactamase inhibitor'), ameg: 'C', coverage: [g,g,v,p,g], note: l('Clavulánico no es monoterapia. No cubre MRSP/MRSA ni garantiza cobertura de BLEE/AmpC.', 'Clavulanate is not monotherapy. Does not cover MRSP/MRSA or guarantee ESBL/AmpC coverage.'), source: 'penicillins' },
  { id: 'ampi-sulb', group: l('Ampicilina + sulbactam', 'Ampicillin + sulbactam'), examples: l('Aminopenicilina + inhibidor de betalactamasa', 'Aminopenicillin + beta-lactamase inhibitor'), ameg: 'C', coverage: [g,g,v,p,g], note: l('Protección frente a determinadas betalactamasas; no cubre MRSP/MRSA ni Pseudomonas. No asumir actividad frente a BLEE/AmpC.', 'Protection against selected beta-lactamases; no MRSP/MRSA or Pseudomonas coverage. Do not assume ESBL/AmpC activity.'), source: 'penicillins' },
  { id: 'cef1', group: l('Cefalosporinas · 1.ª generación', 'Cephalosporins · 1st generation'), examples: l('Cefalexina, cefadroxilo, cefazolina', 'Cephalexin, cefadroxil, cefazolin'), ameg: 'C', coverage: [g,g,v,p,v], note: l('No cubren Enterococcus, MRSP/MRSA ni Mycoplasma. Anaerobios: actividad incompleta.', 'No Enterococcus, MRSP/MRSA or Mycoplasma coverage. Incomplete anaerobic activity.'), source: 'cephalosporins' },
  { id: 'cef2', group: l('Cefalosporinas · 2.ª generación', 'Cephalosporins · 2nd generation'), examples: l('Cefuroxima, cefaclor', 'Cefuroxime, cefaclor'), ameg: 'C', coverage: [g,v,g,p,p], note: l('Gram−: espectro mayor que 1.ª generación. No cubren enterococos, MRSP/MRSA ni Pseudomonas; no extrapolar la cobertura anaerobia de cefoxitina.', 'Broader Gram− spectrum than 1st generation. No enterococci, MRSP/MRSA or Pseudomonas; do not extrapolate cefoxitin anaerobic coverage.'), source: 'cephalosporins' },
  { id: 'cephamycins', group: l('Cefalosporinas · 2.ª generación / cefamicinas', 'Cephalosporins · 2nd generation / cephamycins'), examples: l('Cefoxitina', 'Cefoxitin'), ameg: 'C', coverage: [g,v,g,p,g], note: l('Cobertura anaerobia más amplia, incluido Bacteroides sensible. No asumir actividad frente a Pseudomonas ni resistentes a meticilina; confirmar sensibilidad.', 'Broader anaerobic coverage, including susceptible Bacteroides. Do not assume Pseudomonas or methicillin-resistant coverage; confirm susceptibility.'), source: 'cephalosporins' },
  { id: 'cef3-vet', group: l('Cefalosporinas · 3.ª generación veterinarias', 'Cephalosporins · veterinary 3rd generation'), examples: l('Cefovecina, cefpodoxima', 'Cefovecin, cefpodoxime'), ameg: 'B', coverage: [v,g,v,p,v], note: l('Actividad frente a S. pseudintermedius sensible; Gram− variable. Sin enterococos ni MRSP/MRSA. No son equivalentes a ceftazidima.', 'Activity against susceptible S. pseudintermedius; variable Gram− activity. No enterococci or MRSP/MRSA. Not equivalent to ceftazidime.'), source: 'cephalosporins' },
  { id: 'cef3', group: l('Cefalosporinas · 3.ª generación', 'Cephalosporins · 3rd generation'), examples: l('Cefotaxima, ceftriaxona', 'Cefotaxime, ceftriaxone'), ameg: 'B', coverage: [g,v,g,p,v], note: l('Gram− amplio; sin cobertura fiable de Pseudomonas, enterococos o MRSP/MRSA. Confirmar sensibilidad y uso en cascada cuando proceda.', 'Broad Gram− spectrum; no reliable Pseudomonas, enterococcal or MRSP/MRSA coverage. Verify susceptibility and cascade use where applicable.'), source: 'cephalosporins' },
  { id: 'cef3-antipseudomonal', group: l('Cefalosporinas · 3.ª generación antipseudomónicas', 'Cephalosporins · antipseudomonal 3rd generation'), examples: l('Ceftazidima', 'Ceftazidime'), ameg: 'B', coverage: [v,v,g,g,p], note: l('Perfil centrado en Gram−, incluido Pseudomonas sensible; actividad Gram+ menor. No extrapolar al resto de cefalosporinas de 3.ª generación.', 'Gram− profile including susceptible Pseudomonas; less Gram+ activity. Do not extrapolate to other 3rd-generation cephalosporins.'), source: 'cephalosporins' },
  { id: 'cef4', group: l('Cefalosporinas · 4.ª generación', 'Cephalosporins · 4th generation'), examples: l('Cefepima', 'Cefepime'), ameg: 'B', coverage: [g,g,g,v,p], note: l('Gram+ y Gram− amplios; Pseudomonas según sensibilidad. No cubre enterococos, MRSP/MRSA ni garantiza actividad frente a BLEE.', 'Broad Gram+ and Gram−; Pseudomonas depends on susceptibility. No enterococci, MRSP/MRSA or guaranteed ESBL activity.'), source: 'cephalosporins' },
  { id: 'aminoglycosides', group: l('Aminoglucósidos', 'Aminoglycosides'), examples: l('Gentamicina, amikacina', 'Gentamicin, amikacin'), ameg: 'C', coverage: [p,g,g,v,p], note: l('Actividad dependiente de oxígeno: sin anaerobios. Nefrotoxicidad y ototoxicidad; monitorización renal.', 'Oxygen-dependent activity: no anaerobes. Nephrotoxicity and ototoxicity; monitor renal function.'), source: 'aminoglycosides' },
  { id: 'tetracyclines', group: l('Tetraciclinas', 'Tetracyclines'), examples: l('Doxiciclina, minociclina', 'Doxycycline, minocycline'), ameg: 'D', coverage: [v,v,v,p,v], note: l('Interés frente a Chlamydia, Rickettsia, Ehrlichia, Anaplasma, hemoplasmas y Mycoplasma. En gatos, evitar comprimidos secos por lesión esofágica.', 'Useful for Chlamydia, Rickettsia, Ehrlichia, Anaplasma, haemoplasmas and Mycoplasma. Avoid dry tablets in cats because of oesophageal injury.'), source: 'tetracyclines' },
  { id: 'phenicols', group: l('Cloranfenicol · fenicoles', 'Chloramphenicol · phenicols'), examples: l('Cloranfenicol', 'Chloramphenicol'), ameg: 'C', coverage: [g,v,v,p,g], note: l('Vigilar toxicidad medular y exposición humana; precaución especial en gatos. Actividad no implica elección preferente.', 'Monitor bone marrow toxicity and human exposure; particular caution in cats. Activity does not imply preferred choice.'), source: 'phenicols' },
  { id: 'macrolides', group: l('Macrólidos', 'Macrolides'), examples: l('Azitromicina, eritromicina, tilosina', 'Azithromycin, erythromycin, tylosin'), ameg: 'C', coverage: [v,v,p,p,v], note: l('Actividad frente a algunos Mycoplasma/Chlamydia según molécula; resistencia cruzada MLSB. No agrupar con lincosamidas para todos los objetivos.', 'Some Mycoplasma/Chlamydia activity depends on the agent; MLSB cross-resistance. Do not equate all targets with lincosamides.'), source: 'macrolides' },
  { id: 'lincosamides', group: l('Lincosamidas', 'Lincosamides'), examples: l('Clindamicina', 'Clindamycin'), ameg: 'C', coverage: [g,v,p,p,g], note: l('Toxoplasma: indicación específica, fuera de esta matriz bacteriana. No cubre enterococos ni bacilos Gram− aerobios; comprobar resistencia inducible.', 'Toxoplasma is a specific indication outside this bacterial matrix. No enterococcal or aerobic Gram− bacillus coverage; check inducible resistance.'), source: 'lincosamides' },
  { id: 'sulfonamides-unpotentiated', group: l('Sulfamidas sin potenciar', 'Unpotentiated sulfonamides'), examples: l('Sulfadimetoxina, sulfadiazina', 'Sulfadimethoxine, sulfadiazine'), ameg: 'D', coverage: [v,v,v,p,p], note: l('Resistencia frecuente y actividad dependiente de la especie bacteriana; no equivalen a trimetoprim + sulfamida. Algunos usos antiprotozoarios dependen de la molécula.', 'Frequent resistance and organism-dependent activity; not equivalent to trimethoprim + sulfonamide. Some antiprotozoal uses depend on the agent.'), source: 'sulfonamides' },
  { id: 'sulfonamides', group: l('Sulfamidas potenciadas', 'Potentiated sulfonamides'), examples: l('Trimetoprim/sulfametoxazol, trimetoprim/sulfadiazina', 'Trimethoprim/sulfamethoxazole, trimethoprim/sulfadiazine'), ameg: 'D', coverage: [v,v,v,p,p], note: l('No asumir cobertura anaerobia clínica. Riesgos: queratoconjuntivitis seca e hipersensibilidad, especialmente en perros.', 'Do not assume clinical anaerobic coverage. Risks include keratoconjunctivitis sicca and hypersensitivity, especially in dogs.'), source: 'sulfonamides' },
  { id: 'fluoroquinolones', group: l('Fluoroquinolonas', 'Fluoroquinolones'), examples: l('Enrofloxacino, marbofloxacino', 'Enrofloxacin, marbofloxacin'), ameg: 'B', coverage: [v,v,g,v,p], note: l('No fiables frente a estreptococos ni anaerobios. Pseudomonas requiere sensibilidad. Enrofloxacino: riesgo retiniano en gatos; precaución en crecimiento.', 'Unreliable against streptococci and anaerobes. Pseudomonas requires susceptibility testing. Enrofloxacin: feline retinal toxicity risk; caution in growing animals.'), source: 'quinolones' },
  { id: 'pradofloxacin', group: l('Fluoroquinolonas · perfil ampliado', 'Fluoroquinolones · extended profile'), examples: l('Pradofloxacino', 'Pradofloxacin'), ameg: 'B', coverage: [g,v,g,p,v], note: l('Mayor actividad Gram+ y frente a algunos anaerobios que otras fluoroquinolonas; no extrapolar cobertura de Pseudomonas ni de resistentes.', 'Greater Gram+ and some anaerobic activity than other fluoroquinolones; do not infer Pseudomonas or resistant-organism coverage.'), source: 'quinolones' },
  { id: 'metronidazole', group: l('Metronidazol · nitroimidazoles', 'Metronidazole · nitroimidazoles'), examples: l('Metronidazol', 'Metronidazole'), ameg: 'D', coverage: [p,p,p,p,g], note: l('Sin cobertura de aerobios. Actividad antiprotozoaria específica; no justifica uso rutinario en diarrea. Riesgo de neurotoxicidad.', 'No aerobic coverage. Specific antiprotozoal activity does not justify routine use in diarrhoea. Neurotoxicity risk.'), source: 'nitroimidazoles' },
  { id: 'rifampicin', group: l('Rifampicina · rifamicinas', 'Rifampicin · rifamycins'), examples: l('Rifampicina (rifampin)', 'Rifampicin (rifampin)'), ameg: 'A', coverage: [g,g,p,p,v], note: l('Actividad Gram+ e intracelular, incluidas algunas micobacterias. Resistencia rápida; evitar monoterapia. Hepatotoxicidad e interacciones por inducción enzimática. Uso excepcional: ver condiciones legales debajo.', 'Gram+ and intracellular activity, including some mycobacteria. Rapid resistance; avoid monotherapy. Hepatotoxicity and enzyme-induction interactions. Exceptional use: see legal conditions below.'), source: 'rifamycins' },
];

export const amegGroups: { category: AmegCategory; title: LocalizedText; text: LocalizedText; examples: LocalizedText }[] = [
  { category: 'D', title: l('Prudencia', 'Prudence'), text: l('Priorizar si es clínicamente eficaz. Evitar tratamientos innecesarios y duraciones excesivas.', 'Prefer when clinically effective. Avoid unnecessary treatment and excessive duration.'), examples: l('Penicilinas naturales, antiestafilocócicas y aminopenicilinas sin inhibidor; tetraciclinas, sulfamidas y metronidazol.', 'Natural and antistaphylococcal penicillins, aminopenicillins without inhibitor; tetracyclines, sulfonamides and metronidazole.') },
  { category: 'C', title: l('Cautela', 'Caution'), text: l('Considerar cuando no exista una opción eficaz de categoría D.', 'Consider when no effective category D option is available.'), examples: l('Amoxicilina/clavulánico, cefalosporinas de 1.ª/2.ª generación, aminoglucósidos, macrólidos, lincosamidas, fenicoles.', 'Amoxicillin/clavulanate, 1st/2nd-generation cephalosporins, aminoglycosides, macrolides, lincosamides, phenicols.') },
  { category: 'B', title: l('Restringir', 'Restrict'), text: l('Solo si C/D no son clínicamente eficaces; basar en sensibilidad siempre que sea posible.', 'Only when C/D are not clinically effective; base on susceptibility testing wherever possible.'), examples: l('Quinolonas, cefalosporinas de 3.ª/4.ª generación, polimixinas.', 'Quinolones, 3rd/4th-generation cephalosporins, polymyxins.') },
  { category: 'A', title: l('Evitar', 'Avoid'), text: l('No se propone como ampliación rutinaria del espectro. Comprobar prohibiciones y normativa vigente: AMEG no autoriza una prescripción.', 'Not proposed for routine spectrum broadening. Check current prohibitions and legislation: AMEG does not authorise prescribing.'), examples: l('Carbapenémicos, glicopéptidos, oxazolidinonas y rifamicinas excepto rifaximina.', 'Carbapenems, glycopeptides, oxazolidinones and rifamycins except rifaximin.') },
];

interface AntibioticCombination {
  id: string;
  drugs: LocalizedText;
  ameg: string;
  benefit: LocalizedText;
  context: LocalizedText;
  limit: LocalizedText;
  evidence: LocalizedText;
  sources: (keyof typeof antibioticSources)[];
}

const pharmacologicalEvidence = l('Base farmacológica · evidencia clínica específica limitada', 'Pharmacological rationale · limited combination-specific clinical evidence');
const consensusEvidence = l('Consenso ISCAID · contexto respiratorio', 'ISCAID consensus · respiratory context');
const reviewEvidence = l('Revisión clínica · sin superioridad universal demostrada', 'Clinical review · no universally established superiority');

export const antibioticCombinations: AntibioticCombination[] = [
  {
    id: 'amoxicillin-metronidazole', drugs: l('Amoxicilina + metronidazol', 'Amoxicillin + metronidazole'), ameg: 'D + D',
    benefit: l('A los aerobios sensibles a amoxicilina añade anaerobios sensibles a metronidazol, incluidos algunos Bacteroides resistentes a penicilinas.', 'Adds metronidazole-susceptible anaerobes, including some penicillin-resistant Bacteroides, to amoxicillin-susceptible aerobes.'),
    context: l('Perros/gatos: valorar en infección mixta documentada y paciente estable, si ambos componentes del espectro son necesarios. La opción oral exige tolerancia y absorción adecuadas.', 'Dogs/cats: consider in a documented mixed infection in a stable patient when both spectrum components are needed. Oral use requires adequate tolerance and absorption.'),
    limit: l('Amoxicilina ya cubre muchos anaerobios: justificar el aporte adicional. No asegura Gram− aerobios resistentes ni sustituye un protocolo parenteral de sepsis. No equivale a amoxicilina/clavulánico.', 'Amoxicillin already covers many anaerobes: justify the added coverage. Does not ensure resistant aerobic Gram− coverage or replace a parenteral sepsis protocol. Not equivalent to amoxicillin/clavulanate.'),
    evidence: pharmacologicalEvidence, sources: ['penicillins', 'nitroimidazoles', 'polytherapy'],
  },
  {
    id: 'ampicillin-metronidazole', drugs: l('Ampicilina + metronidazol', 'Ampicillin + metronidazole'), ameg: 'D + D',
    benefit: l('Complementa Gram+ y otros aerobios sensibles a ampicilina con anaerobios sensibles a metronidazol.', 'Complements Gram+ and other ampicillin-susceptible aerobes with metronidazole-susceptible anaerobes.'),
    context: l('Perros/gatos hospitalizados con infección mixta y sensibilidad aerobia compatible; seleccionar la vía y exposición según el foco.', 'Hospitalised dogs/cats with a mixed infection and compatible aerobic susceptibility; select route and exposure according to the site.'),
    limit: l('Metronidazol no protege ampicilina de las betalactamasas. Puede faltar cobertura Gram− aerobia: en peritonitis séptica no asumir que esta pareja basta. Hay solapamiento anaerobio.', 'Metronidazole does not protect ampicillin from beta-lactamases. Aerobic Gram− coverage may be inadequate: do not assume this pair suffices in septic peritonitis. Anaerobic overlap exists.'),
    evidence: pharmacologicalEvidence, sources: ['penicillins', 'nitroimidazoles', 'peritonitis'],
  },
  {
    id: 'ampicillin-fluoroquinolone', drugs: l('Ampicilina + enrofloxacino / marbofloxacino', 'Ampicillin + enrofloxacin / marbofloxacin'), ameg: 'D + B',
    benefit: l('La fluoroquinolona añade Gram− aerobios a Gram+ y anaerobios sensibles a ampicilina.', 'The fluoroquinolone adds aerobic Gram− activity to ampicillin-susceptible Gram+ and anaerobes.'),
    context: l('Perros/gatos: opción parenteral en neumonía con sospecha de sepsis mientras llega el cultivo; también descrita en peritonitis según resistencias locales.', 'Dogs/cats: parenteral option for pneumonia with suspected sepsis pending culture; also described in peritonitis depending on local resistance.'),
    limit: l('No asegura productores de betalactamasa. Reservar la fluoroquinolona; revisar riesgo retiniano de enrofloxacino en gatos y desescalar.', 'Does not ensure beta-lactamase producer coverage. Restrict the fluoroquinolone; review feline enrofloxacin retinal toxicity and de-escalate.'),
    evidence: consensusEvidence, sources: ['iscaid', 'peritonitis'],
  },
  {
    id: 'ampicillin-sulbactam-fluoroquinolone', drugs: l('Ampicilina/sulbactam + enrofloxacino / marbofloxacino', 'Ampicillin/sulbactam + enrofloxacin / marbofloxacin'), ameg: 'C + B',
    benefit: l('Penicilina protegida para Gram+ y anaerobios sensibles; la fluoroquinolona amplía Gram− aerobios.', 'Protected penicillin for susceptible Gram+ and anaerobes; the fluoroquinolone broadens aerobic Gram− coverage.'),
    context: l('Perros/gatos: neumonía potencialmente mortal en hospital cuando se necesita ampliar la actividad Gram− de ampicilina/sulbactam.', 'Dogs/cats: life-threatening pneumonia in hospital when ampicillin/sulbactam needs additional Gram− activity.'),
    limit: l('No cubre todos los resistentes ni justifica añadir metronidazol de rutina. Ajustar a cultivo, función renal y riesgos de fluoroquinolonas.', 'Does not cover all resistant organisms or justify routine metronidazole addition. Adjust to culture, renal function and fluoroquinolone risks.'),
    evidence: consensusEvidence, sources: ['iscaid', 'penicillins'],
  },
  {
    id: 'clindamycin-fluoroquinolone', drugs: l('Clindamicina + enrofloxacino / marbofloxacino', 'Clindamycin + enrofloxacin / marbofloxacin'), ameg: 'C + B',
    benefit: l('Gram+ y anaerobios sensibles a clindamicina + Gram− aerobios sensibles a fluoroquinolona.', 'Clindamycin-susceptible Gram+ and anaerobes + fluoroquinolone-susceptible aerobic Gram−.'),
    context: l('Alternativa parenteral en neumonía séptica de perros/gatos, según patógeno probable, tratamientos previos y sensibilidad.', 'Parenteral alternative for septic pneumonia in dogs/cats, based on likely pathogen, previous treatment and susceptibility.'),
    limit: l('No cubre enterococos; algunos Bacteroides pueden ser resistentes a clindamicina. No añadir metronidazol automáticamente por duplicación anaerobia.', 'No enterococcal coverage; some Bacteroides may resist clindamycin. Do not automatically add metronidazole because of anaerobic duplication.'),
    evidence: consensusEvidence, sources: ['iscaid', 'lincosamides'],
  },
  {
    id: 'fluoroquinolone-metronidazole', drugs: l('Enrofloxacino / marbofloxacino + metronidazol', 'Enrofloxacin / marbofloxacin + metronidazole'), ameg: 'B + D',
    benefit: l('Gram− aerobios sensibles + anaerobios estrictos sensibles; metronidazol cubre una laguna de estas fluoroquinolonas.', 'Susceptible aerobic Gram− + susceptible strict anaerobes; metronidazole covers a gap of these fluoroquinolones.'),
    context: l('Perros/gatos con esos dos componentes de infección mixta documentados; en neumonía séptica, ISCAID contempla metronidazol si preocupa Bacteroides.', 'Dogs/cats with these two documented mixed-infection components; ISCAID considers metronidazole in septic pneumonia when Bacteroides is a concern.'),
    limit: l('Puede faltar cobertura Gram+ y de enterococos: no es una pareja universal de sepsis. No extrapolar a todas las fluoroquinolonas; valorar riesgo retiniano felino y neurotoxicidad de metronidazol.', 'Gram+ and enterococcal coverage may be inadequate: not a universal sepsis pair. Do not extrapolate to every fluoroquinolone; assess feline retinal risk and metronidazole neurotoxicity.'),
    evidence: l('Consenso para un contexto concreto + base farmacológica', 'Context-specific consensus + pharmacological rationale'), sources: ['iscaid', 'quinolones', 'nitroimidazoles'],
  },
  {
    id: 'cefazolin-metronidazole', drugs: l('Cefazolina + metronidazol', 'Cefazolin + metronidazole'), ameg: 'C + D',
    benefit: l('A Gram+ y Gram− seleccionados sensibles a cefazolina añade anaerobios sensibles a metronidazol.', 'Adds metronidazole-susceptible anaerobes to cefazolin-susceptible Gram+ and selected Gram−.'),
    context: l('Perros/gatos: valorar si la infección mixta requiere ese aporte anaerobio y los aerobios son sensibles a cefazolina.', 'Dogs/cats: consider when a mixed infection needs this anaerobic addition and aerobes are cefazolin susceptible.'),
    limit: l('No asegura enterobacterias resistentes, Pseudomonas, enterococos ni MRSP/MRSA. No convertir en profilaxis quirúrgica rutinaria ni en cobertura universal de peritonitis.', 'Does not ensure resistant Enterobacterales, Pseudomonas, enterococcal or MRSP/MRSA coverage. Not routine surgical prophylaxis or universal peritonitis coverage.'),
    evidence: pharmacologicalEvidence, sources: ['cephalosporins', 'nitroimidazoles', 'polytherapy'],
  },
  {
    id: 'cefotaxime-metronidazole', drugs: l('Cefotaxima + metronidazol', 'Cefotaxime + metronidazole'), ameg: 'B + D',
    benefit: l('Cefalosporina de 3.ª generación para aerobios sensibles + cobertura anaerobia adicional.', 'Third-generation cephalosporin for susceptible aerobes + additional anaerobic coverage.'),
    context: l('Perros/gatos hospitalizados: esquema descrito para infección abdominal mixta cuando se justifica una cefalosporina de 3.ª generación y el componente anaerobio.', 'Hospitalised dogs/cats: described approach for mixed abdominal infection when a third-generation cephalosporin and anaerobic component are justified.'),
    limit: l('Sin cobertura fiable de enterococos, Pseudomonas o BLEE. Uso restringido por AMEG B y posible cascada; cultivo y control quirúrgico del foco cuando corresponda.', 'No reliable enterococcal, Pseudomonas or ESBL coverage. AMEG B restriction and possible cascade use; culture and surgical source control where indicated.'),
    evidence: reviewEvidence, sources: ['peritonitis', 'cephalosporins', 'nitroimidazoles'],
  },
  {
    id: 'ampicillin-aminoglycoside', drugs: l('Ampicilina + aminoglucósido (gentamicina / amikacina)', 'Ampicillin + aminoglycoside (gentamicin / amikacin)'), ameg: 'D + C',
    benefit: l('Añade Gram− aerobios sensibles; posible sinergia frente a microorganismos concretos.', 'Adds susceptible aerobic Gram− activity; possible synergy against specific organisms.'),
    context: l('Perros/gatos hospitalizados: selección por foco y sensibilidad, con perfusión, hidratación y control renal adecuados.', 'Hospitalised dogs/cats: select by site and susceptibility, with adequate perfusion, hydration and renal monitoring.'),
    limit: l('Nefrotoxicidad: puede ser inadecuada en sepsis con hipoperfusión o disfunción renal. No mezclar betalactámico y aminoglucósido en la misma solución. No asegura anaerobios resistentes a ampicilina.', 'Nephrotoxicity: may be unsuitable in sepsis with hypoperfusion or renal dysfunction. Do not mix beta-lactam and aminoglycoside in one solution. Does not ensure ampicillin-resistant anaerobic coverage.'),
    evidence: l('Farmacología + uso descrito en revisiones clínicas', 'Pharmacology + use described in clinical reviews'), sources: ['aminoglycosides', 'polytherapy', 'peritonitis'],
  },
  {
    id: 'ampicillin-fluoroquinolone-metronidazole', drugs: l('Ampicilina + enrofloxacino + metronidazol', 'Ampicillin + enrofloxacin + metronidazole'), ameg: 'D + B + D',
    benefit: l('Añade cobertura de anaerobios sensibles a metronidazol a ampicilina + enrofloxacino.', 'Adds metronidazole-susceptible anaerobic coverage to ampicillin + enrofloxacin.'),
    context: l('Perros/gatos con peritonitis séptica: valorar en hospital solo si la pareja inicial deja una laguna anaerobia relevante, según foco, cultivos y resistencias.', 'Dogs/cats with septic peritonitis: consider in hospital only if the initial pair leaves a relevant anaerobic gap, based on source, cultures and resistance.'),
    limit: l('Triple terapia no es automáticamente mejor: hay solapamiento anaerobio. Justificar cada fármaco y retirar el innecesario al conocer sensibilidad; imprescindible controlar el foco.', 'Triple therapy is not automatically better: anaerobic overlap exists. Justify each drug and remove unnecessary agents once susceptibility is known; source control is essential.'),
    evidence: reviewEvidence, sources: ['peritonitis', 'penicillins', 'nitroimidazoles'],
  },
  {
    id: 'spiramycin-metronidazole', drugs: l('Espiramicina + metronidazol', 'Spiramycin + metronidazole'), ameg: 'C + D',
    benefit: l('Macrólido con actividad frente a determinados aerobios + nitroimidazol para anaerobios sensibles.', 'Macrolide activity against selected aerobes + nitroimidazole activity against susceptible anaerobes.'),
    context: l('Perros/gatos: asociación oral con ficha técnica AEMPS para infecciones bucales y faríngeas por microorganismos sensibles; confirmar que el caso requiere antibiótico.', 'Dogs/cats: oral combination with AEMPS product information for susceptible oral and pharyngeal infections; confirm that the case needs an antibiotic.'),
    limit: l('No sustituye tratamiento dental o control del foco. No combinar con otros macrólidos o lincosamidas; no recomendada en gestación/lactancia según ficha. No es una asociación para sepsis general.', 'Does not replace dental treatment or source control. Do not combine with other macrolides or lincosamides; not recommended in pregnancy/lactation per product information. Not a general sepsis combination.'),
    evidence: l('Ficha técnica oficial AEMPS · indicaciones específicas', 'Official AEMPS product information · specific indications'), sources: ['stomorgyl'],
  },
];
