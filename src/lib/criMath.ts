import type { CriUnit } from "../data/criProtocols";
export function criMgKgHour(dose: number, unit: CriUnit) {
  return (
    dose *
    (unit.startsWith("µg") ? 0.001 : 1) *
    (unit.endsWith("/min") ? 60 : 1)
  );
}
export function calculateCri(
  weight: number,
  dose: number,
  unit: CriUnit,
  concentration: number,
  preparation?: { finalMl: number; pumpMlHour: number },
) {
  if (![weight, dose, concentration].every((n) => Number.isFinite(n) && n > 0))
    return null;
  const mgHour = weight * criMgKgHour(dose, unit);
  if (!Number.isFinite(mgHour) || mgHour <= 0) return null;
  if (!preparation) {
    const pumpMlHour = mgHour / concentration;
    return Number.isFinite(pumpMlHour) && pumpMlHour > 0
      ? {
          mgHour,
          pumpMlHour,
          drugMl: null,
          diluentMl: null,
          finalMgMl: concentration,
          hours: null,
        }
      : null;
  }
  const { finalMl, pumpMlHour } = preparation;
  if (![finalMl, pumpMlHour].every((n) => Number.isFinite(n) && n > 0))
    return null;
  const hours = finalMl / pumpMlHour;
  const drugMl = (mgHour * hours) / concentration;
  const finalMgMl = mgHour / pumpMlHour;
  if (
    ![hours, drugMl, finalMgMl].every((n) => Number.isFinite(n) && n > 0) ||
    drugMl > finalMl
  )
    return null;
  return {
    mgHour,
    pumpMlHour,
    drugMl,
    diluentMl: finalMl - drugMl,
    finalMgMl,
    hours,
  };
}

/** Plan a final-volume solution over a chosen duration (not extra fluid added to a full bag). */
export function calculateCriForDuration(
  weight: number,
  dose: number,
  unit: CriUnit,
  stockMgMl: number,
  finalMl: number,
  hours: number,
) {
  if (!Number.isFinite(hours) || hours <= 0) return null;
  return calculateCri(weight, dose, unit, stockMgMl, {
    finalMl,
    pumpMlHour: finalMl / hours,
  });
}

export function calculateLoadingFraction(
  weight: number,
  mgKg: number,
  stockMgMl: number,
) {
  if (
    ![weight, mgKg, stockMgMl].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return null;
  const mg = weight * mgKg;
  const stockMl = mg / stockMgMl;
  return [mg, stockMl].every((value) => Number.isFinite(value) && value > 0)
    ? { mg, stockMl }
    : null;
}

/** Product-specific limits from the AEMPS Propofol Lipuro 10 mg/mL SPC, not a class-wide rule. */
export function propofolPreparationIssue(
  finalMgMl: number,
  hours: number,
): "concentration" | "duration" | null {
  if (finalMgMl < 2) return "concentration";
  if (hours > (finalMgMl < 10 ? 6 : 12)) return "duration";
  return null;
}

/** Make up to final volume at a chosen final concentration, then solve the pump rate. */
export function calculateCriForConcentration(
  weight: number,
  dose: number,
  unit: CriUnit,
  stockMgMl: number,
  finalMl: number,
  finalMgMl: number,
) {
  if (!Number.isFinite(finalMgMl) || finalMgMl <= 0) return null;
  return calculateCri(weight, dose, unit, stockMgMl, {
    finalMl,
    pumpMlHour: (weight * criMgKgHour(dose, unit)) / finalMgMl,
  });
}

export interface CriBagIngredient {
  id: string;
  dose: number;
  unit: CriUnit;
  stockMgMl: number;
}

/** Quantities stay tied to the preparation rate; later pump adjustments never remake the bag. */
export function calculateCriBag(
  weight: number,
  finalMl: number,
  preparationPumpMlHour: number,
  ingredients: CriBagIngredient[],
  together: boolean,
) {
  if (
    !ingredients.length ||
    new Set(ingredients.map((item) => item.id)).size !== ingredients.length
  )
    return null;
  const rows = ingredients.map((item) => {
    const result = calculateCri(weight, item.dose, item.unit, item.stockMgMl, {
      finalMl,
      pumpMlHour: preparationPumpMlHour,
    });
    return result ? { ...item, ...result, drugMl: result.drugMl! } : null;
  });
  if (rows.some((row) => row === null)) return null;
  const drugs = rows.filter((row) => row !== null);
  const totalDrugMl = drugs.reduce((total, row) => total + row.drugMl, 0);
  // Separate bags each contain finalMl; a shared bag contains all of the drug volumes.
  if (
    !Number.isFinite(totalDrugMl) ||
    !Number.isFinite(finalMl * drugs.length) ||
    (together && totalDrugMl > finalMl)
  )
    return null;
  return {
    drugs,
    totalDrugMl,
    totalDiluentMl: (together ? finalMl : finalMl * drugs.length) - totalDrugMl,
    finalMl,
    preparationPumpMlHour,
    together,
  };
}

/** Convert actual delivery back to the exact unit used by the clinical protocol. */
export function criDoseAtPump(
  weight: number,
  finalMgMl: number,
  pumpMlHour: number,
  unit: CriUnit,
) {
  if (
    ![weight, finalMgMl, pumpMlHour].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return null;
  const dose = (finalMgMl * pumpMlHour) / weight / criMgKgHour(1, unit);
  return Number.isFinite(dose) && dose > 0 ? dose : null;
}
