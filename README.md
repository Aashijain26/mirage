# Mirage Honeytoken Monitor

Mirage creates fake credentials for controlled deception, records requests that reach its trap URLs, enriches and scores the activity, correlates events into incidents, and displays the results in a protected dashboard.

## Local setup

1. From the repository root, create an environment file and private admin token:

   ```bash
   cp .env.example .env
   python -c 'import secrets; print(secrets.token_urlsafe(48))'
   ```

   Put the generated value in `.env` as `ADMIN_TOKEN`. The default database is a local SQLite file. Never commit `.env`.

2. Install and run the backend:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. In another terminal, configure and run the dashboard:

   ```bash
   cd dashboard
   cp .env.example .env
   # Set VITE_USE_MOCK=false and VITE_API_URL=http://localhost:8000
   npm ci
   npm run dev
   ```

   Open `http://localhost:5173` and sign in with the backend `ADMIN_TOKEN`.

The backend creates missing tables at startup and applies the additive `honeytokens.context` upgrade to older databases. Demo fixtures are optional and should only be added to a disposable local database with `python -m app.seed_demo`.

Run the backend suite with `pip install -r requirements-dev.txt && pytest -q`.

## Real database and deployment (Supabase + Render)

### 1. Create PostgreSQL

1. In Supabase, create a project and save its database password privately.
2. Open the project’s **Connect** panel and copy a PostgreSQL connection string. Use the Session Pooler connection for Render if the direct connection is unavailable from the host.
3. Keep the provider’s actual host, username, port, and database. Do not guess these values. Replace the password placeholder and URL-encode special characters in it.
4. The string should start with `postgresql://` or `postgres://`; Mirage converts either to the psycopg driver. This database starts empty; it does not contain your local SQLite records.

### 2. Deploy the backend

Create a Render Web Service for this GitHub repository:

- Root directory: repository root
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

Set these backend environment variables in Render:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `ADMIN_TOKEN` | Long random secret generated privately |
| `PUBLIC_BASE_URL` | The deployed backend URL, e.g. `https://mirage-api.onrender.com` |
| `CORS_ORIGINS` | The dashboard’s exact deployed origin, e.g. `https://mirage-dashboard.onrender.com` |
| `TELEGRAM_BOT_TOKEN` | Optional; only if Telegram alerts are wanted |
| `TELEGRAM_CHAT_ID` | Optional; only if Telegram alerts are wanted |
| `GEMINI_API_KEY` | Optional; deterministic summaries work without it |

Do not add `ADMIN_TOKEN` to a `VITE_` frontend variable. `PUBLIC_BASE_URL` must be the public backend URL because it is embedded in generated trap URLs. Tables are initialized when the backend starts. `GET /health` should return `{"status":"healthy","database":"connected"}`.

### 3. Deploy the dashboard

Create a Render Static Site from the same repository:

- Root directory: `dashboard`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Build environment: `VITE_API_URL=https://<your-backend-host>` and `VITE_USE_MOCK=false`
- Add a rewrite from `/*` to `/index.html` for React Router deep links.

After Render assigns the dashboard URL, set that exact origin in the backend’s `CORS_ORIGINS` and redeploy/restart the backend. Vite variables are build-time settings, so rebuild the dashboard after changing them.

### 4. Prove the full path

1. Open the dashboard URL and sign in using the same `ADMIN_TOKEN` set on the backend.
2. Create an AWS honeytoken or tracked decoy and copy the credential plus callback/endpoint URL immediately. Mirage stores only a hash of the secret; the readable value is returned at creation and cannot be retrieved later.
3. Plant it only in a controlled test location. For a safe test, call its callback URL from a separate device or network. An AWS decoy can be tested by sending an AWS-style request to its generated `AWS_ENDPOINT_URL`.
4. Confirm the request appears in the event feed, its correlated incident appears under Incidents, and the hit count updates for the token/decoy.
5. Check backend logs and `/health` if an event is missing. Do not run `app.seed_demo` against the real database.

## What the traps detect

The `/t/{token_id}/hook` and `/aws/{token_id}/...` routes are public by design so planted callbacks can reach the service; admin APIs are Bearer protected. The current AWS endpoint returns a canned response and is not an AWS account or CloudTrail integration. Likewise, registering a file-style decoy records its placement and creates a credential/callback to plant; Mirage does not have an agent on your host that can detect someone merely opening or downloading a file. A request must reach the generated Mirage trap URL to be recorded.

## Optional services and limits

- Telegram alerts need `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- Gemini summaries are optional and fall back to deterministic summaries. `OPENAI_API_KEY` is reserved in the sample environment but OpenAI calls are not currently implemented.
- Public-IP enrichment calls an external IP lookup provider. Failures fall back to unknown geography; locations and threat classifications are estimates.
- Authentication is one shared admin token, suitable for a controlled demo. Use stronger identity and access management before exposing the dashboard broadly.
- Event polling currently retrieves the newest 500 events. For sustained production traffic, add cursor-based pagination/retention and durable alert queuing.

## API overview

- Public traps: `GET/POST /t/{token_id}/hook`, `GET/POST /t/{token_id}`, `/aws/{token_id}/...`
- Health: `GET /health`
- Admin: `POST /admin/auth`, `GET/POST /admin/tokens`, `DELETE /admin/tokens/{id}`
- Telemetry: `GET /admin/events`, `GET /admin/incidents`, `POST /admin/incidents/summary`
- Decoy inventory: `GET/POST /admin/decoys`, `DELETE /admin/decoys/{id}`

All `/admin/*` routes require `Authorization: Bearer <ADMIN_TOKEN>`.
