"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  KeyRound,
  LogOut,
  Pencil,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { DashboardChild } from "@/lib/queries/dashboard";
import {
  useChangeEmailMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useDeleteChildMutation,
  useDeleteClinicalProfileMutation,
  useSignOutEverywhereMutation,
  useSignOutMutation,
  useUpdateChildMutation,
} from "@/lib/queries/profile";
import { Disclosure, DisclosureGroup } from "./Disclosure";
import { GhostButton, PrimaryButton, TextField } from "./fields";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Builds a plain CSV of one child's results from data the dashboard already
// loaded, so exporting needs no extra request.
function buildResultsCsv(child: DashboardChild) {
  const rows: unknown[][] = [
    ["child", child.displayName],
    ["birth year", child.birthYear],
    ["grade", child.gradeLevel ?? ""],
    [],
    ["game", "sessions completed", "difficulty level", "last played"],
    ...child.games.map((g) => [
      g.gameName,
      g.sessionsCompleted,
      g.difficultyLevel,
      g.lastPlayedAt ?? "",
    ]),
    [],
    ["skill", "mastery", "difficulty level", "streak"],
    ...child.skills.map((s) => [s.skillKey, s.mastery, s.difficultyLevel, s.streak]),
    [],
    ["latest screening band", child.latestReport?.riskBand ?? ""],
    ["report generated", child.latestReport?.generatedAt ?? ""],
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Edits the selected child's name and age. Keyed by the child + saved values
// by the parent so the fields re-seed whenever the saved data changes.
function NameAgeForm({ child }: { child: DashboardChild }) {
  const router = useRouter();
  const update = useUpdateChildMutation();
  const savedAge = Math.max(0, new Date().getFullYear() - child.birthYear);
  const [name, setName] = useState(child.displayName);
  const [age, setAge] = useState(String(savedAge));
  const [saved, setSaved] = useState(false);

  const ageNumber = Number(age);
  const maxAge = new Date().getFullYear() - 1990;
  const ageValid =
    age.trim() !== "" &&
    Number.isInteger(ageNumber) &&
    ageNumber >= 0 &&
    ageNumber <= maxAge;
  const dirty = name.trim() !== child.displayName || ageNumber !== savedAge;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(
          { childId: child.id, displayName: name.trim(), age: ageNumber },
          {
            onSuccess: () => {
              setSaved(true);
              // The header's greeting is rendered on the server.
              router.refresh();
            },
          },
        );
      }}
    >
      <TextField
        label="Name"
        value={name}
        onChange={(v) => {
          setSaved(false);
          setName(v);
        }}
        maxLength={80}
      />
      <TextField
        label="Age"
        type="number"
        value={age}
        onChange={(v) => {
          setSaved(false);
          setAge(v);
        }}
        hint={`Whole years, up to ${maxAge}.`}
        maxLength={3}
      />
      <div className="flex items-center gap-3">
        <PrimaryButton
          type="submit"
          disabled={!dirty || !name.trim() || !ageValid || update.isPending}
        >
          {update.isPending ? "saving..." : "save"}
        </PrimaryButton>
        {saved && !dirty ? (
          <span role="status" className="font-pixel text-[13px] text-emerald-600 dark:text-emerald-400">
            saved
          </span>
        ) : null}
        {age.trim() !== "" && !ageValid ? (
          <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
            enter an age from 0 to {maxAge}
          </span>
        ) : null}
        {update.isError ? (
          <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
            {update.error.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

// A destructive action that must be confirmed by typing a word.
function DangerAction({
  title,
  description,
  word,
  actionLabel,
  pending,
  error,
  onConfirm,
}: {
  title: string;
  description: string;
  word: string;
  actionLabel: string;
  pending: boolean;
  error: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  return (
    <div className="flex flex-col gap-3 rounded-[13px] border border-[#e8c8c8] dark:border-[#5c2b2b] bg-[#f9f0f0] dark:bg-[#2a1a1a] p-3">
      <div>
        <p className="font-pixel text-[15px] text-[#991b1b] dark:text-[#fca5a5]">
          {title}
        </p>
        <p className="font-sauce text-[13px] text-[#991b1b] dark:text-[#fca5a5]">
          {description}
        </p>
      </div>
      <TextField
        label={`Type ${word} to confirm`}
        value={typed}
        onChange={setTyped}
        maxLength={20}
      />
      <PrimaryButton
        disabled={typed !== word || pending}
        onClick={onConfirm}
        className="w-fit"
      >
        {pending ? "working..." : actionLabel}
      </PrimaryButton>
      {error ? (
        <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
          Something went wrong. Please try again.
        </span>
      ) : null}
    </div>
  );
}

export function AccountSection({
  email,
  isGuest,
  child,
}: {
  email: string | null;
  isGuest: boolean;
  child: DashboardChild | null;
}) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const changeEmail = useChangeEmailMutation();
  const changePassword = useChangePasswordMutation();
  const signOut = useSignOutMutation();
  const signOutEverywhere = useSignOutEverywhereMutation();
  const deleteClinical = useDeleteClinicalProfileMutation();
  const deleteChild = useDeleteChildMutation();
  const deleteAccount = useDeleteAccountMutation();

  const leave = () => {
    router.push("/");
    router.refresh();
  };

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  return (
    <DisclosureGroup title="account" description="Sign-in details and your data.">
      <Disclosure
        icon={Pencil}
        title="name and age"
        summary={
          child
            ? `${child.displayName} · ${Math.max(0, new Date().getFullYear() - child.birthYear)} years old`
            : "No child yet"
        }
      >
        {child ? (
          <NameAgeForm
            key={`${child.id}-${child.displayName}-${child.birthYear}`}
            child={child}
          />
        ) : (
          <p className="font-sauce text-[13px] text-[#8e8e8e]">
            Add a child first to edit their name and age.
          </p>
        )}
      </Disclosure>

      <Disclosure
        icon={KeyRound}
        title="email and password"
        summary={isGuest ? "Guest" : (email ?? undefined)}
      >
        {isGuest ? (
          <p className="font-sauce text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
            You are playing as a guest, so there is no email or password to
            manage. Sign in from the home page to keep your progress.
          </p>
        ) : (
          <>
            <p className="font-sauce text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Signed in as <span className="font-medium">{email}</span>
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                changeEmail.mutate(newEmail, {
                  onSuccess: () => {
                    setNotice("Check your new email to confirm the change.");
                    setNewEmail("");
                  },
                });
              }}
            >
              <TextField
                label="New email"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                maxLength={254}
              />
              <PrimaryButton
                type="submit"
                disabled={!newEmail.trim() || changeEmail.isPending}
                className="w-fit"
              >
                {changeEmail.isPending ? "saving..." : "change email"}
              </PrimaryButton>
              {changeEmail.isError ? (
                <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
                  {changeEmail.error.message}
                </span>
              ) : null}
            </form>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                changePassword.mutate(password, {
                  onSuccess: () => {
                    setNotice("Password updated.");
                    setPassword("");
                    setConfirm("");
                  },
                });
              }}
            >
              <TextField
                label="New password"
                type="password"
                value={password}
                onChange={setPassword}
                hint="At least 8 characters."
                maxLength={72}
              />
              <TextField
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={setConfirm}
                maxLength={72}
              />
              {passwordMismatch ? (
                <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
                  Passwords do not match.
                </span>
              ) : null}
              <PrimaryButton
                type="submit"
                disabled={
                  password.length < 8 || password !== confirm || changePassword.isPending
                }
                className="w-fit"
              >
                {changePassword.isPending ? "saving..." : "change password"}
              </PrimaryButton>
              {changePassword.isError ? (
                <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
                  {changePassword.error.message}
                </span>
              ) : null}
            </form>
            {notice ? (
              <p role="status" className="font-pixel text-[13px] text-emerald-600 dark:text-emerald-400">
                {notice}
              </p>
            ) : null}
          </>
        )}
      </Disclosure>

      <Disclosure icon={LogOut} title="sign out">
        <div className="flex flex-wrap gap-3">
          <GhostButton
            disabled={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: leave })}
          >
            <LogOut className="size-4" aria-hidden /> sign out
          </GhostButton>
          {!isGuest ? (
            <GhostButton
              disabled={signOutEverywhere.isPending}
              onClick={() =>
                signOutEverywhere.mutate(undefined, { onSuccess: leave })
              }
            >
              sign out of all devices
            </GhostButton>
          ) : null}
        </div>
        {signOut.isError || signOutEverywhere.isError ? (
          <span role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400">
            Could not sign out. Please try again.
          </span>
        ) : null}
      </Disclosure>

      <Disclosure icon={Download} title="export results">
        {child ? (
          <>
            <p className="font-sauce text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Download {child.displayName}&apos;s game progress and skill scores
              as a CSV file, to share with a teacher or specialist.
            </p>
            <GhostButton
              className="w-fit"
              onClick={() =>
                downloadText(
                  `${child.displayName.replace(/\W+/g, "-").toLowerCase()}-results.csv`,
                  buildResultsCsv(child),
                )
              }
            >
              <Download className="size-4" aria-hidden /> download CSV
            </GhostButton>
          </>
        ) : (
          <p className="font-sauce text-[13px] text-[#8e8e8e]">
            No child selected yet.
          </p>
        )}
      </Disclosure>

      <Disclosure icon={ShieldAlert} title="delete data">
        {child ? (
          <>
            <DangerAction
              title={`Clear ${child.displayName}'s clinical profile`}
              description="Removes everything entered under clinical profile. Game results are kept."
              word="CLEAR"
              actionLabel="clear clinical profile"
              pending={deleteClinical.isPending}
              error={deleteClinical.isError}
              onConfirm={() => deleteClinical.mutate(child.id)}
            />
            <DangerAction
              title={`Delete ${child.displayName}`}
              description="Permanently removes this child, all game results, reports and the clinical profile."
              word="DELETE"
              actionLabel="delete child"
              pending={deleteChild.isPending}
              error={deleteChild.isError}
              onConfirm={() => deleteChild.mutate(child.id)}
            />
          </>
        ) : null}
        {!isGuest ? (
          <DangerAction
            title="Delete account"
            description="Permanently removes your account and every child and result stored under it. This cannot be undone."
            word="DELETE"
            actionLabel="delete account"
            pending={deleteAccount.isPending}
            error={deleteAccount.isError}
            onConfirm={() => deleteAccount.mutate(undefined, { onSuccess: leave })}
          />
        ) : null}
        <p className="font-sauce flex items-center gap-1.5 text-[12px] text-[#8e8e8e]">
          <Trash2 className="size-3.5" aria-hidden /> Deleted data cannot be
          recovered.
        </p>
      </Disclosure>
    </DisclosureGroup>
  );
}
