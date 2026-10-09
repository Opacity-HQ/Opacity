// "Aarav Kumar Sharma" -> "Aarav". Shared by the header (display) and the
// onboarding route (naming the first child) so both agree on what "first
// name" means. Returns undefined for empty/whitespace-only input so callers
// can fall back instead of rendering a blank name.
export function getFirstName(fullName: string | null | undefined) {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first : undefined;
}
