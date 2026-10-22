import { CRI_PRESENTATIONS, CRI_PROTOCOLS, type CriProtocol } from '../data/criProtocols';

export const normalizeCriSearch = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const categoryTerms: Record<CriProtocol['category'], string> = {
  status: 'epilepsia epilepsy epileptic epileptico convulsion convulsiones seizure seizures status anticonvulsivante anticonvulsant',
  anesthesia: 'anestesia anesthesia anestesica anesthetic tiva sedacion sedation mantenimiento maintenance',
  analgesia: 'analgesia analgesic dolor pain posoperatorio postoperative postoperatorio',
  critical: 'criticos critical uci icu',
};
const drugTerms: Record<string, string> = {
  ket: 'ketamina ketamine', dex: 'dexmedetomidina dexmedetomidine dexdomitor',
  pheno: 'fenobarbital phenobarbital luminal', furo: 'furosemida furosemide seguril',
  lido: 'lidocaina lidocaine', midazolam: 'midazolam midazolan',
  norepinephrine: 'noradrenalina noradrenaline norepinefrina norepinephrine',
};
/** AND between concepts; each concept can be a partial word, in either language. */
export function matchesCriProtocol(protocol: CriProtocol, query: string) {
  const terms = normalizeCriSearch(query).match(/[a-z0-9]+/g) ?? [];
  const text = normalizeCriSearch([
    protocol.id, protocol.name.es, protocol.name.en, protocol.indication.es, protocol.indication.en,
    categoryTerms[protocol.category], 'cri infusion continua continuous perfusion dosis dose guia guide',
    ...protocol.drugs.map((drug) => `${drug.name.es} ${drug.name.en} ${drugTerms[drug.id] ?? ''} ${(CRI_PRESENTATIONS[drug.id] ?? []).map(item => item.label.split(' · ')[0]).join(' ')}`),
    protocol.administration === 'loading' ? drugTerms.pheno : '',
  ].join(' '));
  return terms.every((term) => text.includes(term));
}
export const searchCriProtocols = (query: string) => CRI_PROTOCOLS.filter((protocol) => matchesCriProtocol(protocol, query));
