// API client tới gateway (http://localhost:8080) cho tất cả backend microservices.
// JWT lấy từ localStorage (set bởi AuthContext), tự attach làm Authorization header.
//
// Mọi response lỗi từ backend theo RFC 7807 ProblemDetail:
//   { type, title, status, detail, instance, timestamp, errors? }
// Hàm api() dưới đây throw Error với message rút gọn từ detail/title cho dễ show.

import type {
  AddCartItemRequest,
  AuthResponse,
  CartResponse,
  Category,
  InventoryItem,
  LoginRequest,
  OrderResponse,
  OrderStatus,
  Page,
  ProblemDetail,
  Product,
  ProductStatus,
  RegisterRequest,
  UpdateCartItemRequest,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
const TOKEN_KEY = "mini_ecommerce_token";
const USER_KEY = "mini_ecommerce_user";

// Callback được đăng ký bởi AuthContext để handle 401 (token hết hạn / không
// hợp lệ). Set 1 lần khi AuthProvider mount.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function clearSession(): void {
  clearToken();
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

// In-memory cache and in-flight request deduplication
interface CacheEntry {
  data: unknown;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

// Get dynamic TTL based on path
function getCacheTTL(path: string): number {
  if (path.startsWith("/api/categories")) return 60_000; // 1 min
  if (path.startsWith("/api/v1/brands")) return 60_000;   // 1 min
  if (path.startsWith("/api/products/suggestions")) return 20_000; // 20s
  if (path.startsWith("/api/products")) return 10_000;    // 10s
  if (path.startsWith("/api/inventory")) return 5_000;    // 5s
  return 0; // default no auto-cache for dynamic endpoints
}

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

function extractErrorMessage(payload: unknown, res: Response): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === "object") {
        return extractErrorMessage(parsed, res);
      }
    } catch {
      // not a JSON string
    }
    return payload;
  }
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (typeof p.detail === "string" && p.detail.trim().length > 0) {
      return p.detail;
    }
    if (typeof p.message === "string" && p.message.trim().length > 0) {
      return p.message;
    }
    if (typeof p.title === "string" && p.title.trim().length > 0) {
      return p.title;
    }
    if (typeof p.error === "string" && p.error.trim().length > 0) {
      return p.error;
    }
    if (Array.isArray(p.errors) && p.errors.length > 0) {
      const errList = p.errors
        .map((e) => {
          if (typeof e === "string") return e;
          if (e && typeof e === "object") {
            const errObj = e as Record<string, unknown>;
            if (typeof errObj.defaultMessage === "string") return errObj.defaultMessage;
            if (typeof errObj.message === "string") return errObj.message;
            if (typeof errObj.field === "string" && typeof errObj.error === "string") {
              return `${errObj.field}: ${errObj.error}`;
            }
          }
          return JSON.stringify(e);
        })
        .filter(Boolean);
      if (errList.length > 0) {
        return errList.join(", ");
      }
    }
    if (typeof p.errors === "object" && p.errors !== null) {
      const entries = Object.entries(p.errors as Record<string, unknown>);
      if (entries.length > 0) {
        return entries.map(([field, msg]) => `${field}: ${String(msg)}`).join(", ");
      }
    }
  }
  return res.statusText ? `${res.statusText} (${res.status})` : `Lỗi từ máy chủ (HTTP ${res.status})`;
}

// ---------- Core fetch wrapper with caching & deduplication ----------

export interface ApiOptions extends RequestInit {
  bypassCache?: boolean;
  ttl?: number;
}

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isGet = method === "GET";
  const token = getToken();

  // Invalidate cache on mutations
  if (!isGet) {
    if (path.includes("cart")) clearApiCache("/api/cart");
    if (path.includes("categories")) clearApiCache("/api/categories");
    if (path.includes("brands")) clearApiCache("/api/v1/brands");
    if (path.includes("products")) clearApiCache("/api/products");
    if (path.includes("inventory")) clearApiCache("/api/inventory");
    if (path.includes("orders") || path.includes("checkout")) clearApiCache("/api/orders");
  }

  const cacheKey = `${method}:${path}:${token ? "auth" : "anon"}`;
  const now = Date.now();
  const ttl = options.ttl ?? getCacheTTL(path);

  // 1. Check in-memory cache for GET
  if (isGet && !options.bypassCache && ttl > 0) {
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data as T;
    }
  }

  // 2. Request deduplication for concurrent identical GET requests
  if (isGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } catch (networkErr) {
      console.error(`[API Network Error] ${method} ${API_BASE}${path}:`, networkErr);
      const err = new Error(`Không thể kết nối đến máy chủ backend (${API_BASE}). Vui lòng kiểm tra dịch vụ backend hoặc Docker.`) as Error & {
        status?: number;
      };
      err.status = 503;
      throw err;
    }

    // 204 No Content — chỉ DELETE/PATCH trả rỗng
    if (res.status === 204) {
      return undefined as T;
    }

    // Parse response body
    let payload: unknown;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("json")) {
      try {
        payload = await res.json();
      } catch {
        payload = await res.text().catch(() => null);
      }
    } else {
      payload = await res.text().catch(() => null);
    }

    if (!res.ok) {
      if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      const message = extractErrorMessage(payload, res);
      if (res.status === 404) {
        console.warn(`[API 404] ${method} ${API_BASE}${path}:`, message);
      } else {
        console.error(`[API Error] ${method} ${API_BASE}${path} [HTTP ${res.status}]:`, message, payload);
      }
      const err = new Error(message) as Error & { status?: number; payload?: unknown };
      err.status = res.status;
      err.payload = payload;
      throw err;
    }

    // Save to cache
    if (isGet && ttl > 0) {
      memoryCache.set(cacheKey, {
        data: payload,
        expiry: Date.now() + ttl,
      });
    }

    return payload as T;
  })();

  if (isGet) {
    inFlightRequests.set(cacheKey, fetchPromise);
    fetchPromise
      .catch(() => {})
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });
  }

  return fetchPromise;
}


// ---------- Auth (identity-service qua gateway) ----------

export const authApi = {
  login: (req: LoginRequest) =>
    api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  register: (req: RegisterRequest) =>
    api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  verifyEmail: (token: string) =>
    api<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string) =>
    api<{ message: string }>(`/api/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: "POST",
    }),
};

// ---------- Products (catalog-service) ----------

export interface ProductQuery {
  page?: number;
  size?: number;
  category?: string;
  q?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
}

export const productApi = {
  list: (query: ProductQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page != null) params.set("page", String(query.page));
    if (query.size != null) params.set("size", String(query.size));
    if (query.category) params.set("category", query.category);
    if (query.q) params.set("q", query.q);
    if (query.brandId) params.set("brandId", query.brandId);
    if (query.minPrice != null) params.set("minPrice", String(query.minPrice));
    if (query.maxPrice != null) params.set("maxPrice", String(query.maxPrice));
    if (query.minRating != null) params.set("minRating", String(query.minRating));
    if (query.sort) params.set("sort", query.sort);
    const qs = params.toString();
    return api<Page<Product>>(`/api/products${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api<Product>(`/api/products/${id}`),
  getById: (id: string) => api<Product>(`/api/products/${id}`),
  getSuggestions: (q: string) => api<string[]>(`/api/products/suggestions?q=${encodeURIComponent(q)}`),
};

// ---------- Cart (cart-service) ----------

export const cartApi = {
  get: () => api<CartResponse>("/api/cart"),
  addItem: (req: AddCartItemRequest) =>
    api<CartResponse>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  setQuantity: (productId: string, req: UpdateCartItemRequest) =>
    api<CartResponse>(`/api/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),
  removeItem: (productId: string) =>
    api<CartResponse>(`/api/cart/items/${productId}`, {
      method: "DELETE",
    }),
  clear: () =>
    api<void>("/api/cart", {
      method: "DELETE",
    }),
};

// ---------- Orders (order-service) ----------

export const orderApi = {
  checkout: (
    body: {
      shippingAddress?: import("./types").Address;
      currency?: string;
    },
    idempotencyKey?: string,
  ) =>
    api<OrderResponse>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(body),
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
    }),
  getById: (id: string) => api<OrderResponse>(`/api/orders/${id}`),
  list: (params: { status?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.page != null) q.set("page", String(params.page));
    if (params.size != null) q.set("size", String(params.size));
    const qs = q.toString();
    return api<Page<OrderResponse>>(`/api/orders${qs ? `?${qs}` : ""}`);
  },
  listAdmin: (params: { status?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.page != null) q.set("page", String(params.page));
    if (params.size != null) q.set("size", String(params.size));
    const qs = q.toString();
    return api<Page<OrderResponse>>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
  },
  // Admin: chuyển trạng thái đơn. Backend chỉ cho PENDING/INVENTORY_RESERVED
  // → CONFIRMED/REJECTED/CANCELLED.
  updateStatusAdmin: (id: string, req: UpdateOrderStatusRequest) =>
    api<OrderResponse>(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),
  getSummary: () => api<import("./types").OrderSummary>("/api/admin/orders/summary"),
  // Customer huỷ đơn của chính mình — chỉ cho đơn PENDING/CONFIRMED/SHIPPING.
  customerCancel: (id: string) =>
    api<OrderResponse>(`/api/orders/${id}/cancel`, {
      method: "POST",
    }),
  // Customer yêu cầu trả hàng — chỉ cho đơn DELIVERED.
  customerRequestReturn: (id: string, reason?: string) =>
    api<OrderResponse>(`/api/orders/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export interface UpdateOrderStatusRequest {
  newStatus: OrderStatus;
  note?: string;
}

// ---------- Admin: Catalog (categories, products) ----------

// Lưu ý: hiện catalog-service chỉ có POST create cho category & product —
// chưa có update/delete endpoint. UI admin chỉ làm create cho phần này.

export interface CreateCategoryRequest {
  name: string;
  slug: string;
}

export interface CreateProductRequest {
  categoryId: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl?: string;
  status?: ProductStatus;
}

export const categoryApi = {
  list: () => api<Category[]>("/api/categories"),
  create: (req: CreateCategoryRequest) =>
    api<Category>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  delete: (id: string) =>
    api<void>(`/api/admin/categories/${id}`, {
      method: "DELETE",
    }),
};

export const adminProductApi = {
  listAll: (query: ProductQuery = {}) => productApi.list(query),
  getById: (id: string) => productApi.getById(id),
  create: (req: CreateProductRequest) =>
    api<Product>("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  update: (id: string, req: UpdateProductRequest) =>
    api<Product>(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),
  delete: (id: string) =>
    api<void>(`/api/admin/products/${id}`, {
      method: "DELETE",
    }),
};

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  status?: ProductStatus;
  brandId?: string;
  categoryId?: string;
}

// ---------- Admin: Inventory ----------

export interface CreateInventoryItemRequest {
  productId: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  lowStockThreshold?: number;
}

export interface AdjustStockRequest {
  quantityDelta: number;
}

export const inventoryApi = {
  list: (params: { page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.page != null) q.set("page", String(params.page));
    if (params.size != null) q.set("size", String(params.size));
    const qs = q.toString();
    return api<Page<InventoryItem>>(`/api/inventory${qs ? `?${qs}` : ""}`);
  },
  getByProductId: (productId: string) =>
    api<InventoryItem>(`/api/inventory/${productId}`),
  getSummary: () =>
    api<import("./types").InventorySummary>("/api/admin/inventory/summary"),
  create: (req: CreateInventoryItemRequest) =>
    api<InventoryItem>("/api/admin/inventory", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  adjustStock: (productId: string, req: AdjustStockRequest) =>
    api<InventoryItem>(`/api/admin/inventory/${productId}/stock`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),
};

// ---------- Admin: Orders ----------
// BE đã có sẵn: ADMIN gọi /api/orders trả tất cả đơn (không chỉ của mình).
// Tái dùng orderApi.list với status filter.

export type { OrderStatus };

// ---------- Users (identity-service) ----------

export const userApi = {
  getMe: () => api<import("./types").UserResponse>("/api/users/me"),
  updateMe: (req: { fullName?: string; phone?: string }) =>
    api<import("./types").UserResponse>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(req),
    }),
  getAll: () => api<import("./types").UserResponse[]>("/api/users"),
  getById: (id: string) => api<import("./types").UserResponse>(`/api/users/${id}`),
  updateById: (id: string, req: { fullName?: string; phone?: string; enabled?: boolean }) =>
    api<import("./types").UserResponse>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),
};


// ---------- Brands (catalog-service) ----------

export const brandApi = {
  list: () => api<import("./types").Brand[]>("/api/v1/brands"),
  getById: (id: string) => api<import("./types").Brand>(`/api/v1/brands/${id}`),
  getBySlug: (slug: string) => api<import("./types").Brand>(`/api/v1/brands/slug/${slug}`),
  getProducts: (id: string, page = 0, size = 20) =>
    api<Page<import("./types").Product>>(`/api/v1/brands/${id}/products?page=${page}&size=${size}`),
  create: (req: import("./types").CreateBrandRequest) =>
    api<import("./types").Brand>("/api/v1/brands", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  update: (id: string, req: import("./types").CreateBrandRequest) =>
    api<import("./types").Brand>(`/api/v1/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),
  delete: (id: string) =>
    api<void>(`/api/v1/brands/${id}`, {
      method: "DELETE",
    }),
};


// ---------- Notifications (catalog-service) ----------

export const notificationApi = {
  getUserNotifications: (userId: string, page = 0, size = 20) =>
    api<Page<import("./types").Notification>>(
      `/api/v1/notifications/user/${userId}?page=${page}&size=${size}`
    ),
  getUnreadCount: (userId: string) =>
    api<{ unreadCount: number }>(`/api/v1/notifications/user/${userId}/unread-count`),
  markAsRead: (id: string) => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return Promise.resolve();
    }
    return api<void>(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    });
  },
  markAllAsRead: (userId: string) =>
    api<void>(`/api/v1/notifications/user/${userId}/read-all`, {
      method: "PATCH",
    }),
};

// ---------- Helpers ----------

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------- Product Variants (catalog-service) ----------
export const variantApi = {
  list: (productId: string) =>
    api<import("./types").ProductVariant[]>(`/api/v1/products/${productId}/variants`),
};

// ---------- Payment (payment-service :8086) ----------
export const paymentApi = {
  /**
   * Tạo đơn ZaloPay → nhận orderUrl để redirect user.
   * Gọi SAU KHI đã checkout thành công và lấy được orderId.
   */
  createZaloPay: (body: { orderId: string; userId: string; amount: number; description?: string }) =>
    api<import("./types").ZaloPayCreateResponse>("/api/payment/zalopay/create", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Lấy trạng thái thanh toán theo orderId (dùng để polling). */
  getByOrderId: (orderId: string) =>
    api<import("./types").PaymentResponse>(`/api/payment/${orderId}`),
};

// ---------- Coupon (order-service) ----------
export const couponApi = {
  /** Lấy danh sách coupon đang active. */
  listAvailable: () =>
    api<import("./types").Coupon[]>("/api/coupons/available"),

  /** Validate code coupon với tổng đơn hàng. */
  validate: (code: string, orderAmount: number) =>
    api<import("./types").ValidateCouponResponse>("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, orderAmount }),
    }),
};
