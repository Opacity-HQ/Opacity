# Preliminary website ML integration

The website now has a Rello research demo at `/research/rello`. It calls the frozen Random Forest through a signed-in Next.js route and an internal FastAPI service. It does not use Opacity game sessions, create child records or write `screening_reports`.

## Local setup on Windows

Run from `C:\Users\Saatvik\Opacity`. Use Python **3.12** and Node.js **20.9+**. Keep the website's existing Supabase configuration in `frontend/.env.local`.

1. Create the environment and install dependencies:

   ```powershell
   py -3.12 -m venv ml\.venv
   .\ml\.venv\Scripts\python.exe -m pip install -r ml\service\requirements-dev.txt
   ```

2. Install the **original** model, either from the accompanying integration ZIP or the earlier baseline ZIP:

   ```powershell
   .\ml\.venv\Scripts\python.exe -m ml.service.install_model "C:\path\to\model\rello_baseline.joblib"
   ```

   The installer checks the exact release SHA-256 before copying it into `ml/service/artifacts/`. Startup also checks the checksum, library versions, feature order, class mapping and original development-selected cutoff. A fresh training run may serialize differently even if it has equivalent scores; it is not this pinned artifact. Do not retrain to set up serving.

3. Generate a secret, keep it locally, and use the same value in both servers:

   ```powershell
   .\ml\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

   Add these lines to **the existing** `frontend/.env.local` (do not overwrite its Supabase settings):

   ```dotenv
   OPACITY_RESEARCH_DEMO_ENABLED=true
   ML_SERVICE_URL=http://127.0.0.1:8000
   ML_SERVICE_API_KEY=<the generated secret>
   ```

   None of these variables should use a `NEXT_PUBLIC_` prefix. The research flag controls both the page's active demo and its API. It defaults to disabled. The dashboard link appears when enabled.

4. In terminal 1, from the repository root:

   ```powershell
   $env:ML_SERVICE_API_KEY="<the same generated secret>"
   .\ml\.venv\Scripts\python.exe -m uvicorn ml.service.app:app --host 127.0.0.1 --port 8000
   ```

   Python does not automatically read `frontend/.env.local` or `ml/service/.env.example`.

5. In terminal 2:

   ```powershell
   cd C:\Users\Saatvik\Opacity\frontend
   npm ci
   npm run dev
   ```

6. Open `http://localhost:3000`, sign in or use the existing guest flow, then visit **`http://localhost:3000/research/rello`**. Load the complete example and run the model. Its score should be approximately **0.0778959288**, below the frozen cutoff **0.0922297959**. Load the missing-data example next to confirm the missing-feature count changes. The examples contain invented counts, never real participant records.

## Request contract

- Exactly `schema_version: "rello-counts-v1"` and a `tasks` object.
- Tasks: Q1–Q12, Q14–Q17, Q22, Q23 and Q30. All 19 keys are required.
- Each task contains exactly `clicks`, `hits`, `misses`: nonnegative integer counts up to 1,000,000, or explicit `null`.
- Hits and misses cannot exceed a known click count. Boolean/string/fractional counts and extra properties are rejected.
- For noncomplementary tasks, hits + misses need not equal clicks. Counts follow the original source and the audited feature builder.
- A tuple with any missing count yields missing features for that task. Zero clicks retain zero log exposure but missing rates. At least one complete task with clicks > 0 is required. There is no validated completeness cutoff; the response warns about sparse input.
- Opacity vectors, labels, age, names, child IDs and other metadata are not accepted.

Example structure (shortened here; use the full examples supplied by the service):

```json
{"schema_version":"rello-counts-v1","tasks":{"Q1":{"clicks":20,"hits":16,"misses":4}}}
```

The shortened example alone will be rejected because the other 18 tasks are absent.

## Endpoints and behavior

| Endpoint | Access | Result |
| --- | --- | --- |
| Python `GET /health` | Internal health check | Ready status and model ID |
| Python `GET /v1/research/rello/metadata` | `X-ML-API-Key` | Contract, synthetic examples and locked evaluation metrics |
| Python `POST /v1/research/rello/predict` | `X-ML-API-Key` | Score, cutoff comparison, model ID/hash, coverage and warnings |
| Next `GET /api/research/rello` | Enabled flag + existing Supabase user session | Metadata in the app's `{ok,data}` envelope |
| Next `POST /api/research/rello` | Enabled flag + existing Supabase user session | Validated prediction in the same envelope |

Next forwards only the validated task counts and its own service secret, never the browser's credentials. It enforces a 16 KiB request limit, same-origin browser POSTs, a 10-second upstream timeout, no redirects and no caching. Missing service configuration, an outage, a bad service credential or an incompatible response yields a safe 503. Signed-out requests yield 401, disabled endpoints 404, and invalid task counts 422. No model scores or request bodies are logged or saved by this code; hosting access logs may still record request metadata.

The trained pipeline is loaded once at startup. Its original median imputer, missingness indicators, feature filtering and classifier remain fitted on the original development partition. The request path performs no fitting, threshold selection or calibration.

## Verification

From the repository root, after model installation:

```powershell
.\ml\.venv\Scripts\python.exe -m unittest discover -s ml/tests -v
.\ml\.venv\Scripts\python.exe -m ml.service.check_integration
cd frontend
npm run lint
npm run build
```

The integration runner starts a temporary Python server, exercises the actual Next forwarding handlers, checks complete and missing-data scores, and then stops the server. It supplies a simulated authenticated user to the handler tests; it does not claim to test a real Supabase login. Python tests compare returned scores with the original serialized pipeline and cover input validation, authentication and artifact integrity.

For a manual website check: sign in, run both examples, edit the JSON to see the old result clear, try invalid counts, then stop Python and retry. Confirm the service outage message appears. Test a signed-out browser separately. The page has no diagnosis, risk band or child-report action.

## Hosting this preliminary demo

Deploy Python separately from Next.js, with the pinned dependencies and installed model artifact. Keep the Python service internal where possible; otherwise provide HTTPS and retain the shared-secret check. Set `ML_SERVICE_URL` to its HTTPS origin in the Next.js host, set the matching secret on both hosts, and enable `OPACITY_RESEARCH_DEMO_ENABLED=true`. Restart/redeploy both after changing their environments. A hosted Next.js process cannot reach Python on your laptop through `127.0.0.1`.

The model artifact and secrets are intentionally not tracked in git: a remote build needs the trusted artifact provisioned separately. Use one Python worker initially (each worker loads its own model). Apply the host's request limits before exposing the research endpoint to broad traffic. No live deployment is performed by these changes.

## Next stage: predictions from Opacity gameplay

Freeze the actual Opacity assessment feature contract, collect independent reference labels with consent and provenance, and train/evaluate with child-grouped splits. Register that model under a separate input schema and endpoint. Fetch the authorized child's selected sessions server-side, validate assessment completeness and persist model/contract versions with the result. Define any risk bands on development data and evaluate them on held-out children before presenting them in child reports. Rello counts cannot be populated from the five game's aggregate scores.
