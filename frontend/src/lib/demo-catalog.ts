import type { Product } from "@/app/context/GiftContext";

type DemoCategory =
  | "Electronics"
  | "Food"
  | "Clothes"
  | "Accessories"
  | "Home"
  | "Flowers";

export interface DemoCatalogProduct {
  id: number;
  name: string;
  description: string;
  store: string;
  location: string;
  storeLat: number;
  storeLng: number;
  storeLogo: string;
  category: DemoCategory;
  price: number;
  stock: number;
  tags: string[];
  occasions: string[];
  recipients: string[];
  local: boolean;
  popularity: number;
  image: string;
  fallbackImage: string;
}

type DemoSearchInput = {
  occasion?: string | null;
  recipient?: string | null;
  giftType?: string | null;
  budget?: number | null;
  search?: string | null;
};

const CATEGORY_STYLES: Record<DemoCategory, { accent: string; background: string; mark: string }> = {
  Electronics: { accent: "#2563EB", background: "#EFF6FF", mark: "EL" },
  Food: { accent: "#EA580C", background: "#FFF7ED", mark: "FD" },
  Clothes: { accent: "#7C3AED", background: "#F5F3FF", mark: "CL" },
  Accessories: { accent: "#DB2777", background: "#FDF2F8", mark: "AC" },
  Home: { accent: "#0F766E", background: "#F0FDFA", mark: "HM" },
  Flowers: { accent: "#BE185D", background: "#FDF2F8", mark: "FL" },
};

function buildDemoImage(name: string, category: DemoCategory, store: string): string {
  const style = CATEGORY_STYLES[category];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${style.background}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="72" fill="url(#cardBg)"/>
      <rect x="48" y="48" width="804" height="804" rx="56" fill="white" stroke="${style.accent}" stroke-width="12"/>
      <circle cx="170" cy="180" r="86" fill="${style.accent}"/>
      <text x="170" y="205" text-anchor="middle" font-size="56" font-family="Arial, sans-serif" fill="white" font-weight="800">${style.mark}</text>
      <text x="92" y="328" font-size="34" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="700">${category.toUpperCase()}</text>
      <text x="92" y="426" font-size="64" font-family="Arial, sans-serif" fill="#111827" font-weight="800">${name}</text>
      <text x="92" y="496" font-size="30" font-family="Arial, sans-serif" fill="#6B7280">${store}</text>
      <rect x="92" y="592" width="716" height="164" rx="28" fill="${style.accent}" opacity="0.08"/>
      <text x="128" y="654" font-size="30" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="700">ZIPPO DEMO COLLECTION</text>
      <text x="128" y="708" font-size="28" font-family="Arial, sans-serif" fill="#374151">Curated premium gift showcase for presentation mode</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("&", "")
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildProductAssetPath(name: string, category: DemoCategory): string {
  return `/demo-products/${category}/${slugifyProductName(name)}.png`;
}

function renderProductIllustration(kind: string, accent: string, soft: string): string {
  const dark = "#111827";
  switch (kind) {
    case "hamper":
      return `
        <rect x="210" y="470" width="480" height="210" rx="26" fill="#C0894F"/>
        <rect x="250" y="425" width="400" height="70" rx="18" fill="#8B5E34"/>
        <circle cx="310" cy="400" r="52" fill="${soft}" stroke="${accent}" stroke-width="14"/>
        <circle cx="450" cy="372" r="60" fill="#FFE7D6" stroke="${accent}" stroke-width="14"/>
        <circle cx="590" cy="404" r="48" fill="#FFF3B0" stroke="${accent}" stroke-width="14"/>
      `;
    case "coffee-box":
      return `
        <rect x="230" y="430" width="440" height="230" rx="28" fill="#B45309"/>
        <rect x="280" y="330" width="130" height="170" rx="26" fill="#F8FAFC" stroke="${dark}" stroke-width="10"/>
        <path d="M410 390 h36 a28 28 0 0 1 0 56 h-36" fill="none" stroke="${dark}" stroke-width="12"/>
        <rect x="470" y="350" width="150" height="56" rx="18" fill="#FDE68A"/>
        <rect x="470" y="424" width="150" height="56" rx="18" fill="#FED7AA"/>
      `;
    case "chocolate-tower":
      return `
        <rect x="280" y="490" width="340" height="160" rx="18" fill="#5B2C1F"/>
        <rect x="320" y="390" width="260" height="120" rx="18" fill="#7C3F2A"/>
        <rect x="360" y="300" width="180" height="110" rx="18" fill="#A85532"/>
        <path d="M450 250 c40 34 68 66 78 102" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      `;
    case "tea-basket":
      return `
        <rect x="220" y="480" width="460" height="180" rx="28" fill="#A16207"/>
        <path d="M290 470 c40 -120 280 -120 320 0" fill="none" stroke="#7C5E10" stroke-width="18"/>
        <rect x="320" y="360" width="120" height="120" rx="20" fill="#F8FAFC" stroke="${accent}" stroke-width="10"/>
        <circle cx="515" cy="405" r="58" fill="#DCFCE7" stroke="${accent}" stroke-width="12"/>
      `;
    case "cookie-tin":
      return `
        <rect x="240" y="290" width="420" height="330" rx="40" fill="#FDE68A" stroke="${accent}" stroke-width="16"/>
        <circle cx="350" cy="450" r="54" fill="#B45309"/>
        <circle cx="455" cy="390" r="54" fill="#B45309"/>
        <circle cx="560" cy="455" r="54" fill="#B45309"/>
        <circle cx="332" cy="430" r="8" fill="#78350F"/>
        <circle cx="473" cy="402" r="8" fill="#78350F"/>
        <circle cx="548" cy="470" r="8" fill="#78350F"/>
      `;
    case "pasta-crate":
      return `
        <rect x="230" y="450" width="440" height="210" rx="26" fill="#92400E"/>
        <rect x="285" y="340" width="80" height="190" rx="12" fill="#FCD34D"/>
        <rect x="405" y="350" width="95" height="170" rx="14" fill="#DC2626"/>
        <ellipse cx="565" cy="430" rx="72" ry="52" fill="#FEF3C7" stroke="${accent}" stroke-width="10"/>
      `;
    case "speaker":
      return `
        <rect x="235" y="320" width="430" height="260" rx="44" fill="${dark}"/>
        <circle cx="355" cy="450" r="78" fill="#1F2937" stroke="${accent}" stroke-width="12"/>
        <circle cx="355" cy="450" r="34" fill="${accent}"/>
        <circle cx="545" cy="450" r="62" fill="#1F2937" stroke="${accent}" stroke-width="12"/>
        <circle cx="545" cy="450" r="26" fill="${accent}"/>
      `;
    case "charger-set":
      return `
        <rect x="265" y="300" width="180" height="320" rx="34" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <rect x="315" y="360" width="80" height="140" rx="20" fill="${soft}"/>
        <rect x="500" y="390" width="150" height="120" rx="22" fill="#E5E7EB" stroke="${accent}" stroke-width="12"/>
        <path d="M450 430 C490 420 500 420 520 435" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
      `;
    case "lamp":
      return `
        <ellipse cx="450" cy="585" rx="145" ry="38" fill="#E5E7EB"/>
        <rect x="415" y="350" width="70" height="220" rx="30" fill="#D1D5DB"/>
        <rect x="330" y="240" width="240" height="170" rx="60" fill="${accent}" opacity="0.86"/>
        <circle cx="450" cy="325" r="120" fill="${soft}" opacity="0.55"/>
      `;
    case "travel-kit":
      return `
        <rect x="250" y="390" width="420" height="210" rx="30" fill="#111827"/>
        <rect x="305" y="330" width="110" height="180" rx="18" fill="#F8FAFC" stroke="${accent}" stroke-width="10"/>
        <path d="M490 360 v120" stroke="#F9FAFB" stroke-width="18" stroke-linecap="round"/>
        <path d="M560 360 v120" stroke="#F9FAFB" stroke-width="18" stroke-linecap="round"/>
      `;
    case "earbuds":
      return `
        <rect x="315" y="330" width="270" height="250" rx="90" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <path d="M395 350 v120 a52 52 0 0 0 52 52" fill="none" stroke="${dark}" stroke-width="18" stroke-linecap="round"/>
        <path d="M505 350 v120 a52 52 0 0 1 -52 52" fill="none" stroke="${dark}" stroke-width="18" stroke-linecap="round"/>
      `;
    case "webcam":
      return `
        <rect x="250" y="350" width="400" height="220" rx="44" fill="#111827"/>
        <circle cx="450" cy="460" r="84" fill="#1D4ED8" opacity="0.55"/>
        <circle cx="450" cy="460" r="48" fill="#EFF6FF"/>
        <rect x="370" y="570" width="160" height="28" rx="14" fill="#6B7280"/>
      `;
    case "lounge-set":
      return `
        <path d="M330 310 h120 l40 110 h-55 l-18 -56 h-34 l-18 56 h-55z" fill="${accent}"/>
        <path d="M510 310 h120 l35 290 h-72 l-18 -118 h-30 l-18 118 h-72z" fill="${accent}" opacity="0.82"/>
      `;
    case "polo":
      return `
        <path d="M300 310 l60 -40 h180 l60 40 -45 110 h-38 v190 h-134 v-190 h-38z" fill="${accent}" opacity="0.9"/>
        <path d="M420 270 l30 42 l30 -42" fill="none" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round"/>
      `;
    case "scarf":
      return `
        <path d="M370 250 q120 60 35 220 q-55 104 -35 190" fill="none" stroke="${accent}" stroke-width="54" stroke-linecap="round"/>
        <path d="M530 250 q-120 60 -35 220 q55 104 35 190" fill="none" stroke="#C084FC" stroke-width="54" stroke-linecap="round"/>
      `;
    case "hoodie":
      return `
        <path d="M320 330 q20 -90 130 -90 q110 0 130 90 l55 250 h-108 l-25 -145 h-44 v145 h-116 v-145 h-44 l-25 145 h-108z" fill="${accent}"/>
        <path d="M390 300 q60 48 120 0" fill="none" stroke="#F8FAFC" stroke-width="16" stroke-linecap="round"/>
      `;
    case "sleepwear":
      return `
        <path d="M310 300 h140 v140 h-140z" fill="${accent}" opacity="0.85"/>
        <path d="M450 300 h140 v260 h-140z" fill="#E9D5FF"/>
        <path d="M350 560 h90 v90 h-90z" fill="${accent}" opacity="0.7"/>
        <path d="M500 560 h90 v90 h-90z" fill="#C084FC"/>
      `;
    case "shirt":
      return `
        <path d="M300 300 l85 -50 h130 l85 50 -40 100 h-48 v210 h-124 v-210 h-48z" fill="${accent}" opacity="0.88"/>
        <path d="M438 250 l12 34 l12 -34" fill="none" stroke="#F8FAFC" stroke-width="12" stroke-linecap="round"/>
      `;
    case "cardholder":
      return `
        <rect x="270" y="330" width="360" height="260" rx="32" fill="#7C2D12"/>
        <path d="M320 400 h260" stroke="#F5D0A9" stroke-width="14" stroke-linecap="round"/>
        <path d="M320 470 h210" stroke="#F5D0A9" stroke-width="14" stroke-linecap="round"/>
      `;
    case "watch":
      return `
        <rect x="405" y="220" width="90" height="140" rx="28" fill="#374151"/>
        <rect x="405" y="540" width="90" height="140" rx="28" fill="#374151"/>
        <circle cx="450" cy="450" r="118" fill="#F8FAFC" stroke="${accent}" stroke-width="18"/>
        <path d="M450 450 l0 -56" stroke="${dark}" stroke-width="14" stroke-linecap="round"/>
        <path d="M450 450 l46 22" stroke="${dark}" stroke-width="14" stroke-linecap="round"/>
      `;
    case "fragrance":
      return `
        <rect x="330" y="280" width="240" height="300" rx="30" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <rect x="395" y="220" width="110" height="70" rx="18" fill="${accent}"/>
        <circle cx="450" cy="430" r="68" fill="${soft}" stroke="${accent}" stroke-width="10"/>
      `;
    case "jewelry-tray":
      return `
        <rect x="250" y="450" width="400" height="150" rx="34" fill="#FBCFE8" stroke="${accent}" stroke-width="12"/>
        <circle cx="365" cy="425" r="42" fill="#FDE68A"/>
        <circle cx="450" cy="390" r="32" fill="#E5E7EB"/>
        <circle cx="535" cy="428" r="40" fill="#DDD6FE"/>
      `;
    case "notebook":
      return `
        <rect x="260" y="280" width="230" height="360" rx="22" fill="${accent}" opacity="0.9"/>
        <rect x="502" y="330" width="44" height="250" rx="16" fill="#D1D5DB"/>
        <path d="M524 345 l-22 22" stroke="${dark}" stroke-width="10" stroke-linecap="round"/>
      `;
    case "vanity-case":
      return `
        <rect x="245" y="350" width="410" height="260" rx="42" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <path d="M355 350 q95 -90 190 0" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
        <circle cx="450" cy="478" r="70" fill="${soft}" opacity="0.8"/>
      `;
    case "candles":
      return `
        <rect x="320" y="350" width="90" height="220" rx="22" fill="#FDE68A"/>
        <rect x="470" y="310" width="110" height="260" rx="24" fill="#FBCFE8"/>
        <path d="M365 320 q18 -42 0 -64 q-18 22 0 64" fill="${accent}"/>
        <path d="M525 280 q18 -42 0 -64 q-18 22 0 64" fill="${accent}"/>
      `;
    case "mug":
      return `
        <rect x="295" y="350" width="250" height="190" rx="34" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <path d="M545 400 h54 a42 42 0 0 1 0 84 h-54" fill="none" stroke="${accent}" stroke-width="14"/>
        <rect x="340" y="560" width="160" height="34" rx="17" fill="#B45309"/>
      `;
    case "blanket":
      return `
        <path d="M260 340 h360 v250 q-58 52 -132 52 q-74 0 -132 -52 q-58 -52 -96 -120z" fill="${accent}" opacity="0.22" stroke="${accent}" stroke-width="12"/>
        <path d="M310 390 h260" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
        <path d="M310 450 h260" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
        <path d="M310 510 h220" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
      `;
    case "organizer":
      return `
        <rect x="250" y="330" width="420" height="280" rx="34" fill="#F8FAFC" stroke="${accent}" stroke-width="14"/>
        <rect x="290" y="380" width="120" height="170" rx="18" fill="${soft}"/>
        <rect x="430" y="380" width="80" height="170" rx="18" fill="#E5E7EB"/>
        <rect x="530" y="380" width="100" height="88" rx="18" fill="${soft}"/>
        <rect x="530" y="482" width="100" height="68" rx="18" fill="#D1FAE5"/>
      `;
    case "bath-box":
      return `
        <rect x="240" y="420" width="420" height="220" rx="28" fill="#FBCFE8"/>
        <ellipse cx="365" cy="385" rx="82" ry="52" fill="#F8FAFC" stroke="${accent}" stroke-width="10"/>
        <rect x="490" y="330" width="90" height="170" rx="22" fill="#F8FAFC" stroke="${accent}" stroke-width="10"/>
      `;
    case "tray":
      return `
        <rect x="220" y="420" width="460" height="180" rx="28" fill="#C08457"/>
        <rect x="280" y="380" width="120" height="70" rx="18" fill="#F8FAFC"/>
        <rect x="435" y="365" width="70" height="100" rx="16" fill="#FED7AA"/>
        <rect x="530" y="375" width="100" height="80" rx="18" fill="#FEF3C7"/>
      `;
    case "bouquet":
      return `
        <circle cx="340" cy="360" r="72" fill="#F9A8D4"/>
        <circle cx="450" cy="300" r="72" fill="#F43F5E"/>
        <circle cx="560" cy="360" r="72" fill="#FB7185"/>
        <path d="M395 410 l55 185 l55 -185" fill="#E5E7EB" stroke="${accent}" stroke-width="12"/>
      `;
    case "tulip-basket":
      return `
        <rect x="260" y="500" width="380" height="130" rx="26" fill="#A16207"/>
        <path d="M330 500 q30 -150 120 -150 q90 0 120 150" fill="none" stroke="#7C5E10" stroke-width="18"/>
        <ellipse cx="350" cy="390" rx="44" ry="68" fill="#F9A8D4"/>
        <ellipse cx="450" cy="350" rx="44" ry="68" fill="#C4B5FD"/>
        <ellipse cx="550" cy="390" rx="44" ry="68" fill="#FDA4AF"/>
      `;
    case "plant":
      return `
        <path d="M350 520 h200 l-30 120 h-140z" fill="#9A3412"/>
        <path d="M450 520 v-170" stroke="#166534" stroke-width="16" stroke-linecap="round"/>
        <path d="M450 380 q-80 -80 -135 -20 q75 12 135 20" fill="#22C55E"/>
        <path d="M450 360 q80 -80 135 -20 q-75 12 -135 20" fill="#16A34A"/>
      `;
    case "hatbox":
      return `
        <ellipse cx="450" cy="320" rx="165" ry="62" fill="#BE185D"/>
        <rect x="285" y="320" width="330" height="270" rx="34" fill="#FDF2F8" stroke="${accent}" stroke-width="14"/>
        <circle cx="360" cy="350" r="58" fill="#FB7185"/>
        <circle cx="450" cy="315" r="58" fill="#F43F5E"/>
        <circle cx="540" cy="350" r="58" fill="#EC4899"/>
      `;
    case "daisy":
      return `
        <circle cx="450" cy="420" r="42" fill="#FACC15"/>
        <g fill="#FFFFFF">
          <ellipse cx="450" cy="325" rx="34" ry="72"/>
          <ellipse cx="450" cy="515" rx="34" ry="72"/>
          <ellipse cx="355" cy="420" rx="72" ry="34"/>
          <ellipse cx="545" cy="420" rx="72" ry="34"/>
          <ellipse transform="rotate(45 382 352)" cx="382" cy="352" rx="32" ry="68"/>
          <ellipse transform="rotate(-45 518 352)" cx="518" cy="352" rx="32" ry="68"/>
          <ellipse transform="rotate(-45 382 488)" cx="382" cy="488" rx="32" ry="68"/>
          <ellipse transform="rotate(45 518 488)" cx="518" cy="488" rx="32" ry="68"/>
        </g>
      `;
    case "orchid":
      return `
        <path d="M360 560 h180 l-22 82 h-136z" fill="#9A3412"/>
        <path d="M450 560 v-210" stroke="#166534" stroke-width="14" stroke-linecap="round"/>
        <circle cx="450" cy="330" r="40" fill="#FFFFFF" stroke="${accent}" stroke-width="10"/>
        <circle cx="388" cy="395" r="34" fill="#FFFFFF" stroke="${accent}" stroke-width="10"/>
        <circle cx="512" cy="395" r="34" fill="#FFFFFF" stroke="${accent}" stroke-width="10"/>
      `;
    default:
      return `
        <rect x="260" y="280" width="380" height="340" rx="34" fill="${soft}" stroke="${accent}" stroke-width="14"/>
        <circle cx="450" cy="430" r="90" fill="white" stroke="${accent}" stroke-width="12"/>
      `;
  }
}

function getIllustrationKind(name: string, category: DemoCategory): string {
  const key = name.toLowerCase();
  if (key.includes("hamper")) return "hamper";
  if (key.includes("coffee") || key.includes("pastry")) return "coffee-box";
  if (key.includes("chocolate tower")) return "chocolate-tower";
  if (key.includes("tea ritual")) return "tea-basket";
  if (key.includes("cookie")) return "cookie-tin";
  if (key.includes("pasta")) return "pasta-crate";
  if (key.includes("speaker")) return "speaker";
  if (key.includes("charging")) return "charger-set";
  if (key.includes("lamp")) return "lamp";
  if (key.includes("travel power")) return "travel-kit";
  if (key.includes("earbuds")) return "earbuds";
  if (key.includes("webcam")) return "webcam";
  if (key.includes("lounge")) return "lounge-set";
  if (key.includes("polo")) return "polo";
  if (key.includes("scarf")) return "scarf";
  if (key.includes("hoodie")) return "hoodie";
  if (key.includes("sleepwear")) return "sleepwear";
  if (key.includes("shirt")) return "shirt";
  if (key.includes("cardholder")) return "cardholder";
  if (key.includes("timepiece")) return "watch";
  if (key.includes("fragrance")) return "fragrance";
  if (key.includes("jewelry")) return "jewelry-tray";
  if (key.includes("notebook") || key.includes("pen")) return "notebook";
  if (key.includes("vanity")) return "vanity-case";
  if (key.includes("candle")) return "candles";
  if (key.includes("mug")) return "mug";
  if (key.includes("blanket")) return "blanket";
  if (key.includes("organizer")) return "organizer";
  if (key.includes("bath")) return "bath-box";
  if (key.includes("tray")) return "tray";
  if (key.includes("bouquet")) return "bouquet";
  if (key.includes("tulip")) return "tulip-basket";
  if (key.includes("plant")) return "plant";
  if (key.includes("floral box")) return "hatbox";
  if (key.includes("daisy")) return "daisy";
  if (key.includes("orchid")) return "orchid";
  if (category === "Flowers") return "bouquet";
  if (category === "Food") return "hamper";
  if (category === "Electronics") return "speaker";
  if (category === "Clothes") return "shirt";
  if (category === "Accessories") return "watch";
  return "tray";
}

function buildProductPhoto(name: string, category: DemoCategory, store: string): string {
  const style = CATEGORY_STYLES[category];
  const kind = getIllustrationKind(name, category);
  const illustration = renderProductIllustration(kind, style.accent, style.background);
  const lines = name.length > 26
    ? [name.slice(0, Math.ceil(name.length / 2)).trim(), name.slice(Math.ceil(name.length / 2)).trim()]
    : [name];
  const titleOne = escapeXml(lines[0] ?? name);
  const titleTwo = lines[1] ? escapeXml(lines[1]) : "";
  const storeLabel = escapeXml(store);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="photoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="${style.background}" />
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="72" fill="url(#photoBg)"/>
      <rect x="36" y="36" width="828" height="828" rx="52" fill="white" stroke="${style.accent}" stroke-width="10"/>
      <rect x="72" y="74" width="756" height="520" rx="40" fill="${style.background}"/>
      ${illustration}
      <rect x="72" y="628" width="756" height="174" rx="34" fill="#FFFFFF"/>
      <text x="100" y="684" font-size="24" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="700">${category.toUpperCase()}</text>
      <text x="100" y="734" font-size="48" font-family="Arial, sans-serif" fill="#111827" font-weight="800">${titleOne}</text>
      ${titleTwo ? `<text x="100" y="782" font-size="42" font-family="Arial, sans-serif" fill="#111827" font-weight="800">${titleTwo}</text>` : ""}
      <text x="100" y="820" font-size="26" font-family="Arial, sans-serif" fill="#6B7280">${storeLabel}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildStoreLogo(store: string, category: DemoCategory): string {
  const style = CATEGORY_STYLES[category];
  const initials = store
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="${style.background}"/>
      <rect x="10" y="10" width="140" height="140" rx="30" fill="white" stroke="${style.accent}" stroke-width="8"/>
      <circle cx="80" cy="62" r="26" fill="${style.accent}" opacity="0.16"/>
      <text x="80" y="71" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="800">${style.mark}</text>
      <text x="80" y="118" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" fill="${style.accent}" font-weight="800">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createProduct(
  id: number,
  name: string,
  category: DemoCategory,
  store: string,
  location: string,
  storeLat: number,
  storeLng: number,
  price: number,
  stock: number,
  occasions: string[],
  recipients: string[],
  tags: string[],
  description: string,
  popularity: number,
): DemoCatalogProduct {
  return {
    id,
    name,
    category,
    store,
    location,
    storeLat,
    storeLng,
    storeLogo: buildStoreLogo(store, category),
    price,
    stock,
    occasions,
    recipients,
    tags,
    description,
    local: true,
    popularity,
    image: buildProductAssetPath(name, category),
    fallbackImage: buildDemoImage(name, category, store),
  };
}

const PAG_ASA: [number, number] = [14.8270696, 120.2871287];
const EAST_BAJAC: [number, number] = [14.8398833, 120.2881868];
const WEST_BAJAC: [number, number] = [14.8425966, 120.2850312];
const KALAKLAN: [number, number] = [14.8305842, 120.2738389];
const NEW_CABALAN: [number, number] = [14.8493706, 120.3258216];
const ASINAN: [number, number] = [14.8279187, 120.2852927];

export const DEMO_CATALOG: DemoCatalogProduct[] = [
  createProduct(740000101, "Gourmet Snack Hamper", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 1590, 18, ["Birthday", "Thank You", "Christmas"], ["Parent", "Client", "Boss", "Teacher"], ["hamper", "snacks", "premium", "sharing"], "A curated hamper of imported crackers, truffle chips, and artisan chocolates.", 95),
  createProduct(740000102, "Coffee & Pastry Morning Box", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 980, 22, ["Thank You", "Get Well", "Birthday"], ["Friend", "Teacher", "Parent", "Colleague"], ["coffee", "pastry", "comfort", "morning"], "A premium breakfast-style gift with small-batch coffee and butter pastries.", 88),
  createProduct(740000103, "Celebration Chocolate Tower", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 1890, 13, ["Anniversary", "Birthday", "Graduation"], ["Partner", "Sibling", "Friend"], ["chocolate", "sweet", "luxury", "celebration"], "Layered chocolate treats wrapped as a premium centerpiece gift for milestone occasions.", 90),
  createProduct(740000104, "Tea Ritual Gift Basket", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 1320, 17, ["Get Well", "Thank You", "Christmas"], ["Parent", "Teacher", "Client"], ["tea", "wellness", "basket", "calm"], "Loose-leaf tea, honey sticks, and delicate biscuits for a calming premium gift.", 82),
  createProduct(740000105, "Artisan Cookie Celebration Tin", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 760, 26, ["Birthday", "Thank You", "Christmas"], ["Friend", "Teacher", "Colleague"], ["cookies", "sweet", "party", "shareable"], "A festive tin of artisan cookies packed for easy gifting and office celebrations.", 81),
  createProduct(740000106, "Premium Pasta Night Crate", "Food", "Velvet Table Olongapo", "Pag-asa | Local store", PAG_ASA[0], PAG_ASA[1], 1450, 15, ["Anniversary", "Housewarming", "Thank You"], ["Partner", "Parent", "Client"], ["pasta", "dinner", "gourmet", "crate"], "A gourmet dinner crate with premium pasta, sauce, olive oil, and a handwritten menu card.", 84),

  createProduct(740000001, "Compact Bluetooth Speaker Gift Box", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 2190, 14, ["Birthday", "Anniversary", "Graduation"], ["Friend", "Partner", "Sibling", "Colleague"], ["tech", "audio", "portable", "gift-ready"], "A premium portable speaker packed in a ribbon-ready gift box for birthdays and house parties.", 94),
  createProduct(740000002, "Wireless Charging Desk Set", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 1850, 11, ["Promotion", "Thank You", "Graduation"], ["Boss", "Teacher", "Client", "Colleague"], ["workspace", "charging", "productivity", "modern"], "A minimalist charging stand and desk organizer set for professionals who love a clean setup.", 89),
  createProduct(740000003, "Smart Home Mood Lamp", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 2490, 9, ["Birthday", "Christmas", "Housewarming"], ["Partner", "Friend", "Sibling"], ["smart", "lighting", "decor", "home"], "An app-controlled ambient lamp that makes a standout premium gift for bedrooms and workspaces.", 92),
  createProduct(740000004, "Travel Power Essentials Kit", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 1690, 16, ["Graduation", "Thank You", "Promotion"], ["Friend", "Client", "Colleague", "Boss"], ["travel", "charger", "practical", "daily-use"], "A premium travel tech set with fast charger, braided cable, and compact pouch.", 84),
  createProduct(740000005, "Noise-Cancel Earbuds Gift Case", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 2590, 13, ["Birthday", "Graduation", "Promotion"], ["Friend", "Partner", "Colleague"], ["audio", "earbuds", "modern", "travel"], "A premium pair of wireless earbuds presented in a travel-ready gift case.", 91),
  createProduct(740000006, "Creator Webcam Lighting Kit", "Electronics", "Harbor Tech Studio", "East Bajac-Bajac | Local store", EAST_BAJAC[0], EAST_BAJAC[1], 2050, 12, ["Promotion", "Graduation", "Thank You"], ["Teacher", "Boss", "Client", "Colleague"], ["camera", "lighting", "workspace", "creator"], "A polished webcam and mini light kit ideal for remote work and creator desks.", 86),

  createProduct(740000201, "Soft Knit Lounge Set", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 1750, 12, ["Birthday", "Christmas", "Get Well"], ["Partner", "Sibling", "Friend"], ["comfort", "fashion", "soft", "giftable"], "A polished two-piece lounge set that feels personal, premium, and easy to gift.", 86),
  createProduct(740000202, "Classic Polo Gift Set", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 1490, 20, ["Birthday", "Promotion", "Christmas"], ["Parent", "Boss", "Client", "Colleague"], ["polo", "classic", "smart-casual", "boxed"], "A folded premium polo shirt with presentation box, ideal for dads and professionals.", 90),
  createProduct(740000203, "Coastal Linen Scarf Collection", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 920, 19, ["Anniversary", "Christmas", "Thank You"], ["Partner", "Teacher", "Client"], ["linen", "scarf", "fashion", "lightweight"], "A tasteful scarf set with neutral colors for recipients who love subtle luxury.", 78),
  createProduct(740000204, "Weekend Hoodie Premium Pack", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 1990, 10, ["Birthday", "Graduation", "Christmas"], ["Friend", "Sibling", "Partner"], ["hoodie", "casual", "cozy", "streetwear"], "A premium hoodie folded with scented tissue and branded gift wrap.", 85),
  createProduct(740000205, "Silk Sleepwear Gift Pouch", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 2140, 9, ["Anniversary", "Birthday", "Christmas"], ["Partner", "Sibling", "Friend"], ["sleepwear", "silk", "soft", "luxury"], "A satin-soft sleepwear set wrapped in a premium pouch for intimate gifting moments.", 88),
  createProduct(740000206, "Smart Casual Weekend Shirt Box", "Clothes", "Sable & Silk", "West Bajac-Bajac | Local store", WEST_BAJAC[0], WEST_BAJAC[1], 1380, 17, ["Birthday", "Promotion", "Thank You"], ["Parent", "Boss", "Client", "Friend"], ["shirt", "casual", "boxed", "versatile"], "A crisp smart-casual shirt boxed with tissue wrap for polished, practical gifting.", 83),

  createProduct(740000301, "Leather Cardholder Gift Box", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 1280, 21, ["Promotion", "Thank You", "Birthday"], ["Boss", "Client", "Colleague", "Sibling"], ["leather", "wallet", "professional", "minimal"], "A sleek leather cardholder designed for minimalist everyday carry and professional gifting.", 90),
  createProduct(740000302, "Signature Timepiece Set", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 2890, 8, ["Anniversary", "Graduation", "Promotion"], ["Partner", "Boss", "Client"], ["watch", "elegant", "milestone", "luxury"], "A dress watch paired with a gift box and note card for milestone occasions.", 93),
  createProduct(740000303, "Mini Fragrance Discovery Kit", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 1420, 15, ["Birthday", "Christmas", "Anniversary"], ["Partner", "Friend", "Sibling"], ["perfume", "beauty", "signature", "gift-set"], "A set of refined mini fragrances that feels special without being overly expensive.", 84),
  createProduct(740000304, "Pearl Accent Jewelry Tray Set", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 1160, 12, ["Birthday", "Thank You", "Christmas"], ["Teacher", "Parent", "Partner"], ["jewelry", "tray", "elegant", "decor"], "A premium tray with delicate accessories for recipients who love polished presentation.", 77),
  createProduct(740000305, "Monogram Pen & Notebook Duo", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 980, 18, ["Promotion", "Graduation", "Thank You"], ["Boss", "Teacher", "Colleague", "Client"], ["pen", "notebook", "office", "classic"], "A refined pen and notebook pairing for milestone gifting and professional thank-yous.", 80),
  createProduct(740000306, "Travel Vanity Case Set", "Accessories", "Keepsake Row", "Kalaklan | Local store", KALAKLAN[0], KALAKLAN[1], 1560, 14, ["Birthday", "Christmas", "Get Well"], ["Partner", "Friend", "Sibling"], ["travel", "beauty", "case", "premium"], "A structured vanity case with mirrors and organizers for stylish everyday gifting.", 82),

  createProduct(740000401, "Scented Candle Pairing Set", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 1100, 18, ["Housewarming", "Anniversary", "Christmas"], ["Partner", "Friend", "Parent"], ["candle", "home", "relaxing", "decor"], "A pair of layered candles in a keepsake box for cozy evening gifting.", 89),
  createProduct(740000402, "Ceramic Mug & Cocoa Ritual Set", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 890, 24, ["Thank You", "Christmas", "Get Well"], ["Teacher", "Friend", "Parent", "Colleague"], ["mug", "cocoa", "comfort", "cozy"], "A hand-finished mug with premium cocoa and marshmallows for warm gifting.", 87),
  createProduct(740000403, "Textured Throw Blanket Box", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 1780, 9, ["Christmas", "Get Well", "Birthday"], ["Parent", "Partner", "Sibling"], ["blanket", "comfort", "home", "soft"], "A premium home blanket packed as a soft, generous gift for loved ones.", 91),
  createProduct(740000404, "Desk Calm Organizer Bundle", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 1340, 14, ["Promotion", "Graduation", "Thank You"], ["Colleague", "Boss", "Teacher", "Client"], ["organizer", "desk", "workspace", "practical"], "A refined organizer bundle for study spaces, home offices, and thoughtful work gifts.", 80),
  createProduct(740000405, "Relaxation Bath Ritual Box", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 1540, 11, ["Get Well", "Birthday", "Anniversary"], ["Partner", "Friend", "Parent"], ["bath", "spa", "calm", "self-care"], "A self-care gift box with bath soak, linen spray, and a calming candle for restful evenings.", 87),
  createProduct(740000406, "Cozy Breakfast Tray Set", "Home", "Hearth & Hue", "New Cabalan | Local store", NEW_CABALAN[0], NEW_CABALAN[1], 1240, 16, ["Housewarming", "Thank You", "Christmas"], ["Parent", "Teacher", "Client", "Partner"], ["tray", "home", "cozy", "hosting"], "A wood breakfast tray paired with linen napkins for elegant home gifting.", 79),

  createProduct(740000501, "Classic Rose Celebration Bouquet", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 1490, 15, ["Anniversary", "Birthday", "Graduation"], ["Partner", "Parent", "Friend"], ["flowers", "rose", "bouquet", "celebration"], "A polished rose bouquet designed for birthdays, anniversaries, and meaningful surprises.", 95),
  createProduct(740000502, "Soft Pastel Tulip Basket", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 1320, 11, ["Thank You", "Get Well", "Birthday"], ["Teacher", "Parent", "Client"], ["tulip", "basket", "pastel", "wellness"], "A pastel floral basket for elegant thank-you and wellness gifting.", 83),
  createProduct(740000503, "Evergreen Plant & Note Card Set", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 980, 20, ["Housewarming", "Thank You", "Promotion"], ["Boss", "Client", "Friend", "Parent"], ["plant", "green", "lasting", "decor"], "A living plant gift with note card and premium wrap for long-lasting impact.", 79),
  createProduct(740000504, "Signature Mixed Floral Box", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 2190, 8, ["Anniversary", "Birthday", "Christmas"], ["Partner", "Parent", "Friend"], ["hatbox", "floral", "premium", "luxury"], "A premium hatbox arrangement for recipients who love dramatic floral presentation.", 90),
  createProduct(740000505, "Sunrise Daisy Comfort Bundle", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 890, 19, ["Get Well", "Thank You", "Birthday"], ["Friend", "Teacher", "Parent"], ["daisy", "comfort", "bright", "fresh"], "A bright daisy bouquet paired with a comfort note card for light and cheerful gifting.", 78),
  createProduct(740000506, "White Orchid Executive Pot", "Flowers", "Bloom Theory", "Asinan | Local store", ASINAN[0], ASINAN[1], 1680, 10, ["Promotion", "Housewarming", "Thank You"], ["Boss", "Client", "Parent"], ["orchid", "executive", "plant", "elegant"], "A white orchid arrangement in a premium ceramic pot for formal and elegant gifting.", 85),
];

export const DEMO_CATEGORY_ORDER: DemoCategory[] = [
  "Food",
  "Flowers",
  "Accessories",
  "Home",
  "Electronics",
  "Clothes",
];

export function isLocalDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
}

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function filterDemoCatalog(input: DemoSearchInput): DemoCatalogProduct[] {
  const occasion = normalize(input.occasion);
  const recipient = normalize(input.recipient);
  const giftType = normalize(input.giftType);
  const search = normalize(input.search);
  const budget = input.budget ?? null;

  const filtered = DEMO_CATALOG.filter((item) => {
    if (giftType && giftType !== "any" && normalize(item.category) !== giftType) return false;
    if (search) {
      const haystack = [item.name, item.store, item.category, item.description, ...item.tags].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const scored = filtered.map((item) => {
    let score = item.popularity;
    if (occasion && item.occasions.map(normalize).includes(occasion)) score += 28;
    if (recipient && item.recipients.map(normalize).includes(recipient)) score += 26;
    if (giftType && giftType !== "any" && normalize(item.category) === giftType) score += 24;
    if (budget) {
      const distance = Math.abs(item.price - budget);
      if (item.price <= budget) score += 18;
      score -= Math.min(distance / 120, 18);
    }
    if (item.local) score += 6;
    return { item, score };
  });

  return scored.sort((left, right) => right.score - left.score).map((entry) => entry.item);
}

export function toDemoProduct(item: DemoCatalogProduct, index = 0): Product {
  return {
    id: item.id,
    name: item.name,
    store: item.store,
    location: item.location,
    storeLat: item.storeLat,
    storeLng: item.storeLng,
    storeLogo: item.storeLogo,
    price: item.price,
    match: Math.max(72, Math.min(98, Math.round(item.popularity))),
    badge: index === 0 ? "#1 Pick" : undefined,
    image: item.image,
    fallbackImage: item.fallbackImage,
    tags: item.tags.slice(0, 2),
    category: item.category,
    stock: item.stock,
    explanation: `Curated for ${item.category.toLowerCase()} gifting`,
    description: item.description,
  };
}
