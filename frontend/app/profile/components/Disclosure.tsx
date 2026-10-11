"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// One bordered card holding a list of collapsible rows (see the template on
// the profile page). A row's header is always visible; its body is the form
// plus whatever is already saved.
export function DisclosureGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-2">
      <div className="px-1">
        <h2 className="font-pixel text-[20px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          {title}
        </h2>
        {description ? (
          <p className="font-sauce mt-0.5 text-[13px] leading-[18px] text-[#5e5e5e] dark:text-[#a3a3a3]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="w-full overflow-hidden rounded-[16px] border border-[#efefef] dark:border-[#262626] divide-y divide-[#efefef] dark:divide-[#262626]">
        {children}
      </div>
    </section>
  );
}

export function Disclosure({
  icon: Icon,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** One line shown under the title while collapsed (e.g. "Not added"). */
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f7f7f7] dark:hover:bg-[#1f1f1f] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1b1b1b] dark:focus-visible:outline-[#f2f2f2]"
      >
        <Icon
          className="size-5 shrink-0 text-[#1d1d1d] dark:text-[#f2f2f2]"
          aria-hidden
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-pixel text-[17px] leading-tight text-[#1d1d1d] dark:text-[#f2f2f2]">
            {title}
          </span>
          {summary && !open ? (
            <span className="font-sauce truncate text-[12px] text-[#8e8e8e]">
              {summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-[#8e8e8e] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-[#efefef] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0f0f0f] px-4 py-4">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
