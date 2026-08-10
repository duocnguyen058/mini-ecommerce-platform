"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";

const WISHLIST_STORAGE_KEY = "mini_ecommerce_wishlist";

export function getStoredWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredWishlist(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error("Failed to save wishlist:", err);
  }
}

interface WishlistContextType {
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, productName?: string) => void;
  wishlistCount: number;
  loaded: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  isWishlisted: () => false,
  toggleWishlist: () => {},
  wishlistCount: 0,
  loaded: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWishlist(getStoredWishlist());
    setLoaded(true);
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        let updated: string[];
        if (exists) {
          updated = prev.filter((id) => id !== productId);
          toast.info({
            title: "Đã xóa khỏi yêu thích",
            description: productName ? `Đã bỏ ${productName} khỏi danh sách yêu thích.` : undefined,
          });
        } else {
          updated = [...prev, productId];
          toast.success({
            title: "Đã thêm vào yêu thích",
            description: productName ? `Đã thêm ${productName} vào danh sách yêu thích.` : undefined,
          });
        }
        saveStoredWishlist(updated);
        return updated;
      });
    },
    []
  );

  return React.createElement(
    WishlistContext.Provider,
    {
      value: {
        wishlist,
        isWishlisted,
        toggleWishlist,
        wishlistCount: wishlist.length,
        loaded,
      },
    },
    children
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
