"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Gamepad2, Gauge, Palette, Volume2 } from "lucide-react";
import { useSettingsStore, type SessionLength, type TextSize } from "@/lib/settings/store";
import { Disclosure, DisclosureGroup } from "./Disclosure";
import { Choice, Switch } from "./fields";

const subscribe = () => () => {};

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const TEXT_SIZES: readonly { value: TextSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
];

const SESSION_LENGTHS: readonly { value: SessionLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "long", label: "Long" },
];

// Settings live on the device, so each control writes straight to the store
// (and next-themes for theme) with no Save step.
export function SettingsSection() {
  const { theme, setTheme } = useTheme();
  // The stored values only exist on the client; render defaults until mounted
  // so server and first client render agree.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const s = useSettingsStore();
  const set = s.set;

  const themeValue = mounted ? ((theme as string | undefined) ?? "system") : "system";

  return (
    <DisclosureGroup
      title="settings"
      description="Saved on this device."
    >
      <Disclosure
        icon={Palette}
        title="appearance"
        summary={mounted ? `${label(THEMES, themeValue)} theme · ${label(TEXT_SIZES, s.textSize)} text` : undefined}
      >
        <Choice
          label="Theme"
          options={THEMES}
          value={themeValue as "system" | "light" | "dark"}
          allowClear={false}
          onChange={(value) => value && setTheme(value)}
        />
        <Choice
          label="Text size"
          options={TEXT_SIZES}
          value={s.textSize}
          allowClear={false}
          onChange={(textSize) => textSize && set({ textSize })}
        />
      </Disclosure>

      <Disclosure
        icon={Volume2}
        title="audio and feel"
        summary={
          mounted
            ? `Sound ${s.soundEnabled ? "on" : "off"} · Haptics ${s.hapticsEnabled ? "on" : "off"}`
            : undefined
        }
      >
        <Switch
          label="Sound"
          description="Game sound effects."
          checked={s.soundEnabled}
          onChange={(soundEnabled) => set({ soundEnabled })}
        />
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor="settings-volume"
            className="font-pixel flex justify-between text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]"
          >
            <span>Volume</span>
            <span>{s.volume}%</span>
          </label>
          <input
            id="settings-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            value={s.volume}
            disabled={!s.soundEnabled}
            onChange={(e) => set({ volume: Number(e.target.value) })}
            className="h-2 w-full cursor-pointer accent-[#1b1b1b] dark:accent-[#f2f2f2] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Switch
          label="Haptics"
          description="Vibration feedback on supported devices."
          checked={s.hapticsEnabled}
          onChange={(hapticsEnabled) => set({ hapticsEnabled })}
        />
      </Disclosure>

      <Disclosure
        icon={Gauge}
        title="motion"
        summary={mounted ? (s.reduceMotion ? "Reduced" : "Default") : undefined}
      >
        <Switch
          label="Reduce motion"
          description="Turns off animations and transitions."
          checked={s.reduceMotion}
          onChange={(reduceMotion) => set({ reduceMotion })}
        />
      </Disclosure>

      <Disclosure
        icon={Gamepad2}
        title="game preferences"
        summary={mounted ? `${label(SESSION_LENGTHS, s.sessionLength)} sessions` : undefined}
      >
        <Choice
          label="Session length"
          options={SESSION_LENGTHS}
          value={s.sessionLength}
          allowClear={false}
          onChange={(sessionLength) => sessionLength && set({ sessionLength })}
        />
      </Disclosure>
    </DisclosureGroup>
  );
}

function label(options: readonly { value: string; label: string }[], v: string) {
  return options.find((o) => o.value === v)?.label ?? v;
}
