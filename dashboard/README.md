# Honeytoken Monitor — SOC Threat Intelligence Dashboard

Honeytoken Monitor is a high-fidelity, real-time Security Operations Center (SOC) dashboard designed for **Honeytokens-as-a-Service**. It visualizes decoy credential traps (AWS IAM keys, Stripe/API keys, Database URIs) deployed across source repositories, cloud infrastructure, and internal configurations. When an adversary stumbles upon and triggers a planted credential, this dashboard captures the intrusion, maps attack geography offline, calculates risk scores, streams live alerts, and generates AI attacker profiles.

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

## Switching to the Real Backend

To connect the dashboard to your teammate's FastAPI / WebSocket backend:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your backend server URL:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_USE_MOCK=false
   VITE_ADMIN_TOKEN=your-optional-admin-secret-token
   ```

3. Restart the Vite dev server (`npm run dev`).

### Switching Mode Summary
| Variable | Mock Mode (Default) | Real API Mode |
| :--- | :--- | :--- |
| `VITE_USE_MOCK` | `true` (or unset) | `false` |
| `VITE_API_URL` | Empty / unset | `http://localhost:8000` (or production URL) |
| `VITE_ADMIN_TOKEN` | Optional | Set if backend requires `X-Admin-Token` header |

> When `VITE_USE_MOCK` is `false`, the client connects to REST endpoints and establishes a WebSocket connection to `ws://<backend>/ws/events` (or `wss://` if using HTTPS). If the WebSocket disconnects, the dashboard automatically enters exponential backoff retry (1s, 2s, 4s, max 10s) while polling REST every 2s as a fallback.

---

## Endpoint Configuration

All backend API and WebSocket routes are centralized in one file. **Never hardcode URLs anywhere else**:

**File:** `src/config/endpoints.js`

```javascript
export const ENDPOINTS = {
  tokens: "/tokens",
  createToken: "/tokens",
  events: "/events",
  summary: "/incidents/summary",
  ws: "/ws/events",
  health: "/health"
};
```

If the backend teammate modifies any route, simply edit this single file.

---

## Data Contracts

The frontend is built defensively to tolerate missing, null, or optional fields without crashing.

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
    "AWS_ENDPOINT_URL": "https://api.trap.corp/t/tok-aws-9182"
  },
  "callback_url": "https://api.trap.corp/t/tok-aws-9182",
  "created_at": "2026-11-10T08:30:00.000Z",
  "revoked": false
}
```
*Note:* The UI supports `value` as either a key-value object or a single token string.

### 3. Create Token Request & Response
- **Request (`POST /tokens`):**
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
      "AWS_ENDPOINT_URL": "https://api.trap.corp/t/tok-aws-7123"
    },
    "callback_url": "https://api.trap.corp/t/tok-aws-7123"
  }
  ```

### 4. AI Incident Summary Request & Response
- **Request (`POST /incidents/summary`):**
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

### 5. WebSocket Telemetry (`/ws/events`)
Each WebSocket frame sends a single JSON `Event` object:
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
2. **One-Time Credential Reveal:** Generated secret keys are displayed only once in a dedicated reveal modal with individual copy and `.env` export buttons. Secrets are never persisted in `localStorage` or stored globally once dismissed.
3. **Zero-Network ThreatMap:** The geographic threat map uses bundled simplified SVG landmasses in `src/assets/world-geometry.json` and 60+ country centroid coordinates in `src/config/countryCoords.js`. It functions 100% offline without any external tile or CDN fetches.
4. **Resilient Failure Modes:** API failures or bad server URLs are intercepted by component error banners and a top-level `ErrorBoundary`, preventing white-screen crashes.
5. **Real-time UX:** New socket events animate in with a 1.5-second CSS flash highlight (red for high risk, green for normal) before settling.
