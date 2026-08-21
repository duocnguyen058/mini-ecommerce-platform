"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { productApi } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

const KEY = "recently_viewed";

export function useRecentlyViewed() {
  const getIds = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }, []);
  
  const addId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    const ids = getIds().filter(i => i !== id);
    ids.unshift(id);
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 10)));
  }, [getIds]);

  const removeId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(getIds().filter(item => item !== id)));
  }, [getIds]);
  
  return { getIds, addId, removeId };
}

interface RecentlyViewedProps {
  excludeId?: string;
  onQuickView?: (id: string) => void;
}

export function RecentlyViewed({ excludeId, onQuickView }: RecentlyViewedProps) {
  const { getIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, pending } = useAddToCart();

  useEffect(() => {
    async function load() {
      const ids = getIds().filter(id => id !== excludeId);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          ids.map(id => productApi.getById(id).then(p => ({ id, product: p })).catch(() => ({ id, product: null })))
        );
        const validProducts = results.filter((r): r is { id: string; product: Product } => r.product !== null).map(r => r.product);
        const validIds = results.filter(r => r.product !== null).map(r => r.id);
        if (validIds.length !== ids.length && typeof window !== "undefined") {
          localStorage.setItem(KEY, JSON.stringify(validIds));
        }
        setProducts(validProducts);
      } catch (err) {
        console.error("Failed to load recently viewed products", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [excludeId, getIds]);

  if (loading) return null; // or skeleton
  if (products.length === 0) return null;

  return (
    <section className="mt-8 mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="size-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Bạn đã xem</h2>
      </div>
      
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 hide-scrollbar">
        {products.map(product => (
          <div key={product.id} className="snap-start shrink-0 w-[160px] sm:w-[180px] md:w-auto h-full">
            <ProductCard 
              product={product} 
              addToCart={addToCart} 
              pending={pending as boolean}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
