// pending-cart.ts — Lưu sản phẩm chờ thêm vào giỏ khi guest chưa đăng nhập.
// Dùng sessionStorage (mất khi đóng tab/trình duyệt) — hành vi giống Shopee/Tiki.
"use client";

export interface PendingCartItem {
  productId: string;
  quantity: number;
  productName?: string;
  productImage?: string;
}

const PENDING_CART_KEY = "mini_ecommerce_pending_cart";

export function getPendingCartItem(): PendingCartItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCartItem;
  } catch {
    return null;
  }
}

export function setPendingCartItem(item: PendingCartItem): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(item));
  } catch {
    // ignore
  }
}

export function clearPendingCartItem(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_CART_KEY);
  } catch {
    // ignore
  }
}
