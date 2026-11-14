"""
Alert Decision Engine for the Snare intelligence layer.

HARD CONTRACT RULES:
1. An alert should be triggered when:
   - A new incident is created (prev_incident is None), OR
   - An existing incident escalates in severity (low < medium < high).
2. Avoid unnecessary repeated alerts for every event.
3. Zero complex heuristics or unapproved cooldown rules.
4. Purely deterministic logic.
"""

from typing import Any, Dict, Optional

SEVERITY_RANKS: Dict[str, int] = {
    "low": 1,
    "medium": 2,
    "high": 3,
}


def should_alert(
    prev_incident: Optional[Dict[str, Any]],
    new_incident: Dict[str, Any],
) -> bool:
    """
    Decide whether a Telegram alert should be triggered.

    Args:
        prev_incident: Prior incident state (or None if newly created).
        new_incident: Current updated incident state.

    Returns:
        bool: True if alert should be dispatched, False to suppress.
    """
    # 1. New incident created
    if not prev_incident:
        return True

    # 2. Existing incident escalated in severity
    prev_sev = str(prev_incident.get("severity") or "low").strip().lower()
    new_sev = str(new_incident.get("severity") or "low").strip().lower()

    prev_rank = SEVERITY_RANKS.get(prev_sev, 1)
    new_rank = SEVERITY_RANKS.get(new_sev, 1)

    return new_rank > prev_rank
