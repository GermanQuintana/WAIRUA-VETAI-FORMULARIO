/** Mass balance when an equal volume of base fluid is removed before adding KCl. */
export function calculatePotassiumAdmixture(targetPerL: number, basePerL: number, finalVolumeMl: number, ampPerMl: number) {
  if (![targetPerL, basePerL, finalVolumeMl].every(Number.isFinite) || basePerL < 0 || targetPerL < basePerL || finalVolumeMl <= 0) return null;
  if (targetPerL === basePerL) return { ampVolumeMl: 0, addedMeq: 0 };
  if (!Number.isFinite(ampPerMl) || ampPerMl <= basePerL / 1000) return null;
  const ampVolumeMl = ((targetPerL - basePerL) * finalVolumeMl / 1000) / (ampPerMl - basePerL / 1000);
  const addedMeq = ampVolumeMl * ampPerMl;
  if (!Number.isFinite(ampVolumeMl) || !Number.isFinite(addedMeq) || ampVolumeMl > finalVolumeMl) return null;
  return { ampVolumeMl, addedMeq };
}
