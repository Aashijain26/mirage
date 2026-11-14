"""
Snare Intelligence & Alerting Layer package.

Public interface exporting the 6 core intelligence modules:
- enrich(ip) -> dict
- score(event, history) -> dict
- should_alert(prev, new) -> bool
- send_alert(incident) -> bool
- generate_decoys(stack_description, token_types) -> list[dict]
- summarize_incident(incident, events) -> dict
"""

from app.intel.enrichment import enrich
from app.intel.scoring import score
from app.intel.alerting import should_alert
from app.alerts import send_alert
from app.intel.decoys import generate_decoys
from app.intel.summarizer import summarize_incident

__all__ = [
    "enrich",
    "score",
    "should_alert",
    "send_alert",
    "generate_decoys",
    "summarize_incident",
]
