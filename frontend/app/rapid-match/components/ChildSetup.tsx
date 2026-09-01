"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useCreateChildMutation } from "@/lib/queries/dashboard";

const currentYear = new Date().getFullYear();

export default function ChildSetup({
  onCreated,
}: {
  onCreated: (child: { id: string; displayName: string }) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const createChild = useCreateChildMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const child = await createChild.mutateAsync({
        displayName,
        birthYear: Number(birthYear),
      });
      onCreated({ id: child.id, displayName: child.displayName });
    } catch {
      // Surfaced via createChild.error below.
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center w-full max-w-sm gap-4 px-4"
    >
      <p className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d] text-center">
        Before we start, what should we call you?
      </p>
      <div className="flex flex-col items-start w-full gap-1">
        <label htmlFor="child-name" className="font-pixel text-[13px] text-[#5e5e5e]">
          your name
        </label>
        <Input
          id="child-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Sam"
          required
          className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] !px-[15px] bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus-visible:ring-0 focus-visible:outline-none"
        />
      </div>
      <div className="flex flex-col items-start w-full gap-1">
        <label htmlFor="child-year" className="font-pixel text-[13px] text-[#5e5e5e]">
          birth year
        </label>
        <Input
          id="child-year"
          type="number"
          min={1990}
          max={currentYear}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder={String(currentYear - 8)}
          required
          className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] !px-[15px] bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus-visible:ring-0 focus-visible:outline-none"
        />
      </div>
      {createChild.isError && (
        <p role="alert" className="font-pixel text-[13px] text-red-600">
          {createChild.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={createChild.isPending}
        data-cuelume-press
        data-cuelume-release
        className="font-pixel text-[16px] flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full"
      >
        {createChild.isPending ? "saving..." : "let's go"}
      </button>
    </form>
  );
}
