"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import {
  getPendingWishlistItem,
  clearPendingWishlistItem,
  setPendingWishlistItem,
} from "@/lib/pending-wishlist";

function getWishlistKey(userId?: string | null): string {
  return userId ? `mini_ecommerce_wishlist_${userId}` : "mini_ecommerce_wishlist_guest";
}

export function getStoredWishlist(userId?: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getWishlistKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredWishlist(ids: string[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getWishlistKey(userId);
    localStorage.setItem(key, JSON.stringify(ids));
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
  const { user, loading: authLoading } = useAuth();
  const userId = user?.userId ?? user?.username ?? null;

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    let stored = getStoredWishlist(userId);

    // Xử lý pending wishlist item (guest vừa đăng nhập)
    const pending = getPendingWishlistItem();
    if (pending && userId) {
      clearPendingWishlistItem();
      if (!stored.includes(pending.productId)) {
        stored = [...stored, pending.productId];
        saveStoredWishlist(stored, userId);
        toast.success({
          title: "Đã thêm vào yêu thích",
          description: pending.productName
            ? `Đã thêm ${pending.productName} vào danh sách yêu thích.`
            : undefined,
        });
      }
    }

    setWishlist(stored);
    setLoaded(true);
  }, [userId, authLoading]);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      // Nếu chưa đăng nhập: lưu pending item → thông báo → chuyển hướng đăng nhập
      if (!user) {
        setPendingWishlistItem({ productId, productName });
        toast.info({
          title: "Vui lòng đăng nhập",
          description: "Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích.",
        });
        if (typeof window !== "undefined") {
          window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        }
        return;
      }


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
        saveStoredWishlist(updated, userId);
        return updated;
      });
    },
    [user, userId]
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
