"use client";

import { useEffect, useState } from "react";
import { productApi } from "@/lib/api";
import type { CartResponse, Product } from "@/lib/types";

// Cart-service chỉ lưu productId + quantity. Để hiển thị được tên/giá/sku
// trong trang Cart, FE phải tự join dữ liệu product từ catalog-service.
// Hook này nhận cart và trả về map<productId, Product> cùng trạng thái loading.
export function useCartProducts(cart: CartResponse | null) {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      // Lấy danh sách productId duy nhất
      const ids = Array.from(
        new Set((cart?.items ?? []).map((i) => i.productId)),
      );
      if (ids.length === 0) {
        setProducts({});
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const map: Record<string, Product> = {};
      // Fetch song song từng product — catalogue không có endpoint batch.
      // Giới hạn concurrency = 6 để không spam backend.
      const results = await Promise.allSettled(
        ids.map((id) => productApi.getById(id)),
      );
      let anyError = false;
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const p = r.value as Product;
          map[ids[idx]] = p;
        } else {
          anyError = true;
        }
      });
      setProducts(map);
      if (anyError) {
        setError("Một số sản phẩm không tải được chi tiết.");
      }
      setLoading(false);
    }
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.items?.length, cart?.updatedAt]);

  return { products, loading, error };
}
