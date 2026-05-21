import type { BudgetRange, RankedProduct, TimeSlot } from "@/lib/api";
import type { Product } from "@/app/context/GiftContext";
import zippoPosterImage from "@/imports/688848913_122097023553303340_3381634510348203818_n.jpg";
import zippoAppShowcaseImage from "@/imports/690838472_1291988782913450_5046986499448587050_n__1_.png";

const FALLBACK_IMAGES = [
  zippoPosterImage,
  zippoAppShowcaseImage,
  zippoPosterImage,
  zippoAppShowcaseImage,
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
  const resolvedId = row.id ?? row.source_id ?? row.product_id ?? index + 1;

  return {
    id: typeof resolvedId === "number" || typeof resolvedId === "string" ? resolvedId : index + 1,
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
    category: row.category ? String(row.category) : undefined,
    stock: typeof row.stock === "number" ? row.stock : Number(row.stock ?? 0) || 0,
    explanation,
  };
}
