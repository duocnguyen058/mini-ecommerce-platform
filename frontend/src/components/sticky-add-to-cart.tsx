"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import type { Product } from "@/lib/types";

interface StickyAddToCartProps {
  product: Product;
  targetRef: React.RefObject<HTMLElement | null>;
}

export function StickyAddToCart({ product, targetRef }: StickyAddToCartProps) {
  const [show, setShow] = useState(false);
  const [qty, setQty] = useState(1);
  const { addToCart, pending } = useAddToCart();

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the target (price section) is scrolled past out of view upwards
        // i.e., boundingClientRect.top < 0 and !isIntersecting
        setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" } // offset for navbar
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[500] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transform transition-transform duration-300 translate-y-0 animate-in slide-in-from-bottom-full">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        {/* Product Info (hidden on mobile, show on tablet+) */}
        <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-12 h-12 rounded object-cover border border-gray-100"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-900 truncate">{product.name}</span>
            <span className="text-sm font-bold text-blue-600">{formatVND(product.price)}</span>
          </div>
        </div>
        
        {/* Mobile Price */}
        <div className="md:hidden flex-1 flex flex-col min-w-0">
          <span className="text-xs text-gray-500 truncate">{product.name}</span>
          <span className="text-sm font-bold text-blue-600">{formatVND(product.price)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="qty-stepper hidden sm:flex">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <input readOnly value={qty} />
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <button
            disabled={!!pending}
            onClick={() => addToCart(product.id, qty)}
            className="btn-brand py-2 px-6 flex items-center gap-2 whitespace-nowrap"
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Thêm vào giỏ</span>
            <span className="sm:hidden">Mua ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
