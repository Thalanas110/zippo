import type { BudgetRange, RankedProduct, TimeSlot } from "@/lib/api";
import type { Product } from "@/app/context/GiftContext";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1718934628487-f600d3861d0e?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1693165236987-c1ae0418fa89?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1773450970959-cef81e9b1053?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1545844568-98bb15133ec0?w=400&auto=format&fit=crop",
];

function toScorePercent(score: unknown): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 80;
  }
  if (score <= 1) {
    return Math.max(60, Math.min(99, Math.round(score * 100)));
  }
  return Math.max(60, Math.min(99, Math.round(score)));
}

export function budgetToRange(budget: number): BudgetRange {
  if (budget <= 300) return "low";
  if (budget <= 800) return "mid";
  return "high";
}

export function appSlotToApiSlot(slot: "morning" | "afternoon" | "evening"): TimeSlot {
  if (slot === "morning") return "Morning";
  if (slot === "afternoon") return "PM";
  return "Eve";
}

export function rankedProductToUiProduct(row: RankedProduct, index: number): Product {
  const price = Number(row.price ?? 0) || 0;
  const store = String(row.vendor_name ?? row.store_name ?? "Local Store");
  const location = row.local ? "Local store" : "Marketplace";
  const explanation = row.explanation ? String(row.explanation) : "Recommended by ZIPPO AI";

  return {
    id: typeof row.id === "number" ? row.id : index + 1,
    name: row.name || "Gift Item",
    store,
    location,
    price,
    match: toScorePercent(row.score),
    badge: index === 0 ? "#1 Pick" : undefined,
    image: row.image_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    tags: [
      `${toScorePercent(row.score)}% match`,
      explanation,
    ],
  };
}
