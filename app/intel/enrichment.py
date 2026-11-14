"""
IP Enrichment Module for the Snare intelligence layer.

Enriches public IP addresses using ip-api.com with:
- Strict 3-second timeout
- In-memory 1-hour TTL cache
- Automatic bypass for private, loopback, reserved, and invalid IP addresses
- Resilient fallback on network/API failure (never raises exceptions)
- Protection against exposing internal infrastructure details
"""

import ipaddress
import logging
import os
import time
import urllib.request
import urllib.error
import json
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Maximum request timeout in seconds (must not exceed 3 seconds)
REQUEST_TIMEOUT = min(3.0, float(os.getenv("IP_LOOKUP_TIMEOUT", "3.0")))

# In-memory cache TTL in seconds (1 hour)
CACHE_TTL_SECONDS = 3600

# Thread-safe in-memory cache: ip -> (cached_at_timestamp, enrichment_dict)
_ENRICHMENT_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}

FALLBACK_RESULT: Dict[str, Any] = {
    "country": "Unknown",
    "region": "Unknown",
    "city": "Unknown",
    "isp": "Unknown",
    "org": "Unknown",
    "asn": "Unknown",
    "proxy": False,
    "hosting": False,
}

PRIVATE_IP_RESULT: Dict[str, Any] = {
    "country": "Private Network",
    "region": "Local",
    "city": "Internal",
    "isp": "Private Network",
    "org": "Internal Network",
    "asn": "AS0",
    "proxy": False,
    "hosting": False,
}


def is_public_ip(ip_str: str) -> bool:
    """
    Validate whether an IP address is a valid public IP.
    Returns False for private, loopback, reserved, link-local, multicast, or invalid strings.
    """
    if not ip_str or not isinstance(ip_str, str):
        return False
    clean = ip_str.strip()
    try:
        ip_obj = ipaddress.ip_address(clean)
        return not (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_reserved
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_unspecified
        )
    except ValueError:
        return False


def _parse_asn(as_field: Any) -> str:
    """Extract ASN identifier (e.g. 'AS208323') from raw AS string."""
    if not as_field or not isinstance(as_field, str):
        return "Unknown"
    cleaned = as_field.strip()
    if not cleaned:
        return "Unknown"
    parts = cleaned.split()
    if parts and parts[0].upper().startswith("AS"):
        return parts[0].upper()
    return cleaned


def enrich(ip: Any) -> Dict[str, Any]:
    """
    Enrich an IP address with geolocation and network threat indicators.

    Args:
        ip: IPv4 or IPv6 string.

    Returns:
        dict: Standardized dictionary containing country, region, city, isp, org, asn, proxy, hosting.
              Never raises an exception; returns fallback on any error.
    """
    if not ip or not isinstance(ip, str):
        return dict(FALLBACK_RESULT)

    clean_ip = ip.strip()
    if not clean_ip:
        return dict(FALLBACK_RESULT)

    # Allow mock override via environment for test suites
    mock_env = os.getenv("MOCK_IP_ENRICHMENT")
    if mock_env:
        try:
            parsed = json.loads(mock_env)
            if isinstance(parsed, dict):
                return {
                    "country": str(parsed.get("country", "Unknown")),
                    "region": str(parsed.get("region", "Unknown")),
                    "city": str(parsed.get("city", "Unknown")),
                    "isp": str(parsed.get("isp", "Unknown")),
                    "org": str(parsed.get("org", "Unknown")),
                    "asn": str(parsed.get("asn", "Unknown")),
                    "proxy": bool(parsed.get("proxy", False)),
                    "hosting": bool(parsed.get("hosting", False)),
                }
        except Exception:
            pass

    # Skip enrichment for private, loopback, reserved, or invalid IP addresses
    if not is_public_ip(clean_ip):
        # Check if it was an internal/private IP rather than outright junk
        try:
            ipaddress.ip_address(clean_ip)
            return dict(PRIVATE_IP_RESULT)
        except ValueError:
            return dict(FALLBACK_RESULT)

    now = time.time()

    # Check 1-hour in-memory cache
    if clean_ip in _ENRICHMENT_CACHE:
        cached_time, cached_data = _ENRICHMENT_CACHE[clean_ip]
        if now - cached_time < CACHE_TTL_SECONDS:
            return dict(cached_data)

    # Perform external lookup with strict <=3.0s timeout
    url = f"http://ip-api.com/json/{clean_ip}?fields=status,message,country,regionName,city,isp,org,as,proxy,hosting"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Snare-Security-Trap/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as response:
            if response.status != 200:
                logger.warning("ip-api returned HTTP status %s for IP %s", response.status, clean_ip)
                return dict(FALLBACK_RESULT)

            raw_bytes = response.read()
            data = json.loads(raw_bytes.decode("utf-8"))

            if data.get("status") != "success":
                logger.warning("ip-api query failed: %s", data.get("message", "unknown error"))
                return dict(FALLBACK_RESULT)

            result = {
                "country": str(data.get("country") or "Unknown"),
                "region": str(data.get("regionName") or "Unknown"),
                "city": str(data.get("city") or "Unknown"),
                "isp": str(data.get("isp") or "Unknown"),
                "org": str(data.get("org") or "Unknown"),
                "asn": _parse_asn(data.get("as")),
                "proxy": bool(data.get("proxy", False)),
                "hosting": bool(data.get("hosting", False)),
            }

            # Cache successful result
            _ENRICHMENT_CACHE[clean_ip] = (now, dict(result))
            return result

    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.warning("Enrichment lookup failed for %s: %s", clean_ip, exc)
        return dict(FALLBACK_RESULT)
    except Exception as exc:
        logger.error("Unexpected error enriching IP %s: %s", clean_ip, exc)
        return dict(FALLBACK_RESULT)


def clear_enrichment_cache() -> None:
    """Clear in-memory cache (primarily used in testing)."""
    _ENRICHMENT_CACHE.clear()
