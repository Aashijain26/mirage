// Mock fixtures and simulator for Mirage Honeytoken SOC

export const MOCK_TOKENS = [
  {
    id: "tok-aws-9182",
    type: "aws",
    label: "prod-repo-aws",
    context: "github.com/acme/payments-service",
    valuePreview: "AKIAOZY7XKU6.../0c95...",
    value: {
      AWS_ACCESS_KEY_ID: "AKIAOZY7XKU6EXAMPLE",
      AWS_SECRET_ACCESS_KEY: "0c95EXAMPLESECRETKEY40CHARACTERSLONG123",
      AWS_ENDPOINT_URL: "https://api.mirage.trap/aws/tok-aws-9182"
    },
    hits: 28,
    last_hit: "50 min ago",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    revoked: false
  },
  {
    id: "tok-api-4401",
    type: "api_key",
    label: "ci-deploy-gh",
    context: "github.com/acme/deploy-pipeline",
    valuePreview: "mir_live_4a9...",
    value: {
      API_KEY: "mir_live_4a98f102c9842a1b5d6e7f8"
    },
    hits: 14,
    last_hit: "1 h ago",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    revoked: false
  },
  {
    id: "tok-hook-1029",
    type: "webhook",
    label: "staging-webhook",
    context: "hooks.staging.acme.internal",
    valuePreview: "https://hooks.mirage.dev/c/1...",
    value: {
      WEBHOOK_URL: "https://hooks.mirage.dev/c/19a8f4c201e"
    },
    hits: 10,
    last_hit: "2 h ago",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    revoked: false
  },
  {
    id: "tok-api-8821",
    type: "api_key",
    label: "backup-api-key",
    context: "s3://acme-backups/credentials.env",
    valuePreview: "mir_live_02e...",
    value: {
      API_KEY: "mir_live_02e99d81fa7b3c2d4e5f6a7"
    },
    hits: 10,
    last_hit: "3 h ago",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    revoked: false
  },
  {
    id: "tok-aws-7712",
    type: "aws",
    label: "build-keys-aws",
    context: "github.com/acme/infra-scripts",
    valuePreview: "AKIAGDVGC24N.../4c55...",
    value: {
      AWS_ACCESS_KEY_ID: "AKIAGDVGC24NEXAMPLE",
      AWS_SECRET_ACCESS_KEY: "4c55EXAMPLESECRETKEY40CHARACTERSLONG123"
    },
    hits: 0,
    last_hit: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    revoked: false
  },
  {
    id: "tok-db-3301",
    type: "api_key",
    label: "grafana-api",
    context: "monitoring.corp.internal/tokens",
    valuePreview: "eyJrZXkiOiJnbGFwaS...",
    value: { API_KEY: "glsa_example_grafana_api_token" },
    hits: 8,
    last_hit: "42 min ago",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    revoked: false
  },
  {
    id: "tok-mail-5520",
    type: "api_key",
    label: "mailgun-fake",
    context: "lambda-notifications/config.py",
    valuePreview: "key-9f82bc71...",
    value: { API_KEY: "key-9f82bc7102a94f1c" },
    hits: 12,
    last_hit: "41 min ago",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    revoked: false
  },
  {
    id: "tok-vault-9910",
    type: "api_key",
    label: "ansible-vault-test",
    context: "ansible/roles/security/vault.yml",
    valuePreview: "ansible_vlt_98f...",
    value: { VAULT_PASS: "ansible_vlt_98f21ca901b" },
    hits: 5,
    last_hit: "40 min ago",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    revoked: false
  },
  {
    id: "tok-s3-1120",
    type: "aws",
    label: "s3-public-read",
    context: "terraform/modules/storage/s3.tf",
    valuePreview: "AKIA3389JASD.../99fa...",
    value: { AWS_ACCESS_KEY_ID: "AKIA3389JASDEXAMPLE" },
    hits: 4,
    last_hit: "5 h ago",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    revoked: false
  },
  {
    id: "tok-wh-8812",
    type: "webhook",
    label: "slack-notifier-hook",
    context: "slack-apps/incoming-webhook",
    valuePreview: "https://hooks.slack.com/services/T...",
    value: { WEBHOOK_URL: "https://hooks.slack.com/services/T00/B00/X" },
    hits: 2,
    last_hit: "1 d ago",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    revoked: false
  },
  {
    id: "tok-git-4411",
    type: "api_key",
    label: "github-pat-readonly",
    context: "dotfiles/.gitconfig",
    valuePreview: "ghp_44a9812bf1...",
    value: { GITHUB_TOKEN: "ghp_44a9812bf19ca012" },
    hits: 0,
    last_hit: null,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    revoked: false
  },
  {
    id: "tok-pg-1294",
    type: "api_key",
    label: "postgres-read-prod",
    context: "kubernetes/helm/analytics-worker",
    valuePreview: "postgres://analyst:...",
    value: { DATABASE_URL: "postgres://analyst:secret@db.internal:5432/main" },
    hits: 0,
    last_hit: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    revoked: false
  },
  {
    id: "tok-stripe-8819",
    type: "api_key",
    label: "stripe-restricted",
    context: "billing-service/.env.backup",
    valuePreview: "rk_live_99fa...",
    value: { STRIPE_KEY: "rk_live_99fa8120c1" },
    hits: 0,
    last_hit: null,
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    revoked: false
  },
  {
    id: "tok-kube-5510",
    type: "api_key",
    label: "k8s-cluster-sa",
    context: "clusters/staging/serviceaccount.token",
    valuePreview: "eyJhbGciOiJSUzI1...",
    value: { TOKEN: "k8s_sa_token_secret" },
    hits: 0,
    last_hit: null,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    revoked: false
  }
];

export const MOCK_DECOYS = [
  {
    id: "dec-1",
    type: "env",
    badge: "ENV",
    label: ".env staging",
    host: "web-staging-2",
    path: "web-staging-2:/srv/app/.env",
    status: "Untouched",
    hits: 0,
    last_hit: null
  },
  {
    id: "dec-2",
    type: "ssh",
    badge: "SSH KEY",
    label: "deploy key",
    host: "ci-runner-1",
    path: "ci-runner-1:/home/ci/.ssh/id_ed25519",
    status: "Untouched",
    hits: 0,
    last_hit: null
  },
  {
    id: "dec-3",
    type: "backup",
    badge: "BACKUP",
    label: "backups.zip",
    host: "nas-old",
    path: "nas-old:/mnt/share/backups.zip",
    status: "Untouched",
    hits: 0,
    last_hit: null
  },
  {
    id: "dec-4",
    type: "db",
    badge: "DB DUMP",
    label: "customers.sql",
    host: "db-replica-2",
    path: "db-replica-2:/tmp/customers.sql",
    status: "Untouched",
    hits: 0,
    last_hit: null
  },
  {
    id: "dec-5",
    type: "env",
    badge: "ENV",
    label: ".env production",
    host: "web-prod-1",
    path: "web-prod-1:/srv/app/.env",
    status: "Hit 1 time, last 1 d ago",
    hits: 1,
    last_hit: "1 d ago"
  },
  {
    id: "dec-6",
    type: "ssh",
    badge: "SSH KEY",
    label: "id_rsa backup",
    host: "build-runner-03",
    path: "build-runner-03:/root/.ssh/id_rsa",
    status: "Hit 3 times, last 12 h ago",
    hits: 3,
    last_hit: "12 h ago"
  }
];

const ago = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const SEEDED_EVENTS = [
  {
    id: 101,
    token_id: "tok-vault-9910",
    token_label: "ansible-vault-test",
    ip: "152.59.219.151",
    geo: { city: "London", country: "United Kingdom", proxy: false, hosting: false },
    ua: "curl/8.1.2",
    path: "/canary/vault",
    ts: ago(40),
    time_ago: "40 min ago",
    score: 60,
    severity: "medium",
    flags: ["canary_url", "odd_hour", "rapid_fire"]
  },
  {
    id: 102,
    token_id: "tok-mail-5520",
    token_label: "mailgun-fake",
    ip: "159.38.106.251",
    geo: { city: "Ashburn", country: "United States", proxy: false, hosting: true },
    ua: "Go-http-client/1.1",
    path: "/api/v1/mailgun/messages",
    ts: ago(41),
    time_ago: "41 min ago",
    score: 64,
    severity: "medium",
    flags: ["new_agent", "rapid_fire", "datacenter_ip"]
  },
  {
    id: 103,
    token_id: "tok-db-3301",
    token_label: "grafana-api",
    ip: "142.172.130.211",
    geo: { city: "Amsterdam", country: "Netherlands", proxy: false, hosting: true },
    ua: "python-urllib/3.10",
    path: "/api/org/users",
    ts: ago(42),
    time_ago: "42 min ago",
    score: 68,
    severity: "medium",
    flags: ["canary_url", "odd_hour", "hosting_ip"]
  },
  {
    id: 104,
    token_id: "tok-aws-9182",
    token_label: "prod-repo-aws",
    ip: "185.220.101.4",
    geo: { city: "Frankfurt", country: "Germany", proxy: true, hosting: true },
    ua: "python-requests/2.31.0",
    path: "/aws/sts/get-caller-identity",
    ts: ago(49),
    time_ago: "49 min ago",
    score: 91,
    severity: "high",
    flags: ["scripted_ua", "proxy_ip", "tor"]
  },
  {
    id: 105,
    token_id: "tok-api-4401",
    token_label: "ci-deploy-gh",
    ip: "45.146.164.7",
    geo: { city: "Moscow", country: "Russia", proxy: false, hosting: true },
    ua: "Masscan/1.3",
    path: "/deploy/webhook",
    ts: ago(60),
    time_ago: "1 h ago",
    score: 70,
    severity: "high",
    flags: ["scripted_ua", "datacenter_ip", "burst"]
  },
  {
    id: 106,
    token_id: "tok-aws-9182",
    token_label: "prod-repo-aws",
    ip: "193.106.191.22",
    geo: { city: "Warsaw", country: "Poland", proxy: true, hosting: true },
    ua: "aws-cli/2.13.0",
    path: "/aws/s3/list-buckets",
    ts: ago(75),
    time_ago: "1 h ago",
    score: 85,
    severity: "high",
    flags: ["tor", "scripted_ua", "multi_token"]
  },
  {
    id: 107,
    token_id: "tok-hook-1029",
    token_label: "staging-webhook",
    ip: "104.28.19.45",
    geo: { city: "San Francisco", country: "United States", proxy: false, hosting: false },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    path: "/hooks/incoming",
    ts: ago(120),
    time_ago: "2 h ago",
    score: 55,
    severity: "medium",
    flags: ["odd_hour", "burst"]
  },
  {
    id: 108,
    token_id: "tok-api-8821",
    token_label: "backup-api-key",
    ip: "89.208.103.11",
    geo: { city: "Stockholm", country: "Sweden", proxy: false, hosting: true },
    ua: "boto3/1.28.0",
    path: "/credentials/aws.env",
    ts: ago(180),
    time_ago: "3 h ago",
    score: 58,
    severity: "medium",
    flags: ["rapid_fire", "hosting_ip"]
  },
  {
    id: 109,
    token_id: "tok-s3-1120",
    token_label: "s3-public-read",
    ip: "198.51.100.12",
    geo: { city: "Tokyo", country: "Japan", proxy: false, hosting: false },
    ua: "Mozilla/5.0 Chrome/119.0.0.0",
    path: "/public/downloads",
    ts: ago(300),
    time_ago: "5 h ago",
    score: 62,
    severity: "medium",
    flags: ["canary_url", "off_hours"]
  },
  {
    id: 110,
    token_id: "tok-aws-9182",
    token_label: "prod-repo-aws",
    ip: "203.0.113.88",
    geo: { city: "Sydney", country: "Australia", proxy: false, hosting: false },
    ua: "curl/7.88.1",
    path: "/.env",
    ts: ago(360),
    time_ago: "6 h ago",
    score: 65,
    severity: "medium",
    flags: ["canary_url", "rapid_fire"]
  },
  {
    id: 111,
    token_id: "tok-vault-9910",
    token_label: "ansible-vault-test",
    ip: "185.191.171.12",
    geo: { city: "Dublin", country: "Ireland", proxy: false, hosting: true },
    ua: "python-requests/2.28.1",
    path: "/vault.key",
    ts: ago(420),
    time_ago: "7 h ago",
    score: 52,
    severity: "medium",
    flags: ["datacenter_ip"]
  },
  {
    id: 112,
    token_id: "tok-api-4401",
    token_label: "ci-deploy-gh",
    ip: "176.113.115.89",
    geo: { city: "Kyiv", country: "Ukraine", proxy: false, hosting: false },
    ua: "Mozilla/5.0 Firefox/115.0",
    path: "/deploy/keys",
    ts: ago(480),
    time_ago: "8 h ago",
    score: 42,
    severity: "low",
    flags: ["manual_probe"]
  },
  {
    id: 113,
    token_id: "tok-mail-5520",
    token_label: "mailgun-fake",
    ip: "212.102.40.19",
    geo: { city: "Zurich", country: "Switzerland", proxy: false, hosting: false },
    ua: "Wget/1.21.3",
    path: "/api/mailgun",
    ts: ago(540),
    time_ago: "9 h ago",
    score: 48,
    severity: "low",
    flags: ["scripted_ua"]
  },
  {
    id: 114,
    token_id: "tok-db-3301",
    token_label: "grafana-api",
    ip: "109.236.88.42",
    geo: { city: "Bucharest", country: "Romania", proxy: false, hosting: false },
    ua: "curl/7.79.1",
    path: "/grafana/login",
    ts: ago(600),
    time_ago: "10 h ago",
    score: 45,
    severity: "low",
    flags: ["odd_hour"]
  },
  {
    id: 115,
    token_id: "tok-wh-8812",
    token_label: "slack-notifier-hook",
    ip: "77.88.55.77",
    geo: { city: "Helsinki", country: "Finland", proxy: false, hosting: false },
    ua: "curl/7.81.0",
    path: "/hooks/slack",
    ts: ago(720),
    time_ago: "12 h ago",
    score: 40,
    severity: "low",
    flags: ["canary_url"]
  },
  {
    id: 116,
    token_id: "tok-aws-9182",
    token_label: "prod-repo-aws",
    ip: "62.210.140.10",
    geo: { city: "Paris", country: "France", proxy: false, hosting: true },
    ua: "Mozilla/5.0 Chrome/120.0",
    path: "/aws/config",
    ts: ago(800),
    time_ago: "13 h ago",
    score: 38,
    severity: "low",
    flags: ["browser_agent"]
  },
  {
    id: 117,
    token_id: "tok-hook-1029",
    token_label: "staging-webhook",
    ip: "80.94.95.101",
    geo: { city: "Madrid", country: "Spain", proxy: false, hosting: false },
    ua: "PostmanRuntime/7.32.3",
    path: "/webhook/test",
    ts: ago(900),
    time_ago: "15 h ago",
    score: 35,
    severity: "low",
    flags: ["manual_tooling"]
  },
  {
    id: 118,
    token_id: "tok-api-8821",
    token_label: "backup-api-key",
    ip: "194.26.29.112",
    geo: { city: "Prague", country: "Czech Republic", proxy: false, hosting: false },
    ua: "Mozilla/5.0 Safari/605.1",
    path: "/backups/env",
    ts: ago(1000),
    time_ago: "16 h ago",
    score: 30,
    severity: "low",
    flags: ["residential_ip"]
  },
  {
    id: 119,
    token_id: "tok-vault-9910",
    token_label: "ansible-vault-test",
    ip: "91.240.118.23",
    geo: { city: "Milan", country: "Italy", proxy: false, hosting: false },
    ua: "curl/7.76.1",
    path: "/secret/vault",
    ts: ago(1200),
    time_ago: "20 h ago",
    score: 44,
    severity: "low",
    flags: ["canary_url"]
  },
  {
    id: 120,
    token_id: "tok-aws-9182",
    token_label: "prod-repo-aws",
    ip: "185.100.87.19",
    geo: { city: "Sao Paulo", country: "Brazil", proxy: false, hosting: false },
    ua: "python-requests/2.27.1",
    path: "/aws/s3",
    ts: ago(1400),
    time_ago: "23 h ago",
    score: 47,
    severity: "low",
    flags: ["scripted_ua"]
  }
];

let mockTokensStore = [...MOCK_TOKENS];
let mockDecoysStore = [...MOCK_DECOYS];
let mockEventsStore = [...SEEDED_EVENTS];
let eventCounter = 200;
const subscribers = new Set();

function broadcastEvent(event) {
  mockEventsStore.unshift(event);
  subscribers.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      console.error(e);
    }
  });
}

export async function mockGetTokens() {
  return [...mockTokensStore];
}

export async function mockCreateToken({ type, label, context }) {
  const id = "tok-" + Math.random().toString(36).substring(2, 8);
  const newTok = {
    id,
    type: type || "aws",
    label: label || "custom-token",
    context: context || "planted",
    valuePreview: type === "aws" ? "AKIA" + Math.random().toString(36).substring(2, 10).toUpperCase() + ".../secret..." : "mir_live_" + Math.random().toString(36).substring(2, 10),
    value: {
      KEY: "sample_secret_revealed_once"
    },
    callback_url: `https://mock.mirage.test/t/${id}/hook`,
    hits: 0,
    last_hit: null,
    created_at: new Date().toISOString(),
    revoked: false
  };
  mockTokensStore.unshift(newTok);
  return newTok;
}

export async function mockDeleteToken(id) {
  mockTokensStore = mockTokensStore.filter((t) => t.id !== id);
  return { ok: true };
}

export async function mockGetDecoys() {
  return [...mockDecoysStore];
}

export async function mockCreateDecoy({ token_id, label, host, path }) {
  const token = mockTokensStore.find((item) => item.id === token_id);
  if (!token) throw new Error("Choose a token from the Tokens page first.");
  if (mockDecoysStore.some((item) => item.honeytoken_id === token_id)) {
    throw new Error("This token is already listed as a planted decoy.");
  }
  const typeMap = { aws: "aws", api_key: "api", webhook: "webhook", db: "db" };
  const type = typeMap[token.type] || "api";
  const callback_url = token.callback_url || `https://mock.mirage.test/t/${token_id}/hook`;
  const newDec = {
    id: "dec-" + Math.random().toString(36).substring(2, 8),
    honeytoken_id: token_id,
    type,
    badge: type.toUpperCase(),
    label: label || "new-decoy",
    host: host || "host-01",
    path: path || "/",
    status: "Untouched",
    active: true,
    callback_url,
    hits: 0,
    last_hit: null
  };
  mockDecoysStore.unshift(newDec);
  return newDec;
}

export async function mockDeleteDecoy(id) {
  mockDecoysStore = mockDecoysStore.filter((d) => d.id !== id);
  return { ok: true };
}

export async function mockGetEvents() {
  return [...mockEventsStore];
}

export async function mockSummary(eventIds) {
  return {
    summary: "High-risk adversary activity detected. Automated exploitation behavior targeting decoy credentials across perimeter.",
    severity: "high",
    likely_actor: "scripted",
    recommended_actions: [
      "Immediately rotate exposed token keys",
      "Add originating Tor exit IP ranges to perimeter WAF",
      "Audit repository history and CI/CD secret stores"
    ]
  };
}

export function simulateImmediateAttack() {
  eventCounter++;
  const targetToken = mockTokensStore[0] || MOCK_TOKENS[0];
  const highRiskEvent = {
    id: eventCounter,
    token_id: targetToken.id,
    token_label: targetToken.label,
    ip: "185.220.101." + Math.floor(Math.random() * 200 + 10),
    geo: {
      city: "Frankfurt",
      country: "Germany",
      isp: "Zwiebelfreunde e.V.",
      proxy: true,
      hosting: true
    },
    ua: "python-requests/2.31.0 (MassScan Automated Prober)",
    path: "/api/v1/auth/aws-key-exchange",
    ts: new Date().toISOString(),
    time_ago: "just now",
    score: 94,
    severity: "high",
    flags: ["scripted_ua", "proxy_ip", "tor", "burst"]
  };

  broadcastEvent(highRiskEvent);
  return highRiskEvent;
}

let simulatorTimer = null;
export function startMockSimulator(onEvent) {
  subscribers.add(onEvent);
  if (!simulatorTimer) {
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 6000) + 7000;
      simulatorTimer = setTimeout(() => {
        eventCounter++;
        const target = mockTokensStore[Math.floor(Math.random() * mockTokensStore.length)] || MOCK_TOKENS[0];
        const fakeEvent = {
          id: eventCounter,
          token_id: target.id,
          token_label: target.label,
          ip: "152.59.219." + Math.floor(Math.random() * 200 + 10),
          geo: { city: "London", country: "United Kingdom", proxy: false, hosting: false },
          ua: "curl/8.1.2",
          path: "/canary/vault",
          ts: new Date().toISOString(),
          time_ago: "just now",
          score: 60,
          severity: "medium",
          flags: ["canary_url", "odd_hour", "rapid_fire"]
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
