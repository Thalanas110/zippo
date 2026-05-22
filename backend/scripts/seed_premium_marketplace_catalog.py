from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import create_client


STORE_OWNERS_BASE = 720_000_000
STORES_BASE = 730_000_000
PRODUCTS_BASE = 740_000_000

DELIVERY_ZONES = [
    "East Bajac-Bajac",
    "West Bajac-Bajac",
    "Pag-asa",
    "Kalaklan",
    "New Cabalan",
    "Old Cabalan",
    "Asinan",
]

CATEGORY_STYLES = {
    "electronics": {"accent": "#2563EB", "background": "#EFF6FF", "emoji": "💻"},
    "food": {"accent": "#EA580C", "background": "#FFF7ED", "emoji": "🍪"},
    "clothes": {"accent": "#7C3AED", "background": "#F5F3FF", "emoji": "🧥"},
    "accessories": {"accent": "#DB2777", "background": "#FDF2F8", "emoji": "⌚"},
    "home": {"accent": "#0F766E", "background": "#F0FDFA", "emoji": "🕯️"},
    "flowers": {"accent": "#BE185D", "background": "#FDF2F8", "emoji": "🌷"},
}

PREMIUM_CATALOG = [
    {
        "store_name": "Harbor Tech Studio",
        "description": "Premium gadgets and desk tech curated for thoughtful gifting.",
        "barangay": "East Bajac-Bajac",
        "lat": 14.8324,
        "lng": 120.2841,
        "products": [
            {
                "name": "Compact Bluetooth Speaker Gift Box",
                "description": "A premium portable speaker packed in a ribbon-ready gift box for birthdays and house parties.",
                "category": "electronics",
                "price": 2190.00,
                "stock": 14,
                "occasion_tags": ["Birthday", "Anniversary", "Graduation"],
                "recipient_tags": ["Friend", "Partner", "Sibling", "Colleague"],
                "tags": ["tech", "audio", "portable", "gift-ready"],
                "avg_rating": 4.8,
                "popularity_score": 0.94,
            },
            {
                "name": "Wireless Charging Desk Set",
                "description": "A minimalist charging stand and desk organizer set for professionals who love a clean setup.",
                "category": "electronics",
                "price": 1850.00,
                "stock": 11,
                "occasion_tags": ["Promotion", "Thank You", "Graduation"],
                "recipient_tags": ["Boss", "Teacher", "Client", "Colleague"],
                "tags": ["workspace", "charging", "productivity", "modern"],
                "avg_rating": 4.7,
                "popularity_score": 0.89,
            },
            {
                "name": "Smart Home Mood Lamp",
                "description": "An app-controlled ambient lamp that makes a standout premium gift for bedrooms and workspaces.",
                "category": "electronics",
                "price": 2490.00,
                "stock": 9,
                "occasion_tags": ["Birthday", "Christmas", "Housewarming"],
                "recipient_tags": ["Partner", "Friend", "Sibling"],
                "tags": ["smart", "lighting", "home", "decor"],
                "avg_rating": 4.9,
                "popularity_score": 0.92,
            },
            {
                "name": "Travel Power Essentials Kit",
                "description": "A premium travel tech set with fast charger, braided cable, and compact pouch.",
                "category": "electronics",
                "price": 1690.00,
                "stock": 16,
                "occasion_tags": ["Graduation", "Thank You", "Promotion"],
                "recipient_tags": ["Friend", "Client", "Colleague", "Boss"],
                "tags": ["travel", "charger", "practical", "daily-use"],
                "avg_rating": 4.6,
                "popularity_score": 0.84,
            },
        ],
    },
    {
        "store_name": "Velvet Table Olongapo",
        "description": "Artisanal gourmet hampers, sweets, and curated edible gifts.",
        "barangay": "Pag-asa",
        "lat": 14.8388,
        "lng": 120.2833,
        "products": [
            {
                "name": "Gourmet Snack Hamper",
                "description": "A curated hamper of imported crackers, truffle chips, and artisan chocolates.",
                "category": "food",
                "price": 1590.00,
                "stock": 18,
                "occasion_tags": ["Birthday", "Thank You", "Christmas"],
                "recipient_tags": ["Parent", "Client", "Boss", "Teacher"],
                "tags": ["hamper", "snacks", "premium", "sharing"],
                "avg_rating": 4.9,
                "popularity_score": 0.95,
            },
            {
                "name": "Coffee & Pastry Morning Box",
                "description": "A premium breakfast-style gift with small-batch coffee and butter pastries.",
                "category": "food",
                "price": 980.00,
                "stock": 22,
                "occasion_tags": ["Thank You", "Get Well", "Birthday"],
                "recipient_tags": ["Friend", "Teacher", "Parent", "Colleague"],
                "tags": ["coffee", "pastry", "morning", "comfort"],
                "avg_rating": 4.7,
                "popularity_score": 0.88,
            },
            {
                "name": "Celebration Chocolate Tower",
                "description": "Layered chocolate treats wrapped as a premium centerpiece gift for milestone occasions.",
                "category": "food",
                "price": 1890.00,
                "stock": 13,
                "occasion_tags": ["Anniversary", "Birthday", "Graduation"],
                "recipient_tags": ["Partner", "Sibling", "Friend"],
                "tags": ["chocolate", "celebration", "sweet", "luxury"],
                "avg_rating": 4.8,
                "popularity_score": 0.9,
            },
            {
                "name": "Tea Ritual Gift Basket",
                "description": "Loose-leaf tea, honey sticks, and delicate biscuits for a calming premium gift.",
                "category": "food",
                "price": 1320.00,
                "stock": 17,
                "occasion_tags": ["Get Well", "Thank You", "Christmas"],
                "recipient_tags": ["Parent", "Teacher", "Client"],
                "tags": ["tea", "wellness", "basket", "calm"],
                "avg_rating": 4.6,
                "popularity_score": 0.82,
            },
        ],
    },
    {
        "store_name": "Sable & Silk",
        "description": "Refined fashion gifts and occasion-ready wardrobe pieces.",
        "barangay": "West Bajac-Bajac",
        "lat": 14.8335,
        "lng": 120.2818,
        "products": [
            {
                "name": "Soft Knit Lounge Set",
                "description": "A polished two-piece lounge set that feels personal, premium, and easy to gift.",
                "category": "clothes",
                "price": 1750.00,
                "stock": 12,
                "occasion_tags": ["Birthday", "Christmas", "Get Well"],
                "recipient_tags": ["Partner", "Sibling", "Friend"],
                "tags": ["comfort", "fashion", "soft", "giftable"],
                "avg_rating": 4.7,
                "popularity_score": 0.86,
            },
            {
                "name": "Classic Polo Gift Set",
                "description": "A folded premium polo shirt with presentation box, ideal for dads and professionals.",
                "category": "clothes",
                "price": 1490.00,
                "stock": 20,
                "occasion_tags": ["Birthday", "Father's Day", "Promotion"],
                "recipient_tags": ["Parent", "Boss", "Client", "Colleague"],
                "tags": ["polo", "classic", "smart-casual", "boxed"],
                "avg_rating": 4.8,
                "popularity_score": 0.9,
            },
            {
                "name": "Coastal Linen Scarf Collection",
                "description": "A tasteful scarf set with neutral colors for recipients who love subtle luxury.",
                "category": "clothes",
                "price": 920.00,
                "stock": 19,
                "occasion_tags": ["Anniversary", "Christmas", "Thank You"],
                "recipient_tags": ["Partner", "Teacher", "Client"],
                "tags": ["linen", "scarf", "fashion", "lightweight"],
                "avg_rating": 4.5,
                "popularity_score": 0.78,
            },
            {
                "name": "Weekend Hoodie Premium Pack",
                "description": "A premium hoodie folded with scented tissue and branded gift wrap.",
                "category": "clothes",
                "price": 1990.00,
                "stock": 10,
                "occasion_tags": ["Birthday", "Graduation", "Christmas"],
                "recipient_tags": ["Friend", "Sibling", "Partner"],
                "tags": ["hoodie", "casual", "cozy", "streetwear"],
                "avg_rating": 4.7,
                "popularity_score": 0.85,
            },
        ],
    },
    {
        "store_name": "Keepsake Row",
        "description": "Premium personal accessories and elegant keepsakes for meaningful gifting.",
        "barangay": "Kalaklan",
        "lat": 14.8206,
        "lng": 120.2867,
        "products": [
            {
                "name": "Leather Cardholder Gift Box",
                "description": "A sleek leather cardholder designed for minimalist everyday carry and professional gifting.",
                "category": "accessories",
                "price": 1280.00,
                "stock": 21,
                "occasion_tags": ["Promotion", "Thank You", "Birthday"],
                "recipient_tags": ["Boss", "Client", "Colleague", "Sibling"],
                "tags": ["leather", "wallet", "professional", "minimal"],
                "avg_rating": 4.8,
                "popularity_score": 0.9,
            },
            {
                "name": "Signature Timepiece Set",
                "description": "A dress watch paired with a gift box and note card for milestone occasions.",
                "category": "accessories",
                "price": 2890.00,
                "stock": 8,
                "occasion_tags": ["Anniversary", "Graduation", "Promotion"],
                "recipient_tags": ["Partner", "Boss", "Client"],
                "tags": ["watch", "elegant", "milestone", "luxury"],
                "avg_rating": 4.9,
                "popularity_score": 0.93,
            },
            {
                "name": "Mini Fragrance Discovery Kit",
                "description": "A set of refined mini fragrances that feels special without being overly expensive.",
                "category": "accessories",
                "price": 1420.00,
                "stock": 15,
                "occasion_tags": ["Birthday", "Christmas", "Anniversary"],
                "recipient_tags": ["Partner", "Friend", "Sibling"],
                "tags": ["perfume", "beauty", "signature", "gift-set"],
                "avg_rating": 4.6,
                "popularity_score": 0.84,
            },
            {
                "name": "Pearl Accent Jewelry Tray Set",
                "description": "A premium tray with delicate accessories for recipients who love polished presentation.",
                "category": "accessories",
                "price": 1160.00,
                "stock": 12,
                "occasion_tags": ["Birthday", "Thank You", "Christmas"],
                "recipient_tags": ["Teacher", "Parent", "Partner"],
                "tags": ["jewelry", "tray", "elegant", "decor"],
                "avg_rating": 4.5,
                "popularity_score": 0.77,
            },
        ],
    },
    {
        "store_name": "Hearth & Hue",
        "description": "Home comforts and tasteful decor pieces for premium gifting moments.",
        "barangay": "New Cabalan",
        "lat": 14.8472,
        "lng": 120.2944,
        "products": [
            {
                "name": "Scented Candle Pairing Set",
                "description": "A pair of layered candles in a keepsake box for cozy evening gifting.",
                "category": "home",
                "price": 1100.00,
                "stock": 18,
                "occasion_tags": ["Housewarming", "Anniversary", "Christmas"],
                "recipient_tags": ["Partner", "Friend", "Parent"],
                "tags": ["candle", "home", "relaxing", "decor"],
                "avg_rating": 4.8,
                "popularity_score": 0.89,
            },
            {
                "name": "Ceramic Mug & Cocoa Ritual Set",
                "description": "A hand-finished mug with premium cocoa and marshmallows for warm gifting.",
                "category": "home",
                "price": 890.00,
                "stock": 24,
                "occasion_tags": ["Thank You", "Christmas", "Get Well"],
                "recipient_tags": ["Teacher", "Friend", "Parent", "Colleague"],
                "tags": ["mug", "cocoa", "comfort", "cozy"],
                "avg_rating": 4.7,
                "popularity_score": 0.87,
            },
            {
                "name": "Textured Throw Blanket Box",
                "description": "A premium home blanket packed as a soft, generous gift for loved ones.",
                "category": "home",
                "price": 1780.00,
                "stock": 9,
                "occasion_tags": ["Christmas", "Get Well", "Birthday"],
                "recipient_tags": ["Parent", "Partner", "Sibling"],
                "tags": ["blanket", "comfort", "home", "soft"],
                "avg_rating": 4.9,
                "popularity_score": 0.91,
            },
            {
                "name": "Desk Calm Organizer Bundle",
                "description": "A refined organizer bundle for study spaces, home offices, and thoughtful work gifts.",
                "category": "home",
                "price": 1340.00,
                "stock": 14,
                "occasion_tags": ["Promotion", "Graduation", "Thank You"],
                "recipient_tags": ["Colleague", "Boss", "Teacher", "Client"],
                "tags": ["organizer", "desk", "workspace", "practical"],
                "avg_rating": 4.6,
                "popularity_score": 0.8,
            },
        ],
    },
    {
        "store_name": "Bloom Theory",
        "description": "Fresh floral arrangements and premium bouquet gifting experiences.",
        "barangay": "Asinan",
        "lat": 14.8091,
        "lng": 120.2742,
        "products": [
            {
                "name": "Classic Rose Celebration Bouquet",
                "description": "A polished rose bouquet designed for birthdays, anniversaries, and meaningful surprises.",
                "category": "flowers",
                "price": 1490.00,
                "stock": 15,
                "occasion_tags": ["Anniversary", "Birthday", "Graduation"],
                "recipient_tags": ["Partner", "Parent", "Friend"],
                "tags": ["flowers", "rose", "bouquet", "celebration"],
                "avg_rating": 4.9,
                "popularity_score": 0.95,
            },
            {
                "name": "Soft Pastel Tulip Basket",
                "description": "A pastel floral basket for elegant thank-you and wellness gifting.",
                "category": "flowers",
                "price": 1320.00,
                "stock": 11,
                "occasion_tags": ["Thank You", "Get Well", "Birthday"],
                "recipient_tags": ["Teacher", "Parent", "Client"],
                "tags": ["tulip", "basket", "pastel", "wellness"],
                "avg_rating": 4.7,
                "popularity_score": 0.83,
            },
            {
                "name": "Evergreen Plant & Note Card Set",
                "description": "A living plant gift with note card and premium wrap for long-lasting impact.",
                "category": "flowers",
                "price": 980.00,
                "stock": 20,
                "occasion_tags": ["Housewarming", "Thank You", "Promotion"],
                "recipient_tags": ["Boss", "Client", "Friend", "Parent"],
                "tags": ["plant", "green", "lasting", "decor"],
                "avg_rating": 4.6,
                "popularity_score": 0.79,
            },
            {
                "name": "Signature Mixed Floral Box",
                "description": "A premium hatbox arrangement for recipients who love dramatic floral presentation.",
                "category": "flowers",
                "price": 2190.00,
                "stock": 8,
                "occasion_tags": ["Anniversary", "Birthday", "Christmas"],
                "recipient_tags": ["Partner", "Parent", "Friend"],
                "tags": ["hatbox", "floral", "premium", "luxury"],
                "avg_rating": 4.8,
                "popularity_score": 0.9,
            },
        ],
    },
]


def env_value(name: str, default: str = "") -> str:
    value = os.environ.get(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def batch_upsert(schema, table: str, conflict_column: str, rows: list[dict[str, Any]], batch_size: int = 200) -> None:
    if not rows:
        print(f"Skipping {table}: no rows to seed.")
        return

    for offset in range(0, len(rows), batch_size):
        batch = rows[offset : offset + batch_size]
        schema.table(table).upsert(batch, on_conflict=conflict_column).execute()
        print(f"Seeded {len(batch)} rows into zippo.{table} ({offset + len(batch)}/{len(rows)})")


def build_product_image_data_uri(name: str, category: str, store_name: str) -> str:
    style = CATEGORY_STYLES.get(category, {"accent": "#8B1520", "background": "#FFF1F2", "emoji": "🎁"})
    accent = style["accent"]
    background = style["background"]
    emoji = style["emoji"]
    safe_name = quote(name[:30])
    safe_store = quote(store_name[:28])
    safe_category = quote(category.title())
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" rx="72" fill="{background}"/>
  <rect x="60" y="60" width="780" height="780" rx="56" fill="white" stroke="{accent}" stroke-width="10"/>
  <circle cx="180" cy="180" r="86" fill="{accent}"/>
  <text x="180" y="208" text-anchor="middle" font-size="82" font-family="Arial, sans-serif">{emoji}</text>
  <rect x="90" y="308" width="300" height="28" rx="14" fill="{accent}" opacity="0.15"/>
  <text x="92" y="360" font-size="40" font-weight="700" font-family="Arial, sans-serif" fill="{accent}">{category.title()}</text>
  <text x="92" y="448" font-size="68" font-weight="800" font-family="Arial, sans-serif" fill="#111827">{name}</text>
  <text x="92" y="520" font-size="34" font-family="Arial, sans-serif" fill="#6B7280">{store_name}</text>
  <rect x="92" y="598" width="716" height="148" rx="32" fill="{accent}" opacity="0.08"/>
  <text x="130" y="660" font-size="30" font-family="Arial, sans-serif" fill="{accent}">ZIPPO DEMO PICK</text>
  <text x="130" y="714" font-size="28" font-family="Arial, sans-serif" fill="#374151">Curated synthetic product art for presentation mode</text>
</svg>
""".strip()
    return f"data:image/svg+xml;utf8,{quote(svg)}"


def build_rows() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    profiles: list[dict[str, Any]] = []
    stores: list[dict[str, Any]] = []
    products: list[dict[str, Any]] = []

    for store_index, store in enumerate(PREMIUM_CATALOG, start=1):
        owner_user_id = STORE_OWNERS_BASE + store_index
        store_id = STORES_BASE + store_index
        slug = store["store_name"].lower().replace("&", "and").replace(" ", "-")

        profiles.append(
            {
                "user_id": owner_user_id,
                "role": "store_owner",
                "full_name": f"{store['store_name']} Owner",
                "email": f"{slug}@zippo.local",
                "barangay": store["barangay"],
                "address_line": store["barangay"],
                "is_active": True,
            }
        )

        stores.append(
            {
                "store_id": store_id,
                "owner_user_id": owner_user_id,
                "store_name": store["store_name"],
                "description": store["description"],
                "barangay": store["barangay"],
                "lat": store["lat"],
                "lng": store["lng"],
                "is_active": True,
            }
        )

        for product_index, product in enumerate(store["products"], start=1):
            product_id = PRODUCTS_BASE + ((store_index - 1) * 100) + product_index
            products.append(
                {
                    "product_id": product_id,
                    "store_id": store_id,
                    "owner_user_id": owner_user_id,
                    "name": product["name"],
                    "description": product["description"],
                    "category": product["category"],
                    "price": product["price"],
                    "stock": product["stock"],
                    "occasion_tags": product["occasion_tags"],
                    "recipient_tags": product["recipient_tags"],
                    "tags": product["tags"],
                    "delivery_zones": DELIVERY_ZONES,
                    "local_vendor": True,
                    "avg_rating": product["avg_rating"],
                    "popularity_score": product["popularity_score"],
                    "store_name": store["store_name"],
                }
            )

    return profiles, stores, products


def main() -> int:
    supabase_url = env_value("SUPABASE_URL", env_value("VITE_SUPABASE_URL"))
    supabase_key = env_value(
        "SUPABASE_SERVICE_ROLE_KEY",
        env_value("SUPABASE_SECRET_KEY", env_value("SUPABASE_PUBLISHABLE_KEY", env_value("VITE_SUPABASE_PUBLISHABLE_KEY"))),
    )
    schema_name = env_value("SUPABASE_SCHEMA_NAME", env_value("VITE_SUPABASE_SCHEMA_NAME", "zippo"))

    client = create_client(supabase_url, supabase_key)
    schema = client.schema(schema_name)

    profiles, stores, products = build_rows()
    batch_upsert(schema, "marketplace_profiles", "user_id", profiles)
    batch_upsert(schema, "stores", "store_id", stores)
    batch_upsert(schema, "marketplace_products", "product_id", products)

    print("")
    print("Premium marketplace catalog seed complete.")
    print(f"marketplace_profiles: {len(profiles)}")
    print(f"stores: {len(stores)}")
    print(f"marketplace_products: {len(products)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
