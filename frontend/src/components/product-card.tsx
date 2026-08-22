"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Eye, Heart, Star, Check } from "lucide-react";
import { formatVND } from "@/lib/api";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  pending?: boolean;
  onQuickView?: (id: string) => void;
}

function StarsRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function formatSold(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function ProductCard({ product, addToCart, pending = false, onQuickView }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const productUrl = `/products/${product.id}`;
  const liked = isWishlisted(product.id);

  // Discount badge
  const discountPct = (product as any).discountPercent ?? 0;
  const originalPrice = (product as any).originalPrice;
  const soldCount = (product as any).soldCount ?? 0;
  const ratingAvg = (product as any).ratingAvg ?? 0;
  const ratingCount = (product as any).ratingCount ?? 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding || justAdded) return;
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="product-card group flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 ease-out hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-50 rounded-t-xl">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {discountPct > 0 && (
            <span className="badge-sale shadow-xs">-{discountPct}%</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90 hover:bg-white"
          aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <Heart className={`size-4 transition-colors duration-150 ${liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}`} />
        </button>

        {/* Image link */}
        <Link href={productUrl} className="block w-full h-full">
          {product.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-card-img w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-2xl font-bold">
              {product.name?.[0]?.toUpperCase() ?? "P"}
            </div>
          )}
        </Link>

        {/* Hover overlay - Only Xem chi tiết */}
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs rounded-full px-4 py-2 text-xs font-semibold text-gray-800 shadow-md">
            <Eye className="size-3.5 text-[#a66e38]" /> Xem chi tiết
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Name */}
        <Link
          href={productUrl}
          className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug hover:text-[#a66e38] transition-colors"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Rating + Sold */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {ratingCount > 0 ? (
            <>
              <StarsRow rating={ratingAvg} />
              <span>({ratingCount})</span>
            </>
          ) : (
            <span className="text-gray-400">Chưa có đánh giá</span>
          )}
          {soldCount > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span>Đã bán {formatSold(soldCount)}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="price-main text-base font-bold">
            {formatVND(product.price)}
          </span>
          {originalPrice && originalPrice > product.price && (
            <span className="price-strike">
              {formatVND(originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          disabled={pending || adding}
          onClick={handleAddToCart}
          className={`w-full mt-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
            justAdded
              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
              : "border border-[#a66e38] text-[#a66e38] hover:bg-[#a66e38] hover:text-white"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="size-3.5 text-emerald-600 animate-in zoom-in" />
              Đã thêm vào giỏ
            </>
          ) : adding ? (
            "Đang thêm..."
          ) : (
            <>
              <ShoppingCart className="size-3.5" />
              Thêm vào giỏ
            </>
          )}
        </button>
      </div>
    </div>
  );

}
