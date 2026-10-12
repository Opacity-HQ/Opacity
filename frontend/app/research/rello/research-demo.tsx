"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/queries/api-error";
import { useRelloMetadata, useRelloPrediction } from "@/lib/queries/rello-research";
import { relloInputSchema } from "@/lib/research/rello-contract";

export default function ResearchDemo() {
  const metadata = useRelloMetadata();
  const prediction = useRelloPrediction();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  function edit(value: string) {
    setInput(value);
    setInputError(null);
    prediction.reset();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    prediction.reset();
    let value: unknown;
    try {
      value = JSON.parse(input);
    } catch {
      setInputError("Enter valid JSON, or load one of the examples.");
      return;
    }
    const parsed = relloInputSchema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setInputError(`${issue.path.join(".") || "Input"}: ${issue.message}`);
      return;
    }
    setInputError(null);
    prediction.mutate(parsed.data);
  }

  if (metadata.isPending) return <p role="status" className="mt-8">Connecting to the research model…</p>;
  if (metadata.isError) {
    const unauthorized = metadata.error instanceof ApiError && metadata.error.code === "unauthorized";
    return (
      <section className="mt-8 rounded-2xl border border-border p-6">
        <p role="alert">{metadata.error.message}</p>
        {unauthorized ? <Link href="/" className="mt-4 inline-block underline">Sign in or continue as a guest from home</Link>
          : <Button className="mt-4" variant="outline" onClick={() => metadata.refetch()}>Retry connection</Button>}
      </section>
    );
  }

  const data = metadata.data;
  return (
    <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="font-pixel text-2xl">Task counts</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The examples below contain invented counts, not participant records. You can also paste a Rello-compatible input.
          Use null for missing counts; zero clicks means the task was unattempted.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          <Button variant="outline" disabled={prediction.isPending} onClick={() => edit(JSON.stringify(data.examples.complete, null, 2))}>Load complete example</Button>
          <Button variant="outline" disabled={prediction.isPending} onClick={() => edit(JSON.stringify(data.examples.partial, null, 2))}>Load missing-data example</Button>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="rello-input" className="text-sm font-semibold">Rello input JSON</label>
          <Textarea id="rello-input" value={input} onChange={(event) => edit(event.target.value)}
            disabled={prediction.isPending} spellCheck={false} aria-describedby="rello-input-help"
            aria-invalid={Boolean(inputError)} className="mt-2 h-72 resize-y overflow-auto border-border bg-background text-sm [field-sizing:fixed]"
            placeholder="Load an example to start." />
          <p id="rello-input-help" className="mt-3 text-xs leading-5 text-muted-foreground">Required tasks: {data.taskList}. Each needs clicks, hits, and misses. No names, diagnoses, or child IDs.</p>
          {inputError && <p role="alert" className="mt-3 text-sm text-destructive">{inputError}</p>}
          {prediction.isError && <p role="alert" className="mt-3 text-sm text-destructive">{prediction.error.message}</p>}
          <Button type="submit" size="lg" disabled={!input.trim() || prediction.isPending} className="mt-5">
            {prediction.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <FlaskConical aria-hidden="true" />}
            {prediction.isPending ? "Running model…" : "Run research prediction"}
          </Button>
        </form>
      </section>

      <div className="min-w-0 space-y-6">
        <section aria-live="polite" aria-busy={prediction.isPending} className="rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="font-pixel text-2xl">Model result</h2>
          {prediction.data ? (
            <>
              <p className="mt-5 text-4xl font-semibold tabular-nums">{prediction.data.score.toFixed(4)}</p>
              <p className="mt-2 text-sm">Research model score, on a scale from 0 to 1</p>
              <p className="mt-4 font-semibold">{prediction.data.above_threshold ? "At or above" : "Below"} the benchmark cutoff ({prediction.data.threshold.toFixed(4)})</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{prediction.data.active_task_count}/19 tasks have usable, nonzero counts. {prediction.data.missing_feature_count}/42 features were missing.</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">{prediction.data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              <p className="mt-5 break-all text-xs text-muted-foreground">Model: {prediction.data.model_id}</p>
            </>
          ) : <p className="mt-4 text-sm leading-6 text-muted-foreground">Load an example and run the model to see its score. Results are not saved to a child&apos;s profile.</p>}
        </section>

        <section className="rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="font-pixel text-2xl">What this model can tell us</h2>
          <p className="mt-3 text-sm leading-6">The score is not a calibrated clinical probability or a diagnosis. The model was trained on Rello desktop development data, with 42 features.</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><dt>Desktop holdout ROC-AUC</dt><dd>{data.evaluation.desktop_holdout.roc_auc.toFixed(3)}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>Tablet transfer ROC-AUC</dt><dd>{data.evaluation.tablet_external.roc_auc.toFixed(3)}</dd></div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">At the selected cutoff, desktop sensitivity was {(data.evaluation.desktop_holdout.sensitivity * 100).toFixed(1)}% and specificity was {(data.evaluation.desktop_holdout.specificity * 100).toFixed(1)}%. False positives remain frequent.</p>
        </section>
      </div>
    </div>
  );
}
