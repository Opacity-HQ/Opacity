import Link from "next/link";
import ResearchDemo from "./research-demo";

// The enabled flag is evaluated at request time, including after deployment.
export const dynamic = "force-dynamic";

export default function RelloResearchPage() {
  return (
    <main className="font-sauce w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12 text-foreground">
      <nav className="mb-8 flex flex-wrap gap-5 text-sm" aria-label="Research navigation">
        <Link href="/" className="underline underline-offset-4">Opacity home</Link>
        <Link href="/dashboard" className="underline underline-offset-4">Dashboard</Link>
      </nav>
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest">Research demo</p>
      <h1 className="font-pixel text-3xl sm:text-4xl">Try the first ML baseline</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
        Run the saved Random Forest on Rello task counts. Opacity&apos;s five games use different inputs;
        this demo does not assess a child&apos;s gameplay or create a screening report.
      </p>
      {process.env.OPACITY_RESEARCH_DEMO_ENABLED === "true" ? <ResearchDemo /> : (
        <p className="mt-8 rounded-2xl border border-border p-6">The research demo is not enabled on this website yet.</p>
      )}
    </main>
  );
}
