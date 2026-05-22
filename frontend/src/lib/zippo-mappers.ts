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

const CATEGORY_ART: Record<string, { accent: string; bg: string; emoji: string }> = {
  electronics: { accent: "#2563EB", bg: "#EFF6FF", emoji: "💻" },
  food: { accent: "#EA580C", bg: "#FFF7ED", emoji: "🍪" },
  clothes: { accent: "#7C3AED", bg: "#F5F3FF", emoji: "🧥" },
  accessories: { accent: "#DB2777", bg: "#FDF2F8", emoji: "⌚" },
  home: { accent: "#0F766E", bg: "#F0FDFA", emoji: "🕯️" },
  flowers: { accent: "#BE185D", bg: "#FDF2F8", emoji: "🌷" },
};

function isPremiumDemoProduct(row: RankedProduct, index: number): boolean {
  const resolvedId = row.source_id ?? row.product_id ?? row.id ?? index + 1;
  const sourceId = Number(resolvedId);
  return Number.isFinite(sourceId) && sourceId >= 740000000;
}

function buildDemoProductImage(row: RankedProduct): string {
  const category = String(row.category ?? "gift").toLowerCase();
  const style = CATEGORY_ART[category] ?? { accent: "#8B1520", bg: "#FFF1F2", emoji: "🎁" };
  const title = String(row.name ?? "Gift").slice(0, 28);
  const store = String(row.vendor_name ?? row.store_name ?? "ZIPPO").slice(0, 24);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <rect width="900" height="900" rx="72" fill="${style.bg}"/>
      <rect x="54" y="54" width="792" height="792" rx="56" fill="white" stroke="${style.accent}" stroke-width="12"/>
      <circle cx="170" cy="180" r="88" fill="${style.accent}"/>
      <text x="170" y="210" text-anchor="middle" font-size="84">${style.emoji}</text>
      <text x="94" y="346" font-size="42" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="700">${category.toUpperCase()}</text>
      <text x="94" y="448" font-size="68" font-family="Arial, sans-serif" fill="#111827" font-weight="800">${title}</text>
      <text x="94" y="520" font-size="34" font-family="Arial, sans-serif" fill="#6B7280">${store}</text>
      <rect x="94" y="602" width="710" height="152" rx="32" fill="${style.accent}" opacity="0.08"/>
      <text x="128" y="664" font-size="30" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="700">ZIPPO DEMO PICK</text>
      <text x="128" y="718" font-size="28" font-family="Arial, sans-serif" fill="#374151">Synthetic showcase card for presentation mode</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
    image:
      row.image_url ||
      (isPremiumDemoProduct(row, index) ? buildDemoProductImage(row) : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]),
    tags: [
      `${toScorePercent(row.score)}% match`,
      explanation,
    ],
    category: row.category ? String(row.category) : undefined,
    stock: typeof row.stock === "number" ? row.stock : Number(row.stock ?? 0) || 0,
    explanation,
  };
}
