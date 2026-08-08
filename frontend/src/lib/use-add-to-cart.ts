"use client";

import { useCallback, useState } from "react";
import { cartApi } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import type { AddCartItemRequest } from "@/lib/types";

// Hook tiện ích cho thao tác "Add to cart" trên trang Home/Product.
// Tự xử lý: trạng thái loading, toast thông báo, refresh CartContext,
// và redirect về /login khi chưa đăng nhập.
export function useAddToCart() {
  const { user } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      if (!user) {
        toast.info({
          title: "Vui lòng đăng nhập",
          description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.",
        });
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      const req: AddCartItemRequest = { productId, quantity };
      setPending(true);
      try {
        await cartApi.addItem(req);
        await refresh();
        toast.success({
          title: "Đã thêm vào giỏ hàng",
          description: `Số lượng: ${quantity}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng";
        toast.error({ title: "Thất bại", description: msg });
      } finally {
        setPending(false);
      }
    },
    [user, refresh, router],
  );

  return { addToCart, pending };
}
