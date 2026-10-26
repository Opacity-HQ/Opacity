"use client";

import { useState } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { useDashboardQuery } from "@/lib/queries/dashboard";
import { SettingsSection } from "./SettingsSection";
import { AccountSection } from "./AccountSection";
import { Choice } from "./fields";

function ageYears(birthYear: number) {
  return Math.max(0, new Date().getFullYear() - birthYear);
}

export default function ProfileClient({
  email,
  isGuest,
}: {
  email: string | null;
  isGuest: boolean;
}) {
  const dashboard = useDashboardQuery();
  const children = dashboard.data?.children ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to the first child until the user picks another.
  const child =
    children.find((c) => c.id === selectedId) ?? children[0] ?? null;

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-8 px-4 py-8 sm:py-10">
      {child ? (
        <header className="flex w-full flex-col items-center justify-center gap-5 sm:gap-6 px-1 text-center">
          <ProfileAvatar name={child.displayName} size={160} />
          <div className="flex min-w-0 flex-col items-center gap-2.5">
            <h1
              // Fluid size set inline: Tailwind's preflight resets h1 to the
              // body size, so a missing utility would silently shrink the name.
              style={{ fontSize: "clamp(36px, 11vw, 56px)" }}
              className="font-pixel leading-[1.05] text-[#1d1d1d] dark:text-[#f2f2f2] break-words"
            >
              {child.displayName}
            </h1>
            <p className="font-pixel text-[18px] sm:text-[22px] text-[#1d1d1d] dark:text-[#f2f2f2]">
              {ageYears(child.birthYear)} years old
              {child.gradeLevel ? `  ${child.gradeLevel}` : ""}
            </p>
          </div>
        </header>
      ) : (
        <header>
          <h1 className="font-pixel text-[28px] sm:text-[36px] leading-tight text-[#1d1d1d] dark:text-[#f2f2f2]">
            profile and settings
          </h1>
        </header>
      )}

      {children.length > 1 ? (
        <Choice
          label="Showing details for"
          options={children.map((c) => ({ value: c.id, label: c.displayName }))}
          value={child?.id ?? ""}
          allowClear={false}
          onChange={(id) => id && setSelectedId(id)}
        />
      ) : null}

      <SettingsSection />
      <AccountSection email={email} isGuest={isGuest} child={child} />
    </div>
  );
}
