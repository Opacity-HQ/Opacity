import { z } from "zod";

// Shape of a child's optional clinical profile. Shared by the API routes
// (validation) and the profile page (forms). Every field is optional: "" or
// [] means "not provided". Each section is saved on its own.

const triState = z.enum(["", "yes", "no", "unsure"]);
const shortText = z.string().trim().max(120);
const longText = z.string().trim().max(1000);

export const clinicalSections = {
  reading: z.object({
    priorDiagnosis: triState,
    diagnosedOn: shortText,
    diagnosedBy: shortText,
    supports: z.array(z.enum(["tutoring", "iep", "speech_therapy", "other"])).max(4),
  }),
  family: z.object({
    hasHistory: triState,
    relatives: z
      .array(z.enum(["mother", "father", "sibling", "grandparent", "other"]))
      .max(5),
    notes: longText,
  }),
  vision: z.object({
    wearsCorrection: triState,
    lastEyeTest: shortText,
    conditions: longText,
  }),
  hearing: z.object({
    issues: triState,
    usesAids: triState,
    earInfections: triState,
    notes: longText,
  }),
  attention: z.object({
    conditions: z
      .array(z.enum(["adhd", "dyscalculia", "autism", "anxiety", "none"]))
      .max(5),
    notes: longText,
  }),
  language: z.object({
    firstLanguage: shortText,
    homeLanguages: shortText,
    schoolLanguage: shortText,
  }),
  handedness: z.object({
    value: z.enum(["", "left", "right", "both"]),
  }),
  notes: z.object({
    text: longText,
  }),
} as const;

export type ClinicalSectionKey = keyof typeof clinicalSections;

export type ClinicalProfile = {
  [K in ClinicalSectionKey]: z.infer<(typeof clinicalSections)[K]>;
};

export const clinicalSectionKeys = Object.keys(
  clinicalSections,
) as ClinicalSectionKey[];

export const emptyClinicalProfile: ClinicalProfile = {
  reading: { priorDiagnosis: "", diagnosedOn: "", diagnosedBy: "", supports: [] },
  family: { hasHistory: "", relatives: [], notes: "" },
  vision: { wearsCorrection: "", lastEyeTest: "", conditions: "" },
  hearing: { issues: "", usesAids: "", earInfections: "", notes: "" },
  attention: { conditions: [], notes: "" },
  language: { firstLanguage: "", homeLanguages: "", schoolLanguage: "" },
  handedness: { value: "" },
  notes: { text: "" },
};

// Merge whatever is stored (possibly partial or from an older shape) over
// the empty defaults, section by section, keeping only sections that validate.
export function normalizeClinicalProfile(raw: unknown): ClinicalProfile {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, unknown> = {};
  for (const key of clinicalSectionKeys) {
    const merged = {
      ...emptyClinicalProfile[key],
      ...((source[key] as object | undefined) ?? {}),
    };
    const parsed = clinicalSections[key].safeParse(merged);
    result[key] = parsed.success ? parsed.data : emptyClinicalProfile[key];
  }
  return result as ClinicalProfile;
}

export function hasSectionData(value: object): boolean {
  return Object.values(value).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== "",
  );
}
