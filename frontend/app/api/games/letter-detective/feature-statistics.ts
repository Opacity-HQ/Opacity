/** Denominator includes every scored trial, including correct trials (null error). */
export function confusionErrorRates(errorTypes: readonly (string | null)[]) {
  if (errorTypes.length === 0) {
    return { mirrorErrorRate: null, confusionErrorRate: null };
  }
  const mirrorErrors = errorTypes.filter((type) => type === "mirror").length;
  const confusionErrors = errorTypes.filter(
    (type) => type === "mirror" || type === "rotation" || type === "visual_similar",
  ).length;
  return {
    mirrorErrorRate: mirrorErrors / errorTypes.length,
    confusionErrorRate: confusionErrors / errorTypes.length,
  };
}
