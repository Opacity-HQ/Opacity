import Link from "next/link";
import DashboardView from "./components/DashboardView";

export default function DashboardPage() {
  return (
    <>
      {process.env.OPACITY_RESEARCH_DEMO_ENABLED === "true" && (
        <div className="w-full px-4 py-4 text-center sm:px-6">
          <Link
            href="/research/rello"
            className="inline-flex rounded-2xl border border-border px-5 py-3 font-sauce text-sm text-foreground underline underline-offset-4"
          >
            Open the ML research demo
          </Link>
        </div>
      )}
      <DashboardView />
    </>
  );
}