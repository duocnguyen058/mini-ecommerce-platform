"use client";

export interface PendingWishlistItem {
  productId: string;
  productName?: string;
}

const PENDING_WISHLIST_KEY = "mini_ecommerce_pending_wishlist";

export function getPendingWishlistItem(): PendingWishlistItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_WISHLIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingWishlistItem;
  } catch {
    return null;
  }
}

export function setPendingWishlistItem(item: PendingWishlistItem): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_WISHLIST_KEY, JSON.stringify(item));
  } catch {
    // ignore
  }
}

export function clearPendingWishlistItem(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_WISHLIST_KEY);
  } catch {
    // ignore
  }
}
