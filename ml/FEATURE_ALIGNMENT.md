# Feature alignment — 2026-10-09

Repository reviewed at base commit `8a80c719b5a3148c7bc13cb2e009b4c897482c3b`. This contract describes available measurements; it does not claim equivalence with the Rello dataset.

## Actual gameplay data

Join `session_scores.session_id` to `game_sessions.id` to recover `child_id`, `game_id`, difficulty, stored plan, device metadata and timestamps. `raw_features` is a game-specific JSON supplement: accuracy, mean/median reaction time, RT CV and throughput are **separate typed columns**, not duplicated inside that JSON. `time_to_first_move_ms` exists in trial rows but is not currently aggregated by completion handlers.

| Game | Accuracy definition | Additional raw feature keys | Interpretation |
| --- | --- | --- | --- |
| Letter Detective | Correct scored trials / scored trials; warmups excluded | `version`, `pair`, `trialsScored`, `errorTypeCounts`, `confusionErrorRate` (v2) | `mirror_error_rate` counts mirror errors only in v2; combined mirror/rotation/visual confusion is separate. Historical v1 rows retain the old definition and must be recomputed from trials or excluded |
| Memory Quest | Mean per-round partial accuracy; sequence matches earn positional credit | `version`, `level`, `roundsScored`, `perfectRounds`, `maxSequenceLength`, `longestRecalledSequence`, `attempts`, `errors`, `corrections`, `score`, `errorTypeCounts` | Not binary trial accuracy or a clinically validated memory-span test |
| Sound Match | Correct scored trials / scored trials; warmups excluded | `version`, `difficultyLevel`, `trialsScored`, `correctCount`, `errorTypeCounts`, `perLevelAccuracy`, `longestStreak`, `levelReached`, `xp` | Phonological game tasks; auditory fallback and device context require collection review |
| Rapid Match | Correct scored trials / scored trials; warmups excluded | `version`, `difficultyLevel`, `trialsScored`, `errorTypeCounts` | `mirror_error_rate` currently stores 0, without a mirror-specific calculation; exclude it from research predictors |
| Word Builder | Correct scored trials / scored trials; warmups excluded | `version`, `difficultyTier`, `trialsScored`, `transpositionErrorRate`, `errorTypeCounts` | Detailed error taxonomy is regraded into JSON; not all subtypes appear in `game_trials.error_type` |

Throughput uses correct trials/minute of server session duration. Memory Quest uses **perfect rounds** per minute. Timings describe different interactions across games; preserve game and task variant rather than treating all RTs as the same measurement. Reaction times include all recorded scored responses, including errors/timeouts when timed; correct-only RT would require a separate definition.

Completion handlers can score a partial sitting without enforcing all planned submissions. Zero accuracy may therefore represent no scored data. A future export must preserve scored counts and completeness and reject empty sittings before fitting; do not interpret an empty sitting as low ability.

## Rello benchmark interface

Inputs are `qXX_log_clicks`, `qXX_hit_rate`, and selected `qXX_miss_rate` for Q1–Q12, Q14–Q17, Q22–Q23, Q30. There are 42 deterministic features plus train-fitted missingness indicators. None of these `qXX` values is recorded by the current application. Rello hit-per-click rates and Opacity trial accuracy have different denominators and tasks; there is no validated direct mapping.

No columns, missing values or labels should be invented to make the web app fit this research model. Keep the Rello scripts and model separate from product prediction. `screening_reports` has a read path but no implemented generator; dashboard UI is still a placeholder.

## Database correction

`20261009150000_allow_memory_quest_error_types.sql` expands the existing trial constraint to accept Memory Quest's server-produced `order`, `item`, and `location` errors. The original six allowed values remain valid. Apply this new migration to the target Supabase project before expecting incorrect Memory Quest responses to persist. It has not been applied to a live project by this review.

## Collection and training boundary

For actual Opacity training, record pseudonymous participant identity, session/game/task versions, scored counts, completeness, reference-label provenance and assessment time. Establish a defined assessment window instead of arbitrarily mixing sessions at different adaptive levels. All sessions from one child must stay in one evaluation partition; recruitment-site grouping needs separate metadata.

Independent reference labels are not stored by the current game APIs. Do not use mastery, adaptive difficulty, XP, risk bands or the benchmark's own predictions as dyslexia ground truth. Keep assessment labels outside the predictor vector. Separate age, language and device analyses are needed before defining any product threshold.

## Remaining verification limits

Database migration execution, RLS behavior and authenticated end-to-end game persistence need a configured Supabase instance. A source checkout cannot establish what migrations or schema changes are already applied in the deployed project. This review does not validate clinical performance or claim complete application testing.
