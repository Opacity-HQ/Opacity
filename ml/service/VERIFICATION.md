# Verification of the preliminary research integration

Base: `Opacity-HQ/Opacity`, alignment branch commit `3584119`.

| Check | Result |
| --- | --- |
| Python unittest suite | 10 passed, including 8 serving tests and 2 existing database-contract tests |
| Node integration runner | 8 passed, including the existing Letter Detective tests and the new research-route tests |
| Complete and missing-data scores | Match the original serialized pipeline to 14 decimal places |
| Next handler → running Python service | Metadata and both synthetic examples pass; returned predictions equal direct Python results |
| Model loading | Exact release SHA-256, pinned library versions, feature/class order and report cutoff checked |
| Invalid/foreign input | Rejected; labels, child IDs, strings, booleans, fractions, negative/invalid counts and empty assessments tested |
| Access and upstream failures | Disabled/signed-out requests do not forward; bad service keys and outages tested |
| Next production build | Passed, including TypeScript and both new routes |
| ESLint | 0 errors; 3 pre-existing unused-import warnings in `lib/dotmatrix-core.tsx` |
| Production Next server, signed-out request | Actual `/api/research/rello` returned 401 with the demo enabled |
| Interactive browser / responsive layout | Pending manual verification: the available headless browser process crashes in this environment |
| Real Supabase signed-in session | Pending verification in the user's project; integration tests supply a simulated authenticated user |
| Live deployment | Not performed |

No retraining, holdout-based tuning, participant-data upload or child-report write was performed. The frozen score for the complete synthetic example is approximately `0.07789592879369865`; the locked cutoff is `0.09222979590471463`.

Run the commands in [README.md](README.md) to reproduce the API checks, then complete the manual browser and project sign-in checks before publishing the demo.
