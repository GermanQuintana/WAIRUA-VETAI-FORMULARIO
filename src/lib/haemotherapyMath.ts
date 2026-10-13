export function redCellVolume(
  weight: number,
  bloodVolume: number,
  current: number,
  target: number,
  unit: number,
) {
  if (
    ![weight, bloodVolume, current, target, unit].every(Number.isFinite) ||
    weight <= 0 ||
    bloodVolume <= 0 ||
    current < 0 ||
    current > 100 ||
    target <= current ||
    target > 100 ||
    unit <= 0 ||
    unit > 100
  )
    return null;
  const volume = (weight * bloodVolume * (target - current)) / unit;
  return Number.isFinite(volume) ? volume : null;
}

// Duration is prescribed by the clinician; this is arithmetic, not a rate recommendation.
export function transfusionRate(volume: number, hours: number) {
  return Number.isFinite(volume) &&
    volume > 0 &&
    Number.isFinite(hours) &&
    hours > 0 &&
    Number.isFinite(volume / hours)
    ? volume / hours
    : null;
}
