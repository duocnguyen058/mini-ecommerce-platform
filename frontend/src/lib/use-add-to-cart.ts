"use client";

import { useCallback, useState } from "react";
import { cartApi } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { setPendingCartItem } from "@/lib/pending-cart";
import type { AddCartItemRequest } from "@/lib/types";

// Hook tiện ích cho thao tác "Add to cart" trên trang Home/Product.
// Nếu chưa đăng nhập: lưu pending item vào sessionStorage → redirect /login
// Sau khi login/register: AuthProvider tự động thêm pending item vào giỏ.
export function useAddToCart() {
  const { user } = useAuth();
  const { refresh } = useCart();
  const [pending, setPending] = useState(false);

  const addToCart = useCallback(
    async (productId: string, quantity = 1, meta?: { productName?: string; productImage?: string }) => {
      if (!user) {
        // Lưu vào sessionStorage để sau khi login/register tự thêm vào giỏ.
        setPendingCartItem({ productId, quantity, ...meta });
        toast.info({
          title: "Vui lòng đăng nhập",
          description: "Đăng nhập để thêm sản phẩm vào giỏ hàng.",
        });
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const req: AddCartItemRequest = { productId, quantity };
      setPending(true);
      try {
        await cartApi.addItem(req);
        await refresh();
        window.dispatchEvent(new CustomEvent("openMiniCart"));
        toast.success({
          title: "Đã thêm vào giỏ hàng",
          description: meta?.productName ? `${meta.productName} × ${quantity}` : `Số lượng: ${quantity}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng";
        toast.error({ title: "Thất bại", description: msg });
      } finally {
        setPending(false);
      }
    },
    [user, refresh],
  );

  return { addToCart, pending };
}
