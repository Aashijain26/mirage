// Mock fixtures and simulator for Honeytoken Monitor

export const MOCK_TOKENS = [
  {
    id: "tok-aws-9182",
    type: "aws",
    label: "prod-repo-aws",
    value: {
      AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
      AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      AWS_ENDPOINT_URL: "https://mock.example.com/t/tok-aws-9182"
    },
    callback_url: "https://mock.example.com/t/tok-aws-9182",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    revoked: false
  },
  {
    id: "tok-api-4401",
    type: "api_key",
    label: "stripe-api-key",
    value: {
      STRIPE_API_KEY: "MOCK_STRIPE_KEY_PLACEHOLDER",
      API_BASE_URL: "https://mock.example.com/t/tok-api-4401"
    },
    callback_url: "https://mock.example.com/t/tok-api-4401",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    revoked: false
  },
  {
    id: "tok-db-8823",
    type: "db",
    label: "orders-db",
    value: {
      DATABASE_URL: "postgres://demo_user:demo_password@localhost:5432/demo_db"
    },
    callback_url: "https://mock.example.com/t/tok-db-8823",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    revoked: false
  }
];

// Helper to calculate timestamps relative to now
const ago = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const SEEDED_EVENTS = [
  // --- Story A: Noisy Tor scanner hitting two tokens in under a minute (High risk: 80-95) ---
  {
    id: 101,
    token_id: "tok-aws-9182",
    ip: "185.220.101.45",
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      as: "AS208323",
      org: "Tor Exit Relay",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0 (MassScan Automated Prober v3.2)",
    path: "/.env",
    method: "GET",
    ts: ago(12),
    score: 88,
    flags: ["scripted", "tor", "burst", "multi-token"]
  },
  {
    id: 102,
    token_id: "tok-api-4401",
    ip: "185.220.101.45",
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      as: "AS208323",
      org: "Tor Exit Relay",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0 (MassScan Automated Prober v3.2)",
    path: "/api/v1/auth/stripe-verify",
    method: "POST",
    ts: ago(12.3),
    score: 95,
    flags: ["scripted", "tor", "burst", "multi-token"]
  },
  {
    id: 103,
    token_id: "tok-aws-9182",
    ip: "185.220.101.45",
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      as: "AS208323",
      org: "Tor Exit Relay",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0 (MassScan Automated Prober v3.2)",
    path: "/aws/sts/assume-role",
    method: "POST",
    ts: ago(12.7),
    score: 92,
    flags: ["scripted", "tor", "burst", "multi-token"]
  },

  // --- Story B: Single curl hit from hosting provider (Medium risk: ~40) ---
  {
    id: 104,
    token_id: "tok-aws-9182",
    ip: "143.198.72.109",
    geo: {
      city: "North Bergen",
      country: "United States",
      isp: "DigitalOcean, LLC",
      as: "AS14061",
      org: "DigitalOcean Datacenter",
      proxy: false,
      hosting: true
    },
    ua: "curl/7.88.1",
    path: "/.git/config",
    method: "GET",
    ts: ago(45),
    score: 42,
    flags: ["scripted", "hosting-provider"]
  },

  // --- Story C: Lone residential hit with browser UA (Low risk: ~10) ---
  {
    id: 105,
    token_id: "tok-api-4401",
    ip: "103.211.54.12",
    geo: {
      city: "Bengaluru",
      country: "India",
      isp: "Bharti Airtel Ltd",
      as: "AS24560",
      org: "Airtel Broadband Residential",
      proxy: false,
      hosting: false
    },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    path: "/v1/charges/verify",
    method: "GET",
    ts: ago(95),
    score: 12,
    flags: []
  },

  // --- Additional seeded events across varied countries & past 24h ---
  {
    id: 106,
    token_id: "tok-db-8823",
    ip: "95.173.136.72",
    geo: {
      city: "Moscow",
      country: "Russia",
      isp: "Selectel Network",
      as: "AS49505",
      org: "Selectel Hosting",
      proxy: false,
      hosting: true
    },
    ua: "sqlmap/1.7.2#stable (https://sqlmap.org)",
    path: "/database/connect",
    method: "POST",
    ts: ago(160),
    score: 78,
    flags: ["scripted", "hosting-provider"]
  },
  {
    id: 107,
    token_id: "tok-aws-9182",
    ip: "177.18.232.14",
    geo: {
      city: "São Paulo",
      country: "Brazil",
      isp: "Claro Brasil",
      as: "AS28573",
      org: "Claro Telecom",
      proxy: false,
      hosting: false
    },
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    path: "/config.json",
    method: "GET",
    ts: ago(240),
    score: 22,
    flags: []
  },
  {
    id: 108,
    token_id: "tok-api-4401",
    ip: "13.251.104.99",
    geo: {
      city: "Singapore",
      country: "Singapore",
      isp: "Amazon.com Inc.",
      as: "AS16509",
      org: "AWS EC2 Asia-Pacific",
      proxy: false,
      hosting: true
    },
    ua: "Go-http-client/1.1",
    path: "/api/secret-token",
    method: "POST",
    ts: ago(360),
    score: 48,
    flags: ["scripted", "hosting-provider"]
  },
  {
    id: 109,
    token_id: "tok-aws-9182",
    ip: "114.119.130.40",
    geo: {
      city: "Beijing",
      country: "China",
      isp: "Alibaba Cloud LLC",
      as: "AS45102",
      org: "AliCloud Infrastructure",
      proxy: false,
      hosting: true
    },
    ua: "Wget/1.21.3 (linux-gnu)",
    path: "/credentials/aws.env",
    method: "GET",
    ts: ago(480),
    score: 65,
    flags: ["scripted", "hosting-provider"]
  },
  {
    id: 110,
    token_id: "tok-api-4401",
    ip: "51.15.22.81",
    geo: {
      city: "Amsterdam",
      country: "Netherlands",
      isp: "Scaleway S.A.S.",
      as: "AS12876",
      org: "Scaleway Cloud",
      proxy: true,
      hosting: true
    },
    ua: "httpx/1.3.0",
    path: "/.git/HEAD",
    method: "GET",
    ts: ago(600),
    score: 55,
    flags: ["scripted", "hosting-provider"]
  },
  {
    id: 111,
    token_id: "tok-db-8823",
    ip: "185.100.87.202",
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "NForce Entertainment B.V.",
      as: "AS43350",
      org: "Tor Relay Exit",
      proxy: true,
      hosting: true
    },
    ua: "masscan/1.3 (https://github.com/robertdavidgraham/masscan)",
    path: "/postgres/auth",
    method: "POST",
    ts: ago(720),
    score: 86,
    flags: ["scripted", "tor", "burst"]
  },
  {
    id: 112,
    token_id: "tok-aws-9182",
    ip: "143.198.72.109",
    geo: {
      city: "North Bergen",
      country: "United States",
      isp: "DigitalOcean, LLC",
      as: "AS14061",
      org: "DigitalOcean Datacenter",
      proxy: false,
      hosting: true
    },
    ua: "curl/7.88.1",
    path: "/api/healthz",
    method: "GET",
    ts: ago(850),
    score: 35,
    flags: ["scripted", "hosting-provider"]
  },
  {
    id: 113,
    token_id: "tok-api-4401",
    ip: "122.176.45.18",
    geo: {
      city: "Mumbai",
      country: "India",
      isp: "Reliance Jio Infocomm",
      as: "AS55836",
      org: "Jio Broadband",
      proxy: false,
      hosting: false
    },
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    path: "/api/v1/auth/token",
    method: "POST",
    ts: ago(980),
    score: 18,
    flags: []
  },
  {
    id: 114,
    token_id: "tok-aws-9182",
    ip: "185.220.101.45",
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      as: "AS208323",
      org: "Tor Exit Relay",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0",
    path: "/backup/secrets.tar.gz",
    method: "GET",
    ts: ago(1100),
    score: 91,
    flags: ["scripted", "tor", "burst"]
  },
  {
    id: 115,
    token_id: "tok-db-8823",
    ip: "104.248.161.4",
    geo: {
      city: "London",
      country: "United Kingdom",
      isp: "DigitalOcean, LLC",
      as: "AS14061",
      org: "DigitalOcean UK",
      proxy: false,
      hosting: true
    },
    ua: "PostmanRuntime/7.36.0",
    path: "/api/database/ping",
    method: "GET",
    ts: ago(1220),
    score: 38,
    flags: ["hosting-provider"]
  },
  {
    id: 116,
    token_id: "tok-api-4401",
    ip: "201.82.14.99",
    geo: {
      city: "Curitiba",
      country: "Brazil",
      isp: "Telecomunicacoes de Sao Paulo",
      as: "AS18881",
      org: "Vivo Brazil",
      proxy: false,
      hosting: false
    },
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    path: "/webhook/stripe",
    method: "POST",
    ts: ago(1350),
    score: 15,
    flags: []
  },
  {
    id: 117,
    token_id: "tok-aws-9182",
    ip: "194.26.29.112",
    geo: {
      city: "Moscow",
      country: "Russia",
      isp: "Mir Telematiki LLC",
      as: "AS51659",
      org: "Mir Telematiki",
      proxy: true,
      hosting: true
    },
    ua: "Nmap Scripting Engine (NSE) http-vuln-cve2021-41773",
    path: "/cgi-bin/.%2e/.%2e/etc/passwd",
    method: "GET",
    ts: ago(1400),
    score: 75,
    flags: ["scripted", "hosting-provider"]
  }
];

// In-memory state for mock mode
let mockEventsStore = [...SEEDED_EVENTS];
let mockTokensStore = [...MOCK_TOKENS];
let eventCounter = 200;
let tokenCounter = 10;
const subscribers = new Set();

// Generator for random hex and alphanumerics
function randomAlpha(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Mock summarize endpoint handler
export async function mockSummary(eventIds) {
  // Simulate 800ms network delay
  await new Promise((r) => setTimeout(r, 800));

  const targetEvents = mockEventsStore.filter((e) => eventIds.includes(e.id));
  const maxScore = targetEvents.reduce((max, e) => Math.max(max, e.score || 0), 0);
  const flags = new Set(targetEvents.flatMap((e) => e.flags || []));

  if (maxScore >= 60 || flags.has("tor") || flags.has("burst")) {
    return {
      summary:
        "High-risk adversary activity detected. The IP exhibited automated exploitation behaviors, querying decoy endpoints in rapid succession. Traced to known anonymization relays / Tor exit nodes. Cross-token probing demonstrates deliberate credential reconnaissance across your perimeter.",
      severity: "high",
      likely_actor: "scripted",
      recommended_actions: [
        "Revoke and rotate exposed AWS IAM access keys immediately",
        "Add originating Tor relay IP / ASN to perimeter WAF blocklist",
        "Examine AWS CloudTrail logs for unexpected AssumeRole or GetCallerIdentity calls",
        "Audit repository commit history and CI/CD secret stores for accidental leaks"
      ]
    };
  } else if (maxScore >= 30 || flags.has("hosting-provider") || flags.has("scripted")) {
    return {
      summary:
        "Moderate-severity reconnaissance originating from a commercial cloud hosting provider. Request utilized automated tooling (e.g. curl/custom HTTP agent) targeting sensitive paths. Pattern is consistent with opportunistic repository crawlers looking for leaked credentials.",
      severity: "medium",
      likely_actor: "scripted",
      recommended_actions: [
        "Rotate the accessed token credential and monitor callback endpoint",
        "Restrict incoming API traffic from non-customer datacenter ASNs if applicable",
        "Inspect public code repositories and paste sites for exposed key signatures"
      ]
    };
  } else {
    return {
      summary:
        "Low-severity isolated query originating from a residential ISP network. Standard browser user-agent signature with no rapid burst cadence or anonymizing proxies observed. Likely curiosity probe, developer accidental trigger, or security research scrape.",
      severity: "low",
      likely_actor: "human",
      recommended_actions: [
        "Verify if this was an internal developer error or authorized pentest",
        "Keep the honeytoken armed to observe any repeated exploration attempts",
        "No immediate credential rotation required unless unexpected behavior follows"
      ]
    };
  }
}

// Mock create token function
export async function mockCreateToken({ type, label, context }) {
  await new Promise((r) => setTimeout(r, 400));
  tokenCounter++;
  const id = `tok-${type || "key"}-${randomHex(4)}`;
  const callback_url = `https://mock.example.com/t/${id}`;

  let value = {};
  if (type === "aws") {
    value = {
      AWS_ACCESS_KEY_ID: `AKIA${randomAlpha(16)}`,
      AWS_SECRET_ACCESS_KEY: `${randomAlpha(10)}${randomHex(20)}/k7EXAMPLE=`,
      AWS_ENDPOINT_URL: callback_url
    };
  } else if (type === "api_key") {
    value = {
      STRIPE_API_KEY: `sk_live_${randomHex(32)}`,
      API_BASE_URL: callback_url
    };
  } else if (type === "db") {
    value = {
      DATABASE_URL: `postgres://usr_${randomHex(6)}:p%40ss_${randomAlpha(8)}@db-replica.mock.corp:5432/main`
    };
  } else {
    // Default fallback
    value = `token_${randomHex(24)}`;
  }

  const newToken = {
    id,
    type,
    label: (label || `token-${tokenCounter}`).trim(),
    value,
    callback_url,
    created_at: new Date().toISOString(),
    revoked: false
  };

  mockTokensStore = [newToken, ...mockTokensStore];
  return {
    id,
    value,
    callback_url
  };
}

// Mock get tokens
export async function mockGetTokens() {
  await new Promise((r) => setTimeout(r, 200));
  return [...mockTokensStore];
}

// Mock get events
export async function mockGetEvents() {
  await new Promise((r) => setTimeout(r, 200));
  return [...mockEventsStore];
}

// Candidate pool for background simulator
const SIMULATOR_POOL = [
  {
    ip: "185.220.101.9",
    geo: { city: "Berlin", country: "Germany", isp: "Zwiebelfreunde e.V.", as: "AS208323", org: "Tor Exit Relay", proxy: true, hosting: true },
    ua: "python-requests/2.31.0",
    path: "/api/v1/auth/verify",
    method: "POST",
    score: 87,
    flags: ["scripted", "tor", "burst"]
  },
  {
    ip: "104.244.73.4",
    geo: { city: "New York", country: "United States", isp: "DigitalOcean, LLC", as: "AS14061", org: "DigitalOcean", proxy: false, hosting: true },
    ua: "curl/8.1.2",
    path: "/.env.production",
    method: "GET",
    score: 45,
    flags: ["scripted", "hosting-provider"]
  },
  {
    ip: "106.51.77.30",
    geo: { city: "Bengaluru", country: "India", isp: "ACT Fibernet", as: "AS24309", org: "Atria Convergence", proxy: false, hosting: false },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0",
    path: "/api/check",
    method: "GET",
    score: 15,
    flags: []
  },
  {
    ip: "119.28.140.22",
    geo: { city: "Shanghai", country: "China", isp: "Tencent Building", as: "AS45090", org: "Tencent Cloud", proxy: false, hosting: true },
    ua: "Go-http-client/2.0",
    path: "/database/config",
    method: "POST",
    score: 68,
    flags: ["scripted", "hosting-provider"]
  },
  {
    ip: "177.136.24.11",
    geo: { city: "Rio de Janeiro", country: "Brazil", isp: "Embratel", as: "AS4230", org: "Claro Telecom", proxy: false, hosting: false },
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
    path: "/login/admin",
    method: "GET",
    score: 25,
    flags: []
  },
  {
    ip: "128.199.201.55",
    geo: { city: "Singapore", country: "Singapore", isp: "DigitalOcean, LLC", as: "AS14061", org: "DigitalOcean SG", proxy: false, hosting: true },
    ua: "httpx/1.3.8",
    path: "/aws/credentials",
    method: "POST",
    score: 52,
    flags: ["scripted", "hosting-provider"]
  }
];

// Broadcast new event to all subscribers
function broadcastEvent(event) {
  mockEventsStore = [event, ...mockEventsStore.slice(0, 499)];
  subscribers.forEach((callback) => {
    try {
      callback(event);
    } catch (err) {
      console.error("Error in mock subscriber callback", err);
    }
  });
}

// "Simulate attack" button handler - pushes immediate high-score event
export function simulateImmediateAttack() {
  eventCounter++;
  const targetToken = mockTokensStore[Math.floor(Math.random() * mockTokensStore.length)] || MOCK_TOKENS[0];
  const highRiskEvent = {
    id: eventCounter,
    token_id: targetToken.id,
    ip: "185.220.101." + Math.floor(Math.random() * 200 + 10),
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      as: "AS208323",
      org: "Tor Exit Relay Node",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0 (MassScan Automated Prober v3.2)",
    path: "/api/v1/auth/aws-key-exchange",
    method: "POST",
    ts: new Date().toISOString(),
    score: 94,
    flags: ["scripted", "tor", "burst", "multi-token"]
  };

  broadcastEvent(highRiskEvent);
  return highRiskEvent;
}

// Background simulator timer
let simulatorTimer = null;

export function startMockSimulator(onEvent) {
  subscribers.add(onEvent);

  if (!simulatorTimer) {
    const scheduleNext = () => {
      // 6 to 10 seconds delay
      const delay = Math.floor(Math.random() * 4000) + 6000;
      simulatorTimer = setTimeout(() => {
        eventCounter++;
        const template = SIMULATOR_POOL[Math.floor(Math.random() * SIMULATOR_POOL.length)];
        const targetToken = mockTokensStore[Math.floor(Math.random() * mockTokensStore.length)] || MOCK_TOKENS[0];

        const fakeEvent = {
          ...template,
          id: eventCounter,
          token_id: targetToken.id,
          ts: new Date().toISOString()
        };

        broadcastEvent(fakeEvent);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  return () => {
    subscribers.delete(onEvent);
    if (subscribers.size === 0 && simulatorTimer) {
      clearTimeout(simulatorTimer);
      simulatorTimer = null;
    }
  };
}

