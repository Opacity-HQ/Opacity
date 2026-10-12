"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const labelClass =
  "font-pixel text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]";
const chipBase =
  "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-pixel text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b] dark:focus-visible:outline-[#f2f2f2]";
const chipOff =
  "border-[#e0e0e0] bg-white text-[#1d1d1d] hover:bg-[#f7f7f7] dark:border-[#333333] dark:bg-[#141414] dark:text-[#f2f2f2] dark:hover:bg-[#2a2a2a]";
// Selected state is a filled chip *and* a check mark, so it never relies on
// colour alone.
const chipOn =
  "border-[#1b1b1b] bg-[#1b1b1b] text-white dark:border-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#1b1b1b]";

export const inputClass =
  "font-pixel h-[40px] w-full rounded-[13px] !text-[15px] !px-[14px] bg-white dark:bg-[#1a1a1a] border-[1px] border-[#e0e0e0] dark:border-[#333333] focus:border-[#949494] focus-visible:ring-0 focus-visible:outline-none";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span className="font-sauce text-[12px] text-[#8e8e8e]">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  maxLength = 120,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint ? (
        <span className="font-sauce text-[12px] text-[#8e8e8e]">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 1000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="font-pixel min-h-[84px] rounded-[13px] border-[#e0e0e0] dark:border-[#333333] bg-white dark:bg-[#1a1a1a] px-[14px] py-[10px] !text-[15px] focus-visible:ring-0 focus:border-[#949494]"
      />
    </div>
  );
}

// Pick exactly one option. Pass `allowClear` to let a second click unset it.
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  allowClear = true,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (value: T | "") => void;
  allowClear?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <span className={labelClass}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() =>
                onChange(selected && allowClear ? "" : option.value)
              }
              className={cn(chipBase, selected ? chipOn : chipOff)}
            >
              {selected ? <Check className="size-3.5" aria-hidden /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Pick any number of options.
export function MultiChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <span className={labelClass}>{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((v) => v !== option.value)
                    : [...value, option.value],
                )
              }
              className={cn(chipBase, selected ? chipOn : chipOff)}
            >
              {selected ? <Check className="size-3.5" aria-hidden /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <div className="flex flex-col items-start">
        <span className="font-pixel text-[15px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          {label}
        </span>
        {description ? (
          <span className="font-sauce text-[12px] text-[#8e8e8e]">
            {description}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-8 min-w-[72px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 font-pixel text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b] dark:focus-visible:outline-[#f2f2f2]",
          checked ? chipOn : chipOff,
        )}
      >
        {checked ? <Check className="size-3.5" aria-hidden /> : null}
        {checked ? "on" : "off"}
      </button>
    </div>
  );
}

export function PrimaryButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "font-pixel text-[15px] flex items-center justify-center rounded-[13px] bg-[#1b1b1b] hover:bg-[#323232] dark:bg-[#f2f2f2] dark:hover:bg-white text-white dark:text-[#1b1b1b] px-5 py-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export function GhostButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "font-pixel text-[15px] flex items-center justify-center gap-2 rounded-[13px] border border-[#e0e0e0] dark:border-[#333333] bg-white dark:bg-[#141414] hover:bg-[#f7f7f7] dark:hover:bg-[#2a2a2a] text-[#1d1d1d] dark:text-[#f2f2f2] px-4 py-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
