"""
Deterministic Threat Scoring Engine for the Snare intelligence layer.

HARD CONTRACT RULES:
1. Explainable, deterministic calculation with no LLM involvement.
2. Base score: 40.
3. Scripted or automated user agent: +15 ('scripted_ua').
4. Suspicious request patterns: +15 ('suspicious_request').
5. Multi-token probe (2+ distinct honeytokens from same IP within 10 min): +25 ('multi_token_probe').
   - Multi-token bonus is applied exactly once.
6. Score cap: 100 max.
7. Severity thresholds:
   - Low: < 50
   - Medium: 50–69
   - High: 70–100

Reconciliation of legacy flags:
- Specific indicators like hosting, proxy/Tor, rapid-fire bursts, and off-hours are detected as
  explainable sub-flags (e.g. 'hosting_ip', 'proxy_ip', 'rapid_fire') under the unified
  'suspicious_request' pattern category, ensuring point increments strictly adhere to the contract.
"""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence, Set

# Point values defined in contract
BASE_SCORE = 40
POINTS_SCRIPTED_UA = 15
POINTS_SUSPICIOUS_REQUEST = 15
POINTS_MULTI_TOKEN = 25

# Automated tooling User-Agent regex
_SCRIPTED_UA_REGEX = re.compile(
    r"(?i)\b("
    r"python-requests|requests|curl|boto3|botocore|aws-cli|go-http-client|"
    r"wget|httpie|postman|masscan|nmap|zgrab|sqlmap|nuclei|aiohttp|"
    r"httpx|libwww-perl|insomnia|scrapy|nikto|censys|shodan|gobuster|"
    r"dirbuster|ffuf|wfuzz|burp|metasploit|openvas|hydra"
    r")\b"
)

# Suspicious request path patterns (reconnaissance, secrets hunting, AWS S3/STS probing)
_SUSPICIOUS_PATH_REGEX = re.compile(
    r"(?i)("
    r"\.env|\.git|\.aws|wp-login|/admin|/sts/|/s3/|/aws/|list-buckets|"
    r"assume-role|get-caller-identity|\.\./|/etc/passwd|/api/v1/auth"
    r")"
)


def _parse_timestamp(val: Any) -> datetime:
    """Safely parse ISO string, epoch float/int, or datetime into UTC datetime."""
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)

    if isinstance(val, (int, float)):
        try:
            return datetime.fromtimestamp(val, tz=timezone.utc)
        except (ValueError, OSError):
            return datetime.now(timezone.utc)

    if isinstance(val, str) and val.strip():
        cleaned = val.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return datetime.now(timezone.utc)


def is_scripted_ua(ua: Any) -> bool:
    """Check if User-Agent matches known automated tooling or is missing."""
    if ua is None:
        return True
    ua_str = str(ua).strip()
    if not ua_str or ua_str.lower() in ("unknown", "none", "null", "-"):
        return True
    return bool(_SCRIPTED_UA_REGEX.search(ua_str))


def check_multi_token_probing(
    current_token_id: str,
    current_ip: str,
    current_dt: datetime,
    history: Sequence[Dict[str, Any]],
    window_seconds: int = 600,
) -> bool:
    """
    Check if the same IP accessed 2 or more distinct honeytoken IDs within rolling 10 minutes.
    """
    if not current_ip:
        return False

    distinct_tokens: Set[str] = set()
    if current_token_id:
        distinct_tokens.add(str(current_token_id))

    for item in history:
        item_ip = str(item.get("ip") or item.get("source_ip") or "").strip()
        if item_ip and item_ip == current_ip:
            item_token_id = str(item.get("token_id") or item.get("honeytoken_id") or "").strip()
            if item_token_id:
                item_dt = _parse_timestamp(item.get("ts") or item.get("timestamp") or item.get("created_at"))
                diff = abs((current_dt - item_dt).total_seconds())
                if diff <= window_seconds:
                    distinct_tokens.add(item_token_id)
                    if len(distinct_tokens) >= 2:
                        return True
    return False


def score(
    event: Dict[str, Any],
    history: Optional[Sequence[Dict[str, Any]]] = None,
    is_multi_token: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Deterministically score a honeytoken usage event.

    Args:
        event: Event dictionary containing ua, path, headers, geo, etc.
        history: Optional historical event sequence for the attacker IP.
        is_multi_token: Optional pre-computed boolean indicating multi-token probe.

    Returns:
        dict: {
            "score": int,                               # 0-100 capped
            "severity": "low" | "medium" | "high",      # Deterministic mapping
            "flags": list[str]                          # Sorted list of triggered flags
        }
    """
    if not isinstance(event, dict):
        event = {}

    hist = history or []

    ip = str(event.get("ip") or event.get("source_ip") or "").strip()
    ua = event.get("ua") if "ua" in event else event.get("user_agent")
    path = str(event.get("path") or "/")
    token_id = str(event.get("token_id") or event.get("honeytoken_id") or "").strip()
    event_dt = _parse_timestamp(event.get("ts") or event.get("timestamp") or event.get("created_at"))

    triggered_flags: List[str] = []
    points = BASE_SCORE

    # 1. Scripted User-Agent (+15)
    if is_scripted_ua(ua):
        triggered_flags.append("scripted_ua")
        points += POINTS_SCRIPTED_UA

    # 2. Suspicious request patterns (+15)
    # Check for reconnaissance paths, hosting/proxy infrastructure, rapid bursts, or off-hours
    geo = event.get("geo") if isinstance(event.get("geo"), dict) else {}
    is_hosting = bool(geo.get("hosting")) or bool(event.get("hosting"))
    is_proxy = bool(geo.get("proxy")) or bool(event.get("proxy")) or bool(event.get("is_tor"))
    is_suspicious_path = bool(_SUSPICIOUS_PATH_REGEX.search(path))
    is_off_hours = (0 <= event_dt.hour < 5)

    # Check rapid fire (5+ requests in 60s)
    rapid_fire = False
    if ip and hist:
        count = 1
        for item in hist:
            item_ip = str(item.get("ip") or item.get("source_ip") or "").strip()
            if item_ip == ip:
                item_dt = _parse_timestamp(item.get("ts") or item.get("timestamp") or item.get("created_at"))
                if abs((event_dt - item_dt).total_seconds()) <= 60:
                    count += 1
                    if count >= 5:
                        rapid_fire = True
                        break

    has_suspicious_pattern = is_suspicious_path or is_hosting or is_proxy or rapid_fire or is_off_hours

    if has_suspicious_pattern:
        triggered_flags.append("suspicious_request")
        points += POINTS_SUSPICIOUS_REQUEST

        # Add detailed explainability sub-flags without double-counting points
        if is_hosting:
            triggered_flags.append("hosting_ip")
        if is_proxy:
            triggered_flags.append("proxy_ip")
        if rapid_fire:
            triggered_flags.append("rapid_fire")
        if is_off_hours:
            triggered_flags.append("off_hours")

    # 3. Multi-token probing (+25)
    # Applied exactly once
    multi_token_detected = False
    if is_multi_token is True:
        multi_token_detected = True
    elif is_multi_token is None:
        multi_token_detected = check_multi_token_probing(token_id, ip, event_dt, hist)

    if multi_token_detected:
        triggered_flags.append("multi_token_probe")
        points += POINTS_MULTI_TOKEN

    # Apply 100 cap
    final_score = min(100, max(0, points))

    # Determine severity
    if final_score >= 70:
        severity = "high"
    elif final_score >= 50:
        severity = "medium"
    else:
        severity = "low"

    return {
        "score": final_score,
        "severity": severity,
        "flags": sorted(list(set(triggered_flags))),
    }
