from __future__ import annotations

from typing import Any, Dict, Optional


def to_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, (list, tuple, set)):
        text = ", ".join(str(v) for v in value if v is not None)
        return text or None
    return str(value)


def normalize_ranked_product(item: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(item)
    if out.get("score") is None and out.get("recommendation_score") is not None:
        out["score"] = out.get("recommendation_score")
    out["explanation"] = to_text(out.get("explanation") or out.get("matched_terms"))
    return out
