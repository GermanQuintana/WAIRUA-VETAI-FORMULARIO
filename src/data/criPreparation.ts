import type { LocalizedText } from "../types";
import { DEXDOMITOR_SOURCE, PROPOFOL_LIPURO_SOURCE } from "./criProtocols";

export type CriFluid = "saline" | "ringer" | "glucose";
export const CRI_FLUIDS: { id: CriFluid; name: LocalizedText }[] = [
  {
    id: "saline",
    name: { es: "Fisiológico · NaCl 0,9%", en: "Normal saline · 0.9% NaCl" },
  },
  {
    id: "ringer",
    name: {
      es: "Ringer lactato / Hartmann",
      en: "Lactated Ringer’s / Hartmann’s",
    },
  },
  { id: "glucose", name: { es: "Glucosa 5%", en: "5% dextrose" } },
];
export interface CriPreparationRule {
  fluids: CriFluid[];
  advice: LocalizedText;
  handling: LocalizedText;
  source: string;
  minMgMl?: number;
  maxMgMl?: number;
  studiedMgMl?: number[];
  maxHours?: number;
}
const ketolarSource =
  "https://cima.aemps.es/cima/dochtml/ft/47034/FichaTecnica_47034.html";
export const CRI_PREPARATION_RULES: Record<string, CriPreparationRule> = {
  dex500: {
    fluids: ["saline", "ringer"],
    maxHours: 6,
    advice: {
      es: "Dexdomitor: fisiológico y Ringer lactato están admitidos. Ninguno es universalmente mejor; elegir según el balance y el estado del paciente.",
      en: "Dexdomitor: saline and lactated Ringer’s are supported. Neither is universally better; choose according to fluid balance and patient status.",
    },
    handling: {
      es: "Diluir antes de la CRI y mantener asepsia. Sumar el volumen de la CRI al resto de fluidos.",
      en: "Dilute before CRI and maintain asepsis. Include CRI volume in total fluid intake.",
    },
    source: DEXDOMITOR_SOURCE,
  },
  lipuro10: {
    fluids: ["saline", "glucose"],
    minMgMl: 2,
    maxMgMl: 10,
    maxHours: 6,
    advice: {
      es: "Propofol Lipuro: fisiológico o glucosa 5% para diluir; Ringer lactato no figura entre los diluyentes de esta ficha. Mantener al menos 2 mg/mL.",
      en: "Propofol Lipuro: saline or 5% dextrose for dilution; lactated Ringer’s is not a listed diluent in this label. Maintain at least 2 mg/mL.",
    },
    handling: {
      es: "Preparar inmediatamente antes de usar y mantener asepsia. Sin diluir, cambiar sistema y reservorio como máximo a las 12 h.",
      en: "Prepare immediately before use and maintain asepsis. Undiluted: replace line and reservoir within 12 h.",
    },
    source: PROPOFOL_LIPURO_SOURCE,
  },
  midazolam5: {
    fluids: ["saline", "ringer", "glucose"],
    minMgMl: 0.015,
    maxMgMl: 0.15,
    maxHours: 24,
    advice: {
      es: "Midazolam B. Braun admite fisiológico, glucosa 5%, Ringer y Hartmann. La ficha documenta 0,015–0,15 mg/mL; evitar soluciones alcalinas y mezclas con otros fármacos no validadas.",
      en: "Midazolam B. Braun supports saline, 5% dextrose, Ringer’s and Hartmann’s. The label documents 0.015–0.15 mg/mL; avoid alkaline solutions and unvalidated drug mixtures.",
    },
    handling: {
      es: "Iniciar inmediatamente tras la preparación aséptica. Estabilidad fisicoquímica: 24 h a temperatura ambiente; no equivale a garantía de esterilidad.",
      en: "Start immediately after aseptic preparation. Physicochemical stability: 24 h at room temperature; this does not guarantee sterility.",
    },
    source: "https://cima.aemps.es/cima/dochtml/ft/68903/FT_68903.html",
  },
  ket50: {
    fluids: ["saline", "glucose"],
    studiedMgMl: [1, 2],
    maxHours: 24,
    advice: {
      es: "Ketolar: fisiológico o glucosa 5%. La ficha describe 1 y 2 mg/mL; no se extrapola esa estabilidad a otras concentraciones ni a Ringer lactato.",
      en: "Ketolar: saline or 5% dextrose. The label describes 1 and 2 mg/mL; stability is not extrapolated to other concentrations or lactated Ringer’s.",
    },
    handling: {
      es: "Preparar e iniciar sin demora. La ficha informa estabilidad de 24 h para la dilución descrita; proteger de la luz y mantener asepsia.",
      en: "Prepare and start without delay. The label reports 24 h stability for the described dilution; protect from light and maintain asepsis.",
    },
    source: ketolarSource,
  },
  anesketin100: {
    fluids: ["saline", "ringer"],
    advice: {
      es: "Anesketin admite fisiológico, Ringer y Ringer lactato. No mezclar con otros fármacos. La ficha no establece duración tras diluir; los 28 días corresponden al frasco abierto, no a la bolsa preparada.",
      en: "Anesketin supports saline, Ringer’s and lactated Ringer’s. Do not mix with other drugs. The label gives no diluted-use period; 28 days applies to the opened vial, not the prepared bag.",
    },
    handling: {
      es: "Mantener asepsia. La ficha no fija concentración final ni estabilidad tras dilución; la autonomía calculada no acredita ese tiempo de conservación.",
      en: "Maintain asepsis. The label does not specify final concentration or diluted stability; calculated volume duration does not establish a storage period.",
    },
    source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/2834%2BESP/FT_2834%2BESP.pdf",
  },
  anaestamine100: {
    fluids: ["saline", "ringer"],
    advice: {
      es: "Anaestamine admite fisiológico, Ringer y Ringer lactato. No mezclar con otros fármacos; incompatibilidad química con barbitúricos y diazepam. Los 28 días tras apertura no son estabilidad de la dilución.",
      en: "Anaestamine supports saline, Ringer’s and lactated Ringer’s. Do not mix with other drugs; chemically incompatible with barbiturates and diazepam. The 28-day opened-vial period is not diluted stability.",
    },
    handling: {
      es: "Mantener asepsia. La ficha no fija concentración final ni estabilidad tras dilución; la autonomía calculada no acredita ese tiempo de conservación.",
      en: "Maintain asepsis. The label does not specify final concentration or diluted stability; calculated volume duration does not establish a storage period.",
    },
    source: "https://cimavet.aemps.es/cimavet/pdfs/es/ft/3138%2BESP/FT_3138%2BESP.pdf",
  },
  furo10: {
    fluids: ["saline"],
    advice: {
      es: "Seguril: el diluyente indicado es fisiológico. Mantener pH neutro o ligeramente alcalino; puede precipitar si el pH baja de 7. No mezclar con otros medicamentos en la misma jeringa.",
      en: "Seguril: the listed diluent is saline. Maintain neutral or slightly alkaline pH; precipitation may occur below pH 7. Do not mix with other drugs in the same syringe.",
    },
    handling: {
      es: "Utilizar la preparación lo antes posible. No se asigna una duración de estabilidad a partir del tiempo de vaciado de la bolsa.",
      en: "Use the preparation as soon as possible. Bag emptying time does not establish stability.",
    },
    source:
      "https://cima.aemps.es/cima/dochtml/ft/39968/FichaTecnica_39968.html",
  },
};

export const KETAMIDOR_SOURCE =
  "https://cimavet.aemps.es/cimavet/pdfs/es/ft/2695%2BESP/FT_2695%2BESP.pdf";
/** Label information without an established dilution recipe or stability period. */
export const CRI_PRODUCT_PREPARATION_NOTES: Record<string, LocalizedText> = {
  ket100: {
    es: "Ketamidor: sin estudios de compatibilidad, su ficha indica no mezclar con otros medicamentos. No aporta diluyentes ni estabilidad de estas bolsas. Los 28 días tras apertura se refieren al frasco, no a una dilución.",
    en: "Ketamidor: without compatibility studies, the label says not to mix with other medicines. It provides no diluent or stability data for these bags. The 28-day opened-vial period does not apply to a dilution.",
  },
  ketabel100: {
    es: "Ketabel: no mezclar con barbitúricos ni diazepam en la misma jeringa. Su ficha no establece diluyente, concentración ni estabilidad para estas bolsas. Los 28 días tras apertura corresponden al frasco.",
    en: "Ketabel: do not mix with barbiturates or diazepam in the same syringe. Its label does not establish diluent, concentration or stability for these bags. The 28-day opened period applies to the vial.",
  },
  ketexx100: {
    es: "Ketexx: sin estudios de compatibilidad, su ficha indica no mezclar con otros medicamentos. No aporta diluyentes ni estabilidad de estas bolsas. Los 28 días tras apertura se refieren al frasco, no a una dilución.",
    en: "Ketexx: without compatibility studies, the label says not to mix with other medicines. It provides no diluent or stability data for these bags. The 28-day opened-vial period does not apply to a dilution.",
  },
};
export function criFluidStatus(
  presentationId: string,
  fluid: CriFluid,
  finalMgMl?: number,
): "documented" | "unverified" | "unsupported" {
  const rule = CRI_PREPARATION_RULES[presentationId];
  if (!rule) return "unverified";
  if (!rule.fluids.includes(fluid)) return "unsupported";
  if (finalMgMl === undefined) return "documented";
  if (!Number.isFinite(finalMgMl) || finalMgMl <= 0) return "unverified";
  if (
    (rule.minMgMl !== undefined && finalMgMl < rule.minMgMl - 1e-12) ||
    (rule.maxMgMl !== undefined && finalMgMl > rule.maxMgMl + 1e-12)
  )
    return "unsupported";
  if (
    rule.studiedMgMl &&
    !rule.studiedMgMl.some((value) => Math.abs(finalMgMl - value) < 1e-9)
  )
    return "unverified";
  return "documented";
}

/** Physical mixing evidence is distinct from evidence for concurrent clinical use. */
export const CRI_MIXTURE_NOTES: Record<
  string,
  { text: LocalizedText; source: string }
> = {
  "ket-dex": {
    text: {
      es: "La ficha de Dexdomitor documenta mezcla con ketamina en la misma jeringa durante 2 h; también hay que respetar la ficha de la marca de ketamina seleccionada. Esto no valida cualquier concentración de ambos diluidos juntos en bolsas de 100–500 mL. Aquí se calculan bolsas separadas. La coadministración clínica no demuestra estabilidad de la bolsa conjunta.",
      en: "The Dexdomitor label documents mixing with ketamine in the same syringe for 2 h; the selected ketamine brand’s label must also be respected. This does not validate arbitrary concentrations diluted together in 100–500 mL bags. Separate bags are calculated here. Concurrent clinical use does not establish shared-bag stability.",
    },
    source: DEXDOMITOR_SOURCE,
  },
  lkd: {
    text: {
      es: "LKD: existe un estudio de estabilidad en NaCl 0,9% con dexmedetomidina 1 µg/mL, ketamina 1 mg/mL y lidocaína 10 mg/mL, en jeringa de polipropileno. Esa proporción no reproduce las dosis de esta pauta posoperatoria. No se aplica a una bolsa de Ringer ni a otras proporciones; se calculan preparaciones separadas.",
      en: "LKD: a stability study used 0.9% NaCl with dexmedetomidine 1 µg/mL, ketamine 1 mg/mL and lidocaine 10 mg/mL in polypropylene syringes. That ratio does not reproduce this postoperative protocol. It does not establish stability in Ringer’s bags or at other ratios; separate preparations are calculated.",
    },
    source: "https://ejhp.bmj.com/content/33/1/80",
  },
};
