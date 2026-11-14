# Mirage Honeytoken Monitor

FastAPI backend and React dashboard for generating decoy credentials, recording trap activity, and reviewing persisted incidents.

## Run locally

1. Copy `.env.example` to `.env`, set a private `ADMIN_TOKEN`, then install the backend dependencies:

   ```bash
   cp .env.example .env
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Optionally seed the local demo database, then start the backend:

   ```bash
   python -m app.seed_demo
   uvicorn app.main:app --reload
   ```

3. In a second terminal, start the dashboard:

   ```bash
   cd dashboard
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` and sign in with the same `ADMIN_TOKEN` configured in the backend `.env`.

Admin endpoints use Bearer authentication. The dashboard polls `/admin/events`; decoy callbacks are received at `/t/{token_id}/hook` and AWS requests at `/aws/{token_id}/...`.
