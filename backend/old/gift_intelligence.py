"""
gift_intelligence.py
Module 1 — Gift Intelligence Filter for ZIPPO.

Purpose:
    Filter and rank gift items using occasion, recipient type, budget, location,
    user preferences, and basic availability signals.

Design notes:
    - Uses only the Python standard library.
    - Accepts lists of dictionaries, so it can work with JSON from your web app.
    - Returns a comparable output format usable by recommendations.py and baseline.py.

Expected gift item fields:
    id: str | int
    name: str
    price: float
    category: str
    vendor_id: str | int
    vendor_name: str
    stock: int
    rating: float, optional
    popularity: float, optional
    local: bool, optional
    tags: list[str], optional
    occasions: list[str], optional
    recipients: list[str], optional
    delivery_zones: list[str], optional

Example query:
    {
        "occasion": "birthday",
        "recipient": "student",
        "budget_min": 200,
        "budget_max": 1000,
        "location": "Olongapo City",
        "preferences": ["cute", "useful"],
        "avoid": ["fragile"]
    }
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
import math
import re


GiftItem = Dict[str, Any]
GiftQuery = Dict[str, Any]
ScoredGift = Dict[str, Any]


TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


@dataclass(frozen=True)
class FilterWeights:
    """Weights for the intelligent gift filter scoring model."""

    occasion_match: float = 0.25
    recipient_match: float = 0.20
    preference_match: float = 0.15
    budget_fit: float = 0.15
    quality: float = 0.10
    popularity: float = 0.06
    local_vendor: float = 0.05
    delivery_fit: float = 0.04

    def normalized(self) -> "FilterWeights":
        total = sum(self.__dict__.values())
        if total <= 0:
            return self
        return FilterWeights(**{k: v / total for k, v in self.__dict__.items()})


@dataclass
class GiftFilterConfig:
    """Configuration for filtering and ranking gift products."""

    strict_budget: bool = True
    require_stock: bool = True
    require_delivery_zone: bool = False
    min_rating: Optional[float] = None
    weights: FilterWeights = field(default_factory=FilterWeights)


def normalize_text(value: Any) -> str:
    """Normalize arbitrary text into a lowercase string."""
    if value is None:
        return ""
    return " ".join(TOKEN_RE.findall(str(value).lower()))


def tokenize(value: Any) -> set[str]:
    """Return simple lowercase tokens from text, list, tuple, or set."""
    if value is None:
        return set()
    if isinstance(value, (list, tuple, set)):
        value = " ".join(str(v) for v in value)
    return set(TOKEN_RE.findall(str(value).lower()))


def as_list(value: Any) -> List[str]:
    """Normalize a value to a list of lowercase strings."""
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return [normalize_text(v) for v in value if normalize_text(v)]
    text = normalize_text(value)
    return [text] if text else []


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _overlap_score(query_terms: Sequence[str] | str | None, item_terms: Sequence[str] | str | None) -> float:
    """Soft overlap score between query terms and item terms."""
    q = tokenize(query_terms)
    i = tokenize(item_terms)
    if not q:
        return 0.50  # neutral when user gave no constraint
    if not i:
        return 0.0
    return len(q & i) / len(q)


def _budget_score(price: float, budget_min: Optional[float], budget_max: Optional[float]) -> float:
    """
    Score how well a price fits the budget.

    Full score when price is inside budget. Inside the budget, a price closer
    to 70% of the max budget is rewarded slightly because it feels high-value
    without maxing out the customer.
    """
    if budget_max is None and budget_min is None:
        return 0.50

    if budget_min is not None and price < budget_min:
        # Cheap is not always bad, but it may feel too small for the occasion.
        return clamp(price / max(budget_min, 1.0) * 0.75)

    if budget_max is not None and price > budget_max:
        # Over budget gets penalized heavily.
        overflow = price - budget_max
        tolerance = max(budget_max * 0.50, 1.0)
        return clamp(1.0 - (overflow / tolerance), 0.0, 0.35)

    if budget_max is None:
        return 1.0

    target = budget_max * 0.70
    distance = abs(price - target)
    return clamp(1.0 - distance / max(budget_max, 1.0) * 0.35, 0.70, 1.0)


def _quality_score(item: GiftItem) -> float:
    """Combine rating and stock confidence into a quality signal."""
    rating = _safe_float(item.get("rating"), 0.0)
    rating_score = clamp(rating / 5.0) if rating else 0.50
    stock = _safe_int(item.get("stock"), 0)
    stock_score = clamp(math.log1p(max(stock, 0)) / math.log1p(50)) if stock > 0 else 0.0
    return (rating_score * 0.75) + (stock_score * 0.25)


def _popularity_score(item: GiftItem) -> float:
    popularity = _safe_float(item.get("popularity"), 0.0)
    # Accept either 0..1 popularity or raw counts.
    if popularity <= 1.0:
        return clamp(popularity)
    return clamp(math.log1p(popularity) / math.log1p(1000))


def _delivery_fit_score(item: GiftItem, location: Optional[str]) -> float:
    if not location:
        return 0.50
    zones = as_list(item.get("delivery_zones"))
    if not zones:
        return 0.50
    loc = normalize_text(location)
    return 1.0 if loc in zones or any(loc in zone or zone in loc for zone in zones) else 0.0


def _explain_score(parts: Dict[str, float], weights: FilterWeights) -> List[str]:
    """Generate short explanation strings for the strongest scoring reasons."""
    weighted = {
        "occasion match": parts["occasion_match"] * weights.occasion_match,
        "recipient fit": parts["recipient_match"] * weights.recipient_match,
        "preference match": parts["preference_match"] * weights.preference_match,
        "budget fit": parts["budget_fit"] * weights.budget_fit,
        "quality": parts["quality"] * weights.quality,
        "popular item": parts["popularity"] * weights.popularity,
        "local vendor": parts["local_vendor"] * weights.local_vendor,
        "delivery zone fit": parts["delivery_fit"] * weights.delivery_fit,
    }
    top = sorted(weighted.items(), key=lambda pair: pair[1], reverse=True)[:3]
    return [label for label, score in top if score > 0]


def passes_hard_filters(item: GiftItem, query: GiftQuery, config: GiftFilterConfig | None = None) -> Tuple[bool, List[str]]:
    """Check hard constraints before scoring."""
    config = config or GiftFilterConfig()
    reasons: List[str] = []

    stock = _safe_int(item.get("stock"), 0)
    if config.require_stock and stock <= 0:
        reasons.append("out of stock")

    price = _safe_float(item.get("price"), 0.0)
    budget_min = query.get("budget_min")
    budget_max = query.get("budget_max")
    budget_min = None if budget_min in (None, "") else _safe_float(budget_min)
    budget_max = None if budget_max in (None, "") else _safe_float(budget_max)

    if config.strict_budget and budget_max is not None and price > budget_max:
        reasons.append("over budget")
    if config.strict_budget and budget_min is not None and price < budget_min:
        reasons.append("below minimum budget")

    if config.min_rating is not None:
        rating = _safe_float(item.get("rating"), 0.0)
        if rating and rating < config.min_rating:
            reasons.append("below minimum rating")

    avoid_terms = tokenize(query.get("avoid"))
    item_terms = tokenize(
        [
            item.get("name", ""),
            item.get("category", ""),
            item.get("description", ""),
            item.get("tags", []),
        ]
    )
    if avoid_terms and avoid_terms & item_terms:
        reasons.append("contains avoided preference")

    if config.require_delivery_zone:
        delivery_fit = _delivery_fit_score(item, query.get("location"))
        if delivery_fit <= 0:
            reasons.append("outside delivery zone")

    return len(reasons) == 0, reasons


def score_gift(item: GiftItem, query: GiftQuery, config: GiftFilterConfig | None = None) -> ScoredGift:
    """Score a single gift item against a customer query."""
    config = config or GiftFilterConfig()
    weights = config.weights.normalized()

    occasion = query.get("occasion")
    recipient = query.get("recipient")
    preferences = query.get("preferences")
    budget_min = query.get("budget_min")
    budget_max = query.get("budget_max")
    location = query.get("location")

    price = _safe_float(item.get("price"), 0.0)
    budget_min_f = None if budget_min in (None, "") else _safe_float(budget_min)
    budget_max_f = None if budget_max in (None, "") else _safe_float(budget_max)

    searchable_preferences = [
        item.get("name", ""),
        item.get("category", ""),
        item.get("description", ""),
        item.get("tags", []),
    ]

    parts = {
        "occasion_match": _overlap_score(occasion, item.get("occasions")),
        "recipient_match": _overlap_score(recipient, item.get("recipients")),
        "preference_match": _overlap_score(preferences, searchable_preferences),
        "budget_fit": _budget_score(price, budget_min_f, budget_max_f),
        "quality": _quality_score(item),
        "popularity": _popularity_score(item),
        "local_vendor": 1.0 if bool(item.get("local", True)) else 0.0,
        "delivery_fit": _delivery_fit_score(item, location),
    }

    score = (
        parts["occasion_match"] * weights.occasion_match
        + parts["recipient_match"] * weights.recipient_match
        + parts["preference_match"] * weights.preference_match
        + parts["budget_fit"] * weights.budget_fit
        + parts["quality"] * weights.quality
        + parts["popularity"] * weights.popularity
        + parts["local_vendor"] * weights.local_vendor
        + parts["delivery_fit"] * weights.delivery_fit
    )

    passed, failed_reasons = passes_hard_filters(item, query, config)

    result = dict(item)
    result.update(
        {
            "score": round(score, 4),
            "score_parts": {k: round(v, 4) for k, v in parts.items()},
            "passed_filter": passed,
            "filter_reasons": failed_reasons,
            "explanation": _explain_score(parts, weights),
        }
    )
    return result


def intelligent_filter(
    gifts: Iterable[GiftItem],
    query: GiftQuery,
    top_k: int = 10,
    config: GiftFilterConfig | None = None,
    include_failed: bool = False,
) -> List[ScoredGift]:
    """
    Filter and rank gift items.

    Args:
        gifts: Iterable of gift dictionaries.
        query: Customer intent dictionary.
        top_k: Number of recommendations to return.
        config: Optional filtering/scoring configuration.
        include_failed: Include hard-filter failures in the returned list.

    Returns:
        List of scored gift dictionaries sorted by descending score.
    """
    config = config or GiftFilterConfig()
    scored = [score_gift(item, query, config) for item in gifts]
    if not include_failed:
        scored = [item for item in scored if item["passed_filter"]]
    scored.sort(key=lambda row: (row["score"], _safe_float(row.get("rating"), 0.0)), reverse=True)
    return scored[: max(top_k, 0)]


def summarize_recommendations(scored_gifts: Sequence[ScoredGift]) -> List[Dict[str, Any]]:
    """Return a lightweight output suitable for APIs/UI cards."""
    return [
        {
            "id": item.get("id"),
            "name": item.get("name"),
            "vendor_id": item.get("vendor_id"),
            "vendor_name": item.get("vendor_name"),
            "price": item.get("price"),
            "score": item.get("score"),
            "explanation": item.get("explanation", []),
        }
        for item in scored_gifts
    ]
