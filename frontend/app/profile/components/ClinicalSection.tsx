"use client";

import { useState } from "react";
import {
  Brain,
  BookOpen,
  Ear,
  Eye,
  Hand,
  Languages,
  NotebookPen,
  Users,
  Check,
  type LucideIcon,
} from "lucide-react";
import {
  emptyClinicalProfile,
  hasSectionData,
  type ClinicalProfile,
  type ClinicalSectionKey,
} from "@/lib/profile/clinical";
import {
  useClinicalProfileQuery,
  useSaveClinicalSectionMutation,
} from "@/lib/queries/profile";
import { Disclosure, DisclosureGroup } from "./Disclosure";
import {
  Choice,
  MultiChoice,
  PrimaryButton,
  TextAreaField,
  TextField,
} from "./fields";

const TRI = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
] as const;

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

type Draft<K extends ClinicalSectionKey> = ClinicalProfile[K];
type Update<K extends ClinicalSectionKey> = (patch: Partial<Draft<K>>) => void;

const label = (options: readonly { value: string; label: string }[], v: string) =>
  options.find((o) => o.value === v)?.label ?? v;

// Saves one section at a time. The draft starts from what is already stored
// and the button only enables once something has actually changed.
function SectionForm<K extends ClinicalSectionKey>({
  childId,
  section,
  saved,
  disabledReason,
  children,
}: {
  childId: string | null;
  section: K;
  /** Why saving is unavailable right now; the form itself still shows. */
  disabledReason: string | null;
  saved: Draft<K>;
  children: (draft: Draft<K>, update: Update<K>) => React.ReactNode;
}) {
  const [draft, setDraft] = useState<Draft<K>>(saved);
  const save = useSaveClinicalSectionMutation();
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const update: Update<K> = (patch) => {
    setJustSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!childId || disabledReason) return;
        save.mutate(
          { childId, section, value: draft } as Parameters<typeof save.mutate>[0],
          { onSuccess: () => setJustSaved(true) },
        );
      }}
    >
      {children(draft, update)}
      <div className="flex items-center gap-3">
        <PrimaryButton
          type="submit"
          disabled={!dirty || save.isPending || Boolean(disabledReason)}
        >
          {save.isPending ? "saving..." : "save"}
        </PrimaryButton>
        {justSaved && !dirty ? (
          <span
            role="status"
            className="font-pixel flex items-center gap-1 text-[13px] text-emerald-600 dark:text-emerald-400"
          >
            <Check className="size-4" aria-hidden /> saved
          </span>
        ) : null}
        {disabledReason ? (
          <span className="font-sauce text-[12px] text-[#8e8e8e]">
            {disabledReason}
          </span>
        ) : null}
        {save.isError ? (
          <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
            could not save, try again
          </span>
        ) : null}
      </div>
    </form>
  );
}

type SectionDef<K extends ClinicalSectionKey = ClinicalSectionKey> = {
  key: K;
  icon: LucideIcon;
  title: string;
  summarize: (value: Draft<K>) => string;
  render: (draft: Draft<K>, update: Update<K>) => React.ReactNode;
};

// Typed helper so each entry is checked against its own section's shape.
function def<K extends ClinicalSectionKey>(d: SectionDef<K>): SectionDef {
  return d as unknown as SectionDef;
}

const SECTIONS: SectionDef[] = [
  def({
    key: "reading",
    icon: BookOpen,
    title: "reading and learning history",
    summarize: (v) =>
      [
        v.priorDiagnosis && `Prior diagnosis: ${label(TRI, v.priorDiagnosis)}`,
        v.supports.length > 0 && `${v.supports.length} support(s)`,
      ]
        .filter(Boolean)
        .join(" · "),
    render: (d, u) => (
      <>
        <Choice
          label="Prior dyslexia diagnosis"
          options={TRI}
          value={d.priorDiagnosis}
          onChange={(priorDiagnosis) => u({ priorDiagnosis })}
        />
        <TextField
          label="Date diagnosed"
          placeholder="e.g. March 2024"
          value={d.diagnosedOn}
          onChange={(diagnosedOn) => u({ diagnosedOn })}
        />
        <TextField
          label="Diagnosed by"
          placeholder="e.g. school psychologist, pediatrician"
          value={d.diagnosedBy}
          onChange={(diagnosedBy) => u({ diagnosedBy })}
        />
        <MultiChoice
          label="Current support"
          options={[
            { value: "tutoring", label: "Tutoring" },
            { value: "iep", label: "IEP / school plan" },
            { value: "speech_therapy", label: "Speech therapy" },
            { value: "other", label: "Other" },
          ]}
          value={d.supports}
          onChange={(supports) => u({ supports })}
        />
      </>
    ),
  }),
  def({
    key: "family",
    icon: Users,
    title: "family history",
    summarize: (v) =>
      [
        v.hasHistory && `Dyslexia in family: ${label(TRI, v.hasHistory)}`,
        v.relatives.length > 0 && v.relatives.join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
    render: (d, u) => (
      <>
        <Choice
          label="Dyslexia or reading difficulty in the family"
          options={TRI}
          value={d.hasHistory}
          onChange={(hasHistory) => u({ hasHistory })}
        />
        <MultiChoice
          label="Which relatives"
          options={[
            { value: "mother", label: "Mother" },
            { value: "father", label: "Father" },
            { value: "sibling", label: "Sibling" },
            { value: "grandparent", label: "Grandparent" },
            { value: "other", label: "Other" },
          ]}
          value={d.relatives}
          onChange={(relatives) => u({ relatives })}
        />
        <TextAreaField
          label="Notes"
          value={d.notes}
          onChange={(notes) => u({ notes })}
        />
      </>
    ),
  }),
  def({
    key: "vision",
    icon: Eye,
    title: "vision",
    summarize: (v) =>
      [
        v.wearsCorrection && `Glasses or lenses: ${label(YES_NO, v.wearsCorrection)}`,
        v.lastEyeTest && `Eye test ${v.lastEyeTest}`,
      ]
        .filter(Boolean)
        .join(" · "),
    render: (d, u) => (
      <>
        <Choice
          label="Wears glasses or contact lenses"
          options={YES_NO}
          value={d.wearsCorrection}
          onChange={(wearsCorrection) => u({ wearsCorrection })}
        />
        <TextField
          label="Last eye test"
          placeholder="e.g. June 2025"
          value={d.lastEyeTest}
          onChange={(lastEyeTest) => u({ lastEyeTest })}
        />
        <TextAreaField
          label="Known conditions"
          placeholder="e.g. astigmatism, lazy eye"
          value={d.conditions}
          onChange={(conditions) => u({ conditions })}
        />
      </>
    ),
  }),
  def({
    key: "hearing",
    icon: Ear,
    title: "hearing",
    summarize: (v) =>
      [
        v.issues && `Hearing issues: ${label(TRI, v.issues)}`,
        v.usesAids && `Aids: ${label(YES_NO, v.usesAids)}`,
      ]
        .filter(Boolean)
        .join(" · "),
    render: (d, u) => (
      <>
        <Choice
          label="Known hearing issues"
          options={TRI}
          value={d.issues}
          onChange={(issues) => u({ issues })}
        />
        <Choice
          label="Uses hearing aids"
          options={YES_NO}
          value={d.usesAids}
          onChange={(usesAids) => u({ usesAids })}
        />
        <Choice
          label="History of frequent ear infections"
          options={TRI}
          value={d.earInfections}
          onChange={(earInfections) => u({ earInfections })}
        />
        <TextAreaField
          label="Notes"
          value={d.notes}
          onChange={(notes) => u({ notes })}
        />
      </>
    ),
  }),
  def({
    key: "attention",
    icon: Brain,
    title: "attention and other conditions",
    summarize: (v) => v.conditions.join(", "),
    render: (d, u) => (
      <>
        <MultiChoice
          label="Diagnosed or suspected"
          options={[
            { value: "adhd", label: "ADHD" },
            { value: "dyscalculia", label: "Dyscalculia" },
            { value: "autism", label: "Autism" },
            { value: "anxiety", label: "Anxiety" },
            { value: "none", label: "None" },
          ]}
          value={d.conditions}
          onChange={(conditions) => u({ conditions })}
        />
        <TextAreaField
          label="Notes"
          value={d.notes}
          onChange={(notes) => u({ notes })}
        />
      </>
    ),
  }),
  def({
    key: "language",
    icon: Languages,
    title: "language",
    summarize: (v) =>
      [v.firstLanguage && `First: ${v.firstLanguage}`, v.schoolLanguage && `School: ${v.schoolLanguage}`]
        .filter(Boolean)
        .join(" · "),
    render: (d, u) => (
      <>
        <TextField
          label="First language"
          value={d.firstLanguage}
          onChange={(firstLanguage) => u({ firstLanguage })}
        />
        <TextField
          label="Languages spoken at home"
          placeholder="e.g. English, Hindi"
          value={d.homeLanguages}
          onChange={(homeLanguages) => u({ homeLanguages })}
        />
        <TextField
          label="Language of schooling"
          value={d.schoolLanguage}
          onChange={(schoolLanguage) => u({ schoolLanguage })}
        />
      </>
    ),
  }),
  def({
    key: "handedness",
    icon: Hand,
    title: "handedness",
    summarize: (v) => v.value,
    render: (d, u) => (
      <Choice
        label="Writing hand"
        options={[
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "both", label: "Both" },
        ]}
        value={d.value}
        onChange={(value) => u({ value })}
      />
    ),
  }),
  def({
    key: "notes",
    icon: NotebookPen,
    title: "notes",
    summarize: (v) => v.text,
    render: (d, u) => (
      <TextAreaField
        label="Anything else a parent or clinician should know"
        value={d.text}
        onChange={(text) => u({ text })}
      />
    ),
  }),
];

export function ClinicalSection({ childId }: { childId: string | null }) {
  const query = useClinicalProfileQuery(childId);

  // The dropdowns always render. Until saved details are available (no child
  // yet, still loading, or the table is not set up) they show empty forms
  // with saving switched off.
  const profile = query.data ?? emptyClinicalProfile;
  const disabledReason = !childId
    ? "Add a child to save these details."
    : query.isPending
      ? "Loading saved details..."
      : query.isError
        ? "Saving is unavailable right now."
        : null;

  return (
    <DisclosureGroup
      title="clinical profile"
      description="Optional. Used only to help interpret this child's results. Never shared, and never a diagnosis."
    >
      {SECTIONS.map((section) => {
        const saved = profile[section.key];
        const filled = hasSectionData(saved);
        const summary = filled ? section.summarize(saved) : "Not added";
        return (
          <Disclosure
            key={section.key}
            icon={section.icon}
            title={section.title}
            summary={summary || "Added"}
          >
            {/* Re-keyed on the saved value so the draft re-seeds after a
                save or a refetch instead of drifting from the server. */}
            <SectionForm
              key={JSON.stringify(saved)}
              childId={childId}
              section={section.key}
              saved={saved}
              disabledReason={disabledReason}
            >
              {section.render}
            </SectionForm>
          </Disclosure>
        );
      })}
    </DisclosureGroup>
  );
}
