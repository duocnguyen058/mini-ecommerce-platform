"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CartResponse } from "@/lib/types";

interface CartContextValue {
  cart: CartResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearCartState: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Các route không cần cart (login/register) — skip fetch để khỏi spam 401
// khi user mở trực tiếp /login mà vẫn còn token cũ trong localStorage.
const SKIP_CART_PATHS = new Set<string>(["/login", "/register"]);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skipFetch = !user || (pathname != null && SKIP_CART_PATHS.has(pathname));

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    if (pathname != null && SKIP_CART_PATHS.has(pathname)) {
      // Auth route — không fetch, tránh 401 noise khi có token hết hạn.
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải giỏ hàng");
      // Giỏ rỗng khi 404 — cart-service trả 404 nếu chưa có cart
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user, pathname]);

  // Khi user thay đổi (login/logout) → tải lại cart. refresh() là async và
  // setState diễn ra trong callback sau `await` (không sync trong effect body),
  // nhưng ESLint vẫn flag nên tạm disable dòng này.
  useEffect(() => {
    if (skipFetch) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh, skipFetch]);

  function clearCartState() {
    setCart(null);
  }

  return (
    <CartContext.Provider
      value={{ cart, loading, error, refresh, clearCartState }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart phải được dùng trong CartProvider");
  }
  return ctx;
}
