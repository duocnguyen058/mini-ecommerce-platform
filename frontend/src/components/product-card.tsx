"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuantityInput } from "@/components/quantity-input";
import { RatingStars } from "@/components/rating-stars";
import { formatVND } from "@/lib/api";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  pending?: boolean;
}

export function ProductCard({ product, addToCart, pending = false }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const productUrl = `/products/${product.id}`;
  const liked = isWishlisted(product.id);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border/60 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg rounded-xl relative">
      {/* Header / Product Image Container */}
      <CardHeader className="p-0 relative">
        {/* Wishlist Heart Toggle Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2.5 right-2.5 z-20 size-8 rounded-full bg-background/80 backdrop-blur-md shadow-xs hover:bg-background transition-transform active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
          aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <Heart
            className={`size-4 transition-colors ${
              liked
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          />
        </Button>

        <Link href={productUrl} className="relative block aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted">
          {product.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-4xl font-bold text-muted-foreground/30 group-hover:scale-110 transition-transform">
                {product.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}

          {/* Quick view overlay icon */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm">
              <Eye className="size-3.5" /> Xem chi tiết
            </span>
          </div>

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <Badge variant="secondary" className="max-w-[130px] truncate text-[11px] backdrop-blur-md bg-background/80 shadow-xs border-0">
                {product.category.name}
              </Badge>
            </div>
          )}
        </Link>
      </CardHeader>

      {/* Content Section */}
      <CardContent className="flex flex-1 flex-col p-4 space-y-2">
        {/* Name */}
        <Link
          href={productUrl}
          className="line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Rating Stars Mock */}
        <div className="flex items-center gap-1">
          <RatingStars rating={4.8} size="sm" showNumber />
        </div>

        {/* Description */}
        <p className="line-clamp-2 min-h-[2rem] text-xs text-muted-foreground leading-relaxed" title={product.description}>
          {product.description || "Sản phẩm chính hãng chất lượng cao từ Mini E-Commerce."}
        </p>

        {/* Price & SKU pinned at end of content flex */}
        <div className="mt-auto pt-3 border-t border-border/40 flex items-baseline justify-between gap-1">
          <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
            {formatVND(product.price)}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground/80 truncate max-w-[100px]" title={product.sku}>
            SKU: {product.sku}
          </span>
        </div>
      </CardContent>

      {/* Footer sticky bottom section */}
      <CardFooter className="p-4 pt-0 gap-2 mt-auto border-t border-border/30 pt-3 bg-muted/20">
        <QuantityInput
          value={qty}
          onChange={setQty}
          size="sm"
          disabled={pending}
          className="shrink-0"
        />

        <Button
          type="button"
          size="sm"
          className="ml-auto flex-1 gap-1 text-xs font-semibold shadow-xs"
          disabled={pending}
          onClick={() => addToCart(product.id, qty)}
        >
          <ShoppingCart className="size-3.5" />
          <span className="hidden sm:inline">Thêm giỏ</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
