# Opacity gameplay classification prototype

The localhost website now has an end-to-end **synthetic-data prototype**:

`finish an Opacity game -> saved server scores -> 25 gameplay features -> trained model -> in-game class + confidence`

It displays **Dyslexia** or **No dyslexia** under **Simulated result**. The labels
and training distributions are invented for software development. The output
does not establish that a player has or does not have dyslexia. No real-world
accuracy, diagnostic sensitivity, or clinical probability has been measured.

## Try it locally

1. Keep the existing Supabase configuration in `frontend/.env.local`.
2. From `frontend`, run `npm run dev` and open the localhost URL it prints.
3. Sign in or use the existing guest flow, then select/create a child profile.
4. Finish a full session of any game: Letter Detective, Sound Match, Word Builder,
   Memory Quest or Rapid Match. Finish every scored round;
   abandoning a session does not count.
5. On that game's completion screen, **Your experimental classification** automatically
   shows **Dyslexia** or **No dyslexia** and **Model confidence: X.X%**. No page change is needed.
   Play more games with the same child to update the combined result (latest valid
   completed session per game within seven days). The dashboard also includes the panel.
   Use **Refresh result** to retry a failed read or check a session completed in another tab.

Confidence is the exported logistic model's probability for the selected simulated
class: `score` for Dyslexia, `1 - score` for No dyslexia. It is not a measured
probability of the player having dyslexia or a calibrated diagnostic certainty.

Python and Render are **not needed to serve this prototype**. The trained model
is a small JSON export loaded by the Next.js server. Python is used only to
retrain and verify it. The Rello research service remains separate.

The panel and endpoint are enabled by default in development. To disable them,
set `OPACITY_GAMEPLAY_PROTOTYPE_ENABLED=false`. Production (`npm run build` then
`npm run start`, including Vercel) defaults to disabled; set that server variable
to exactly `true` only for an intended experimental deployment. Restart after
changing environment variables. No cloud configuration was changed here.

## Data and model contract

The shared [contract](../../frontend/lib/gameplay/contract.json) fixes game order,
score/plan versions, accepted difficulty ranges and feature order. Each game
contributes these four measurements:

| Feature | Meaning |
| --- | --- |
| `accuracy` | Server-computed fraction in `[0,1]`; Memory Quest uses partial round credit |
| `log_mean_rt_ms` | `log(1 + mean_rt_ms)`, computed separately for each game |
| `rt_cv` | Server-computed response-time coefficient of variation |
| `difficulty_level` | Saved session difficulty; Memory Quest 1–20, other games 1–4 |

No Rello columns are reused. Names, age, clinical history, prior diagnosis,
mastery, XP, and past predictions do not enter the model. Throughput and
mirror-error columns are not used. The v2 contract adds five binary availability
flags after the 20 measurements. Missing games contribute four missing measurements
and an availability flag of zero. Training includes random subsets of one to five games,
independent of the invented label, so partial coverage is represented during fitting.

`GET /api/experimental/gameplay?childId=<uuid>` uses `requireChildAccess` and the
same RLS-scoped Supabase client to read the newest completed session per game.
Queries filter by child, game, completion status and the rolling seven-day
window, with a deterministic ID tie-break. No client-provided score vector is
accepted. Completion screens add `&sessionId=<uuid>`; the API withholds a result
until that exact session is among the valid scores being classified. Missing/broken
database access fails instead of fabricating a result.

For each session, the extractor verifies the plan and score versions, unique
trial indices, nonempty scored counts, all planned scored rounds completed,
valid accuracy/difficulty/timestamps and finite nonnegative timings. Warmups
are excluded; Memory Quest scores all rounds. A newer invalid completed session
blocks that game rather than silently substituting an older score. Null timing
values remain missing until the fitted imputer handles them; zero accuracy is
an observed measurement. The UI reports the number of imputed measurements,
including measurements missing because a game has not been played.

The seven-day window and one-complete-game minimum are engineering choices
for this prototype, not validated assessment criteria. Task variations, device,
language, age and experience are not controlled in this experiment.

The endpoint returns either `needs_games` with per-game reasons, or `ready`
with model/contract versions, source session IDs, score, confidence, cutoff, binary class,
and explicit `simulated: true` / `trainingSource: "synthetic"` provenance.
Responses use `private, no-store`. Results are computed from saved scores on
demand and are not inserted into `screening_reports`. Existing authentication,
game grading, dashboard charts and Rello serving remain in place.

## Training and reproducibility

The model is median imputation -> standard scaling -> logistic regression,
trained using the repository's existing pinned scikit-learn environment.
`train.py` creates 1,200 synthetic participants with two observations each.
Its arbitrary simulator correlates invented class labels with accuracy,
timing and variability; this is not a claim about actual dyslexia. Difficulty
is sampled independently. Five percent of timing values are made missing.

Participants are split 80/20 with a fixed seed (`20261013`); no participant is
in both partitions. Imputation/scaling/model fitting use only training rows.
The cutoff is the fixed prototype value `0.5`. It is not tuned on the holdout.

From the repository root, with the existing `ml/.venv` environment:

```powershell
.\ml\.venv\Scripts\python.exe -m ml.gameplay.train --synthetic
.\ml\.venv\Scripts\python.exe -m unittest discover -s ml/tests -v
cd frontend
npm run test:gameplay
npm run lint
npm run build
```

If creating a fresh Python 3.12 environment, install
`ml/service/requirements-dev.txt` to run the complete existing test suite.

Training exports `frontend/lib/gameplay/model.json` and Python parity fixtures.
Only synthetic-derived numeric weights are tracked; no participant dataset or
pickle is required. `training_report.json` records the artifact SHA-256,
package versions, split counts, and **synthetic holdout** metrics. These metrics
measure reproduction of the simulator, not performance on people.

The serving model checks feature order, provenance, class order, finite weights
and positive scales. Tests compare the TypeScript result with sklearn within
`1e-12`, including missing values. Tests exercise both binary classes, partial
and empty games, stale/future sessions, invalid measurements, child filtering,
authentication failures, database errors, feature flagging and source IDs.

### Browser regression check

After building, start an isolated server from `frontend`:

```powershell
$env:OPACITY_GAMEPLAY_PROTOTYPE_ENABLED='true'
npm run start -- --port 3011
```

In a second terminal in `frontend`, run `node tests/gameplay-browser.mjs`.
It uses headless Edge on Windows; `GAMEPLAY_TEST_BROWSER` can specify another
Chromium executable, and `GAMEPLAY_TEST_URL` overrides the server URL.
The suite plays shortened synthetic plans in all five real game screens and
runs the actual trial grading, completion and inference handlers with in-memory
storage. It checks class/confidence, current-session inclusion, combined game
coverage, responsive layouts, keyboard/pointer refresh, outage recovery and replay.
Screenshots are saved under ignored `.next/gameplay-qa/`. Authentication, live
Supabase persistence, RLS and deployed migrations still require a separate live check.

## From prototype to an evidence-based model

The software path is now implemented. To replace the simulation with a model
that can be evaluated for real dyslexia screening:

1. Freeze an assessment protocol and collect consented gameplay plus independent
   reference labels and provenance. A profile's self-reported diagnosis alone
   is not verified ground truth; model outputs must never become training labels.
2. Export this versioned feature vector with pseudonymous participant IDs and
   assessment metadata; keep repeated participants out of different partitions.
3. Retrain preprocessing and the classifier using the real training partition.
   Select any operating cutoff on development data, then evaluate held-out
   participants and relevant age/language/device groups.
4. Register a new model ID and honest training provenance, update the serving
   schema deliberately, and repeat parity, access-control and website checks.
   The current loader intentionally only accepts the synthetic prototype.

The remaining evidence collection is separate from software integration. Until
then, this remains an internal demonstration with simulated classes.
