"""
Telegram Alert Dispatcher for the Mirage platform.

HARD CONTRACT RULES:
1. Credentials loaded strictly from environment variables:
   - TELEGRAM_BOT_TOKEN (or legacy TELEGRAM_TOKEN)
   - TELEGRAM_CHAT_ID
   Never log, hardcode, or leak tokens.
2. Plain text messages ONLY (no parse_mode). Never interpolate attacker data into HTML/Markdown.
3. Global rate limit of at least 10 seconds between notifications.
4. Failures must NEVER raise exceptions or interrupt event recording.
5. Rich forensic metadata: incident ID, severity, score, source IP, geo, event count, flags.
"""

import logging
import os
import time
import threading
try:
    import requests
except ImportError:  # Optional for app startup; listed in requirements for alert delivery.
    requests = None
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Minimum interval between outgoing Telegram notifications (seconds)
MIN_RATE_LIMIT_INTERVAL = 10.0

# Network timeout in seconds for Telegram API calls
DEFAULT_TIMEOUT = 5.0

# Synchronization lock and rate-limiter state
_RATE_LOCK = threading.Lock()
_LAST_DISPATCH_TIME: float = 0.0
_SUPPRESSED_ALERTS_COUNT: int = 0


def send_alert(incident: Dict[str, Any]) -> bool:
    """
    Send a plain text incident notification to Telegram.

    Args:
        incident: Incident dictionary containing forensic telemetry.

    Returns:
        bool: True if dispatched successfully, False otherwise.
              Never raises an exception under any failure condition.
    """
    global _LAST_DISPATCH_TIME, _SUPPRESSED_ALERTS_COUNT

    if not isinstance(incident, dict):
        logger.warning("send_alert called with non-dict incident: %s", type(incident))
        return False


    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not bot_token or not chat_id:
        logger.warning("Telegram credentials missing (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Skipping alert.")
        return False
    if requests is None:
        logger.warning("requests is not installed; skipping Telegram alert delivery")
        return False

    now = time.time()
    with _RATE_LOCK:
        elapsed = now - _LAST_DISPATCH_TIME
        if elapsed < MIN_RATE_LIMIT_INTERVAL:
            _SUPPRESSED_ALERTS_COUNT += 1
            logger.info("Telegram rate limit active (elapsed %.1fs < 10s). Alert queued (%d suppressed).",
                        elapsed, _SUPPRESSED_ALERTS_COUNT)
            return False

        # Ready to send; consume any suppressed count note
        suppressed_note = f"\n(+{_SUPPRESSED_ALERTS_COUNT} additional events queued during rate limit)" if _SUPPRESSED_ALERTS_COUNT > 0 else ""
        _SUPPRESSED_ALERTS_COUNT = 0
        _LAST_DISPATCH_TIME = now

    from app.intel.sanitize import sanitize_untrusted_text

    # Sanitize all untrusted fields
    inc_id = sanitize_untrusted_text(incident.get("id") or incident.get("incident_id") or "New", max_length=32)
    score = incident.get("score", 40)
    severity = str(incident.get("severity") or "low").upper()
    ip = sanitize_untrusted_text(incident.get("ip") or incident.get("source_ip") or "Unknown", max_length=64)

    # Geo parsing
    geo = incident.get("geo") if isinstance(incident.get("geo"), dict) else {}
    country = sanitize_untrusted_text(geo.get("country") or "Unknown", max_length=64)
    city = sanitize_untrusted_text(geo.get("city") or "", max_length=64)
    geo_str = f"{country}, {city}".strip(", ") if city else country

    isp = sanitize_untrusted_text(geo.get("isp") or geo.get("org") or "Unknown", max_length=64)
    asn = sanitize_untrusted_text(geo.get("asn") or geo.get("as") or "", max_length=32)
    network_str = f"{isp} ({asn})".strip(" ()") if asn and isp != "Unknown" else isp

    event_count = incident.get("event_count") or (len(incident.get("events")) if isinstance(incident.get("events"), list) else 1)

    flags = incident.get("flags") or []
    flags_clean = [sanitize_untrusted_text(f, max_length=32) for f in flags]
    flags_str = ", ".join(flags_clean) if flags_clean else "None"

    token_label = sanitize_untrusted_text(incident.get("token_label") or incident.get("token_id") or incident.get("name") or "Honeytoken", max_length=64)

    dashboard_url = os.getenv("DASHBOARD_URL", "").strip().rstrip("/")
    dashboard_note = f"\nDashboard: {dashboard_url}/incidents/{inc_id}" if dashboard_url else ""

    # Build PLAIN TEXT message (strictly no parse_mode)
    lines: List[str] = [
        "[MIRAGE SECURITY ALERT] Honeytoken Triggered!",
        "",
        f"Incident ID: #{inc_id}",
        f"Severity: {severity} (Score: {score}/100)",
        f"Token: {token_label}",
        f"Attacker IP: {ip} ({geo_str})",
        f"Network: {network_str}",
        f"Event Count: {event_count}",
        f"Flags Triggered: {flags_str}",
    ]

    if suppressed_note:
        lines.append(suppressed_note)

    if dashboard_note:
        lines.append(dashboard_note)

    plain_text = "\n".join(lines)

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": plain_text,
        # NOTE: HARD RULE - no parse_mode specified! Plain text only.
    }

    try:
        response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)
        if response.status_code == 200:
            res_json = response.json()
            if res_json.get("ok") is True:
                return True
            logger.warning("Telegram API rejected message: %s", res_json)
            return False
        logger.warning("Telegram API HTTP %s: %s", response.status_code, response.text)
        return False
    except (requests.RequestException, TimeoutError) as exc:
        logger.warning("Failed to dispatch Telegram alert (network/timeout): %s", exc)
        return False
    except Exception as exc:
        logger.error("Unexpected error in send_alert: %s", exc)
        return False


def send_leak_alert(alert: Dict[str, Any]) -> bool:
    """Send a plain-text notice that a repository alert produced a decoy.

    The exposed credential is intentionally never accepted by this function.
    """
    global _LAST_DISPATCH_TIME, _SUPPRESSED_ALERTS_COUNT
    if not isinstance(alert, dict):
        return False
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not bot_token or not chat_id or requests is None:
        logger.warning("Telegram credentials missing or requests unavailable; skipping leak alert")
        return False

    now = time.time()
    with _RATE_LOCK:
        if now - _LAST_DISPATCH_TIME < MIN_RATE_LIMIT_INTERVAL:
            _SUPPRESSED_ALERTS_COUNT += 1
            logger.info("Telegram rate limit active; suppressing GitHub leak alert")
            return False
        _LAST_DISPATCH_TIME = now
        _SUPPRESSED_ALERTS_COUNT = 0

    from app.intel.sanitize import sanitize_untrusted_text

    repository = sanitize_untrusted_text(alert.get("repository") or "unknown", max_length=120)
    alert_number = sanitize_untrusted_text(alert.get("alert_number") or "unknown", max_length=80)
    secret_type = sanitize_untrusted_text(alert.get("secret_type") or "unknown", max_length=100)
    source_path = sanitize_untrusted_text(alert.get("source_path") or "unknown", max_length=180)
    decoy_path = sanitize_untrusted_text(alert.get("decoy_path") or "unknown", max_length=180)
    source_line = alert.get("source_line")
    is_demo = bool(alert.get("is_demo"))
    lines = [
        "[MIRAGE SECURITY ALERT] GitHub secret alert handled",
        "DEMO CASE (simulated)" if is_demo else "New repository secret-scanning alert",
        f"Repository: {repository}",
        f"Alert: #{alert_number}",
        f"Detected type: {secret_type}",
        f"Source: {source_path}" + (f":{source_line}" if source_line else ""),
        f"Mirage decoy planted: {decoy_path}",
    ]
    alert_url = alert.get("alert_url")
    if alert_url:
        lines.append(f"GitHub alert: {sanitize_untrusted_text(alert_url, max_length=300)}")
    payload = {"chat_id": chat_id, "text": "\n".join(lines)}
    try:
        response = requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json=payload,
            timeout=DEFAULT_TIMEOUT,
        )
        if response.status_code == 200 and response.json().get("ok") is True:
            return True
        logger.warning("Telegram rejected GitHub leak alert (HTTP %s)", response.status_code)
        return False
    except Exception as exc:
        logger.warning("Could not send GitHub leak alert: %s", exc)
        return False


def reset_rate_limiter() -> None:
    """Reset rate limiter state (used in testing)."""
    global _LAST_DISPATCH_TIME, _SUPPRESSED_ALERTS_COUNT
    with _RATE_LOCK:
        _LAST_DISPATCH_TIME = 0.0
        _SUPPRESSED_ALERTS_COUNT = 0
