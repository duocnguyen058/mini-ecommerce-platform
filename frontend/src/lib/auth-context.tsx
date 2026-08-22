"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  cartApi,
  clearSession,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "@/lib/api";
import { getPendingCartItem, clearPendingCartItem } from "@/lib/pending-cart";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/types";

interface AuthContextValue {
  user: Omit<AuthResponse, "token"> | null;
  // True cho đến khi effect đầu tiên chạy xong để restore từ localStorage.
  // Trong SSR + initial client render, hydration luôn luôn thấy user=null
  // → tránh hydration mismatch (Navbar render cùng nhánh ở cả 2 phía).
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "mini_ecommerce_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR và initial client render đều thấy user=null → hydration khớp.
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);

  // Restore session từ localStorage SAU khi mount (client-only). Mọi component
  // dùng useAuth cần combine `loading` để render fallback khi đang hydrate —
  // Navbar dùng loading để render skeleton ở giai đoạn này thay vì render
  // khác biệt giữa server/client.
  useEffect(() => {
    try {
      const token = getToken();
      const raw = localStorage.getItem(USER_KEY);
      if (token && raw) {
         
        setUser(JSON.parse(raw) as AuthContextValue["user"]);
      }
    } catch {
      // ignore — localStorage có thể set sai format
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng ký global handler cho api(): khi BE trả 401 (token hết hạn /
  // không hợp lệ), clear session + reload để user đăng nhập lại. Tránh
  // FE kẹt với token cũ (vd. identity-service cũ phát `sub=username` khiến
  // /api/orders, /api/cart fail 500). Mount 1 lần — không cần cleanup.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    });
  }, []);

  async function login(req: LoginRequest) {
    const res = await authApi.login(req);
    persist(res);
  }

  async function register(req: RegisterRequest) {
    const res = await authApi.register(req);
    // Backend register trả token=null theo thiết kế (chỉ tạo tài khoản).
    // Tự gọi /login để lấy JWT thật — nếu không có token, FE không thể gọi
    // API nào cần Authorization sau đó.
    if (!res.token) {
      try {
        const loginRes = await authApi.login({
          username: req.username,
          password: req.password,
        });
        persist(loginRes);
      } catch {
        // Tài khoản yêu cầu xác thực email trước khi đăng nhập
      }
    } else {
      persist(res);
    }
  }

  function persist(res: AuthResponse) {
    if (!res.token) {
      throw new Error("Phiên đăng nhập không hợp lệ: token rỗng từ backend");
    }
    setToken(res.token);
    const { token: omit, ...rest } = res;
    void omit;
    setUser(rest);
    localStorage.setItem(USER_KEY, JSON.stringify(rest));

    // Tự động thêm sản phẩm còn chờ (guest đã nhấn giỏ trước khi đăng nhập)
    const pending = getPendingCartItem();
    if (pending && res.token) {
      clearPendingCartItem();
      // Gọi cart API với token vừa lưu (setToken đã chạy ở trên)
      cartApi
        .addItem({ productId: pending.productId, quantity: pending.quantity })
        .then(() => {
          // Import dynamic để tránh circular dep; toast là module độc lập
          import("@/lib/toast").then(({ toast }) => {
            toast.success({
              title: "Đã thêm vào giỏ hàng",
              description: pending.productName
                ? `${pending.productName} × ${pending.quantity} đã được thêm vào giỏ.`
                : `Số lượng: ${pending.quantity}`,
            });
          });
        })
        .catch(() => {
          // Thất bại im lặng — không block luồng đăng nhập
        });
    }
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng trong AuthProvider");
  }
  return ctx;
}
