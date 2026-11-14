# Honeytoken Monitor — SOC Threat Intelligence Dashboard

Honeytoken Monitor is a Security Operations Center (SOC) dashboard for **Honeytokens-as-a-Service**. It visualizes decoy credentials planted across source repositories, cloud infrastructure, and internal configurations. The integrated backend records trap activity, correlates events by source IP, assigns deterministic risk scores, and provides incident summaries with an optional LLM provider.

---

## Quickstart (Mock Mode)

The dashboard runs out of the box with zero external backend dependencies or network requests:

```bash
cd dashboard
npm install
npm run dev
```

Navigate to `http://localhost:5173`. You will immediately see:
- **5 Live SOC Stat Cards** (Total Honeytokens, Active Honeytokens, Attacks Detected, High-Severity Incidents, Last Trigger Time).
- **Attacks Per Hour** (last 24 hours area cadence chart).
- **Top 5 Source Countries** (attack volume distribution).
- **Threat Map** (interactive SVG world map rendered with local geometry and offline coordinates).
- **Real-Time Feed** (pre-seeded with 17 realistic security incidents across Tor relays, hosting providers, and residential IPs).
- **Live Simulator** (injects background telemetry every 6–10 seconds).
- **"Simulate Attack" button** in the top navigation bar to trigger instant high-score Tor burst attacks.

---

## Running the Integrated Demo

To connect the dashboard to the FastAPI backend:

1. Configure and start the FastAPI backend from the repository root:
   ```bash
   cp .env.example .env
   # Edit .env and set ADMIN_TOKEN to a long random secret.
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. In another terminal, set up the dashboard:
   ```bash
   cd dashboard
   cp .env.example .env
   # Set VITE_USE_MOCK=false and VITE_API_URL=http://localhost:8000
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173` and sign in with the same `ADMIN_TOKEN` value. Dashboard API calls use Bearer authentication and poll for events every 2.5 seconds.

To use the included AWS attacker simulator, create an AWS honeytoken in the dashboard and copy its `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_ENDPOINT_URL` from the one-time creation panel into the simulator command shown in `tools/README.md`.

Tracked decoys and tokens are stored in the backend database. Their secrets appear only at creation. Decoy inventory records where you planted a decoy; Mirage records a hit when its trap URL is requested. It does not monitor someone simply reading or downloading a file.

### Dashboard Mode
| Variable | Mock Mode (Default) | Real API Mode |
| :--- | :--- | :--- |
| `VITE_USE_MOCK` | `true` | `false` |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL (required for real API mode) |

`ADMIN_TOKEN` belongs in the backend environment only; enter it at the dashboard login page. Do not put it in a `VITE_` variable, because Vite embeds those values in the browser bundle.

---

## Endpoint Configuration

Dashboard API routes are centralized in one file. **Never hardcode URLs anywhere else**:

**File:** `src/config/endpoints.js`

```javascript
export const ENDPOINTS = {
  auth: "/admin/auth",
  tokens: "/admin/tokens",
  createToken: "/admin/tokens",
  events: "/admin/events",
  incidents: "/admin/incidents",
  summary: "/admin/incidents/summary",
  health: "/health"
};
```

Admin list and summary routes require `Authorization: Bearer <ADMIN_TOKEN>`.

---

## Data Contracts

The frontend is built defensively to tolerate missing, null, or optional fields without crashing.

Risk scoring matches `app/intel/scoring.py`: base 40, +15 for scripted user agents, +15 once for the `suspicious_request` category, and +25 once for multi-token probing. Hosting, proxy, rapid-fire, and off-hours flags explain the suspicious-request category without adding separate points. Severity is low below 50, medium from 50 to 69, and high from 70.

### 1. Security Event (`Event`)
```json
{
  "id": 101,
  "token_id": "tok-aws-9182",
  "ip": "185.220.101.45",
  "geo": {
    "city": "Frankfurt",
    "country": "Germany",
    "isp": "Zwiebelfreunde e.V.",
    "as": "AS208323",
    "org": "Tor Exit Relay",
    "proxy": true,
    "hosting": true
  },
  "ua": "python-requests/2.31.0",
  "path": "/.env",
  "method": "GET",
  "ts": "2026-11-13T12:00:00.000Z",
  "score": 88,
  "flags": ["scripted", "tor", "burst", "multi-token"]
}
```

### 2. Honeytoken Decoy (`Token`)
```json
{
  "id": "tok-aws-9182",
  "type": "aws",
  "label": "prod-repo-aws",
  "value": {
    "AWS_ACCESS_KEY_ID": "AKIAIOSFODNN7EXAMPLE",
    "AWS_SECRET_ACCESS_KEY": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "AWS_ENDPOINT_URL": "https://api.trap.corp/aws/tok-aws-9182"
  },
  "callback_url": "https://api.trap.corp/t/tok-aws-9182/hook",
  "created_at": "2026-11-10T08:30:00.000Z",
  "revoked": false
}
```
*Note:* The UI supports `value` as either a key-value object or a single token string.

### 3. Create Token Request & Response
- **Request (`POST /admin/tokens`):**
  ```json
  {
    "type": "aws",
    "label": "github-ci-runner",
    "context": "Planted in public repo .github/workflows/deploy.yml"
  }
  ```
- **Response:**
  ```json
  {
    "id": "tok-aws-7123",
    "value": {
      "AWS_ACCESS_KEY_ID": "AKIA9812AJSDFEXAMPLE",
      "AWS_SECRET_ACCESS_KEY": "40_char_secret_access_key...",
    "AWS_ENDPOINT_URL": "https://api.trap.corp/aws/tok-aws-7123"
    },
  "callback_url": "https://api.trap.corp/t/tok-aws-7123/hook"
  }
  ```

### 4. Incident Summary Request & Response
- **Request (`POST /admin/incidents/summary`):**
  ```json
  {
    "event_ids": [101, 102, 103]
  }
  ```
- **Response:**
  ```json
  {
    "summary": "High-risk adversary activity detected originating from Tor network exit nodes...",
    "severity": "high",
    "likely_actor": "scripted",
    "recommended_actions": [
      "Immediately revoke exposed AWS key pair and rotate associated IAM credentials",
      "Add originating Tor exit IP ranges to WAF blocklist",
      "Audit repository commit history and CI/CD secret stores for accidental credential leak"
    ]
  }
  ```

### 5. Event Polling (`GET /admin/events`)
The authenticated dashboard polls a list of JSON `Event` objects every 2.5 seconds. Access traps are available at `/t/{token_id}/hook` and `/aws/{token_id}/{operation}`:
```json
{
  "id": 201,
  "token_id": "tok-aws-9182",
  "ip": "185.220.101.45",
  "geo": { "country": "Germany", "proxy": true },
  "ua": "curl/7.88.1",
  "path": "/aws/sts/assume-role",
  "method": "POST",
  "ts": "2026-11-13T12:05:00.000Z",
  "score": 92,
  "flags": ["scripted", "tor", "burst"]
}
```

---

## Security & Architectural Guarantees

1. **Zero InnerHTML / XSS Protection:** Every attacker-controlled field (`ip`, `ua`, `path`, `headers`, `flags`, `geo`, `summary`) is rendered strictly as plain text via React interpolation. No `dangerouslySetInnerHTML`, `innerHTML`, or `eval` is used.
2. **One-Time Credential Reveal:** Generated secret keys are displayed once in a reveal panel. The database stores only a SHA-256 hash; the dashboard does not persist the returned secret.
3. **Zero-Network ThreatMap:** The geographic threat map uses bundled simplified SVG landmasses in `src/assets/world-geometry.json` and 60+ country centroid coordinates in `src/config/countryCoords.js`. It functions 100% offline without any external tile or CDN fetches.
4. **Resilient Failure Modes:** API failures or bad server URLs are intercepted by component error banners and a top-level `ErrorBoundary`, preventing white-screen crashes.
5. **Real-time UX:** New socket events animate in with a 1.5-second CSS flash highlight (red for high risk, green for normal) before settling.
