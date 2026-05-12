"""
recommendations.py
Module 2 — Recommendation System using Content-Based Filtering (CBF) for ZIPPO.

Purpose:
    Recommend gifts by comparing user intent or a seed gift against item content.

Algorithm:
    - Build a text profile for each gift item from name, category, tags,
      occasions, recipients, vendor, and price band.
    - Convert text to TF-IDF vectors.
    - Use cosine similarity to rank items.

Design notes:
    - Uses only the Python standard library.
    - Works with list[dict] so it can consume JSON directly.
    - Can be combined with gift_intelligence.intelligent_filter() by passing
      candidate IDs or reranking filtered gifts.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
import math
import re


GiftItem = Dict[str, Any]
Recommendation = Dict[str, Any]
TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
    "is", "it", "of", "on", "or", "the", "to", "with", "your", "you",
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        value = " ".join(str(v) for v in value)
    return " ".join(TOKEN_RE.findall(str(value).lower()))


def tokenize(value: Any) -> List[str]:
    text = normalize_text(value)
    return [token for token in TOKEN_RE.findall(text) if token not in STOPWORDS]


def price_band(price: Any) -> str:
    """Turn numeric item price into content tokens."""
    try:
        p = float(price)
    except (TypeError, ValueError):
        return "price_unknown"
    if p < 300:
        return "budget_low affordable"
    if p < 800:
        return "budget_mid value"
    if p < 1500:
        return "budget_high premium"
    return "budget_luxury premium"


def budget_query_terms(budget_max: Any) -> str:
    """Represent a customer budget as intent tokens without over-rewarding expensive gifts."""
    try:
        p = float(budget_max)
    except (TypeError, ValueError):
        return ""
    if p < 300:
        return "budget_low affordable"
    if p < 800:
        return "budget_low budget_mid affordable value"
    if p < 1500:
        return "budget_mid budget_high value"
    return "budget_high budget_luxury premium"


def build_item_profile(item: GiftItem) -> str:
    """Build searchable content profile text for one item."""
    parts = [
        item.get("name", ""),
        item.get("category", ""),
        item.get("description", ""),
        item.get("vendor_name", ""),
        item.get("tags", []),
        item.get("occasions", []),
        item.get("recipients", []),
        price_band(item.get("price")),
    ]
    if item.get("local", True):
        parts.append("local olongapo support local")
    return normalize_text(parts)


def build_user_profile(query: Dict[str, Any]) -> str:
    """Build content text from a customer's intent/query."""
    parts = [
        query.get("occasion", ""),
        query.get("recipient", ""),
        query.get("preferences", []),
        query.get("location", ""),
    ]
    budget_max = query.get("budget_max")
    if budget_max not in (None, ""):
        parts.append(budget_query_terms(budget_max))
    return normalize_text(parts)


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Cosine similarity for sparse vectors."""
    if not vec_a or not vec_b:
        return 0.0
    common = set(vec_a) & set(vec_b)
    numerator = sum(vec_a[token] * vec_b[token] for token in common)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return numerator / (norm_a * norm_b)


class SimpleTfidfVectorizer:
    """Minimal TF-IDF vectorizer implemented with pure Python."""

    def __init__(self, min_df: int = 1):
        self.min_df = min_df
        self.idf_: Dict[str, float] = {}
        self.vocabulary_: set[str] = set()

    def fit(self, documents: Sequence[str]) -> "SimpleTfidfVectorizer":
        document_frequency: Counter[str] = Counter()
        for doc in documents:
            document_frequency.update(set(tokenize(doc)))

        n_docs = max(len(documents), 1)
        self.vocabulary_ = {term for term, df in document_frequency.items() if df >= self.min_df}
        self.idf_ = {
            term: math.log((1 + n_docs) / (1 + document_frequency[term])) + 1.0
            for term in self.vocabulary_
        }
        return self

    def transform_one(self, document: str) -> Dict[str, float]:
        counts = Counter(token for token in tokenize(document) if token in self.vocabulary_)
        if not counts:
            return {}
        total = sum(counts.values())
        return {term: (count / total) * self.idf_.get(term, 0.0) for term, count in counts.items()}

    def fit_transform(self, documents: Sequence[str]) -> List[Dict[str, float]]:
        self.fit(documents)
        return [self.transform_one(doc) for doc in documents]


class ContentBasedRecommender:
    """Content-Based Filtering recommender for gift products."""

    def __init__(self, min_df: int = 1):
        self.vectorizer = SimpleTfidfVectorizer(min_df=min_df)
        self.items: List[GiftItem] = []
        self.item_profiles: List[str] = []
        self.item_vectors: List[Dict[str, float]] = []
        self.id_to_index: Dict[Any, int] = {}

    def fit(self, items: Iterable[GiftItem]) -> "ContentBasedRecommender":
        self.items = [dict(item) for item in items]
        self.item_profiles = [build_item_profile(item) for item in self.items]
        self.item_vectors = self.vectorizer.fit_transform(self.item_profiles)
        self.id_to_index = {item.get("id"): idx for idx, item in enumerate(self.items)}
        return self

    def _query_vector(self, query: Dict[str, Any] | str) -> Dict[str, float]:
        if isinstance(query, dict):
            text = build_user_profile(query)
        else:
            text = normalize_text(query)
        return self.vectorizer.transform_one(text)

    def recommend_from_query(
        self,
        query: Dict[str, Any] | str,
        top_k: int = 10,
        exclude_ids: Optional[Sequence[Any]] = None,
        candidate_ids: Optional[Sequence[Any]] = None,
    ) -> List[Recommendation]:
        """Recommend items similar to a user query/profile."""
        exclude = set(exclude_ids or [])
        candidates = set(candidate_ids) if candidate_ids is not None else None
        qvec = self._query_vector(query)

        recommendations: List[Recommendation] = []
        for item, ivec in zip(self.items, self.item_vectors):
            item_id = item.get("id")
            if item_id in exclude:
                continue
            if candidates is not None and item_id not in candidates:
                continue
            similarity = cosine_similarity(qvec, ivec)
            rec = dict(item)
            rec.update(
                {
                    "similarity": round(similarity, 4),
                    "recommendation_score": round(similarity, 4),
                    "method": "content_based_filtering",
                    "matched_terms": self.explain_match(qvec, ivec),
                }
            )
            recommendations.append(rec)

        recommendations.sort(key=lambda row: row["recommendation_score"], reverse=True)
        return recommendations[: max(top_k, 0)]

    def recommend_similar_items(
        self,
        seed_item_id: Any,
        top_k: int = 10,
        candidate_ids: Optional[Sequence[Any]] = None,
    ) -> List[Recommendation]:
        """Recommend items similar to an existing gift item."""
        if seed_item_id not in self.id_to_index:
            raise KeyError(f"Unknown seed_item_id: {seed_item_id!r}")

        seed_idx = self.id_to_index[seed_item_id]
        seed_vector = self.item_vectors[seed_idx]
        candidates = set(candidate_ids) if candidate_ids is not None else None

        recommendations: List[Recommendation] = []
        for idx, (item, ivec) in enumerate(zip(self.items, self.item_vectors)):
            item_id = item.get("id")
            if idx == seed_idx:
                continue
            if candidates is not None and item_id not in candidates:
                continue
            similarity = cosine_similarity(seed_vector, ivec)
            rec = dict(item)
            rec.update(
                {
                    "similarity": round(similarity, 4),
                    "recommendation_score": round(similarity, 4),
                    "method": "content_based_filtering_seed_item",
                    "matched_terms": self.explain_match(seed_vector, ivec),
                }
            )
            recommendations.append(rec)

        recommendations.sort(key=lambda row: row["recommendation_score"], reverse=True)
        return recommendations[: max(top_k, 0)]

    def rerank_candidates(
        self,
        query: Dict[str, Any] | str,
        candidates: Iterable[GiftItem],
        top_k: int = 10,
        cbf_weight: float = 0.55,
        existing_score_key: str = "score",
    ) -> List[Recommendation]:
        """
        Rerank pre-filtered candidates by blending intelligent filter score and CBF.

        This is useful after gift_intelligence.intelligent_filter().
        """
        candidate_map = {item.get("id"): dict(item) for item in candidates}
        cbf_recs = self.recommend_from_query(
            query,
            top_k=len(candidate_map),
            candidate_ids=list(candidate_map.keys()),
        )

        output: List[Recommendation] = []
        for rec in cbf_recs:
            original = candidate_map.get(rec.get("id"), {})
            base_score = float(original.get(existing_score_key, 0.0) or 0.0)
            cbf_score = float(rec.get("recommendation_score", 0.0) or 0.0)
            final_score = (cbf_score * cbf_weight) + (base_score * (1 - cbf_weight))
            merged = dict(original)
            merged.update(rec)
            merged["final_score"] = round(final_score, 4)
            merged["method"] = "intelligent_filter_plus_cbf"
            output.append(merged)

        output.sort(key=lambda row: row["final_score"], reverse=True)
        return output[: max(top_k, 0)]

    def explain_match(
        self,
        query_vector: Dict[str, float],
        item_vector: Dict[str, float],
        top_n: int = 5,
    ) -> List[str]:
        """Return terms contributing most to cosine similarity."""
        common = set(query_vector) & set(item_vector)
        weighted = sorted(
            ((term, query_vector[term] * item_vector[term]) for term in common),
            key=lambda pair: pair[1],
            reverse=True,
        )
        return [term for term, _ in weighted[:top_n]]


def recommend_gifts(
    gifts: Iterable[GiftItem],
    query: Dict[str, Any] | str,
    top_k: int = 10,
    exclude_ids: Optional[Sequence[Any]] = None,
    candidate_ids: Optional[Sequence[Any]] = None,
) -> List[Recommendation]:
    """Convenience function for one-shot CBF recommendations."""
    recommender = ContentBasedRecommender().fit(gifts)
    return recommender.recommend_from_query(
        query=query,
        top_k=top_k,
        exclude_ids=exclude_ids,
        candidate_ids=candidate_ids,
    )
