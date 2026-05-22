import { X, MapPin, Star, Store, Tag } from "lucide-react";
import type { Product } from "../context/GiftContext";

const BRAND = "#8B1520";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onBuyNow,
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Product Details</div>
            <div className="text-lg text-gray-900" style={{ fontWeight: 800 }}>
              {product.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-gray-100">
            <div className="rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(event) => {
                  if (product.fallbackImage && event.currentTarget.src !== product.fallbackImage) {
                    event.currentTarget.src = product.fallbackImage;
                  }
                }}
              />
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs px-2.5 py-1 rounded-full inline-flex bg-red-50 mb-2" style={{ color: BRAND, fontWeight: 700 }}>
                  {product.category || "Gift"}
                </div>
                <div className="text-2xl text-gray-900" style={{ fontWeight: 900 }}>
                  {product.name}
                </div>
                <div className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {product.description || product.explanation || "Curated for a polished ZIPPO gifting experience."}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400">Price</div>
                <div className="text-2xl" style={{ color: BRAND, fontWeight: 900 }}>
                  P{product.price}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-center gap-3">
                {product.storeLogo ? (
                  <img src={product.storeLogo} alt={product.store} className="w-12 h-12 rounded-2xl border border-gray-100 bg-white" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-sm" style={{ color: BRAND, fontWeight: 800 }}>
                    {product.store.slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>
                    {product.store}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{product.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Store</span>
                </div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {product.store}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500">Match</span>
                </div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {product.match}%
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Stock</span>
                </div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {(product.stock ?? 0) > 0 ? `${product.stock} available` : "Unavailable"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-700"
                    style={{ fontWeight: 600 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onBuyNow(product)}
                disabled={(product.stock ?? 0) <= 0}
                className="flex-1 py-3.5 rounded-2xl text-white disabled:opacity-60"
                style={{ background: BRAND, fontWeight: 800 }}
              >
                {(product.stock ?? 0) > 0 ? "Buy Now" : "Unavailable"}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3.5 rounded-2xl border border-gray-200 text-gray-700"
                style={{ fontWeight: 700 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
