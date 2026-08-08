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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
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

// ---------- Core fetch wrapper ----------

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 204 No Content — chỉ DELETE/PATCH trả rỗng
  if (res.status === 204) {
    return undefined as T;
  }

  // Parse JSON body (backend luôn trả JSON — ProblemDetail khi lỗi, DTO khi OK)
  let payload: unknown;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    payload = await res.json();
  } else {
    payload = await res.text();
  }

  if (!res.ok) {
    // 401 → token hết hạn / không hợp lệ (e.g. BE cũ trả `sub=username`,
    // order/cart service `UUID.fromString` fail). AuthContext sẽ clear
    // localStorage + reload về trang login. Tránh FE bị kẹt ở trang
    // authenticated khi token không dùng được nữa.
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const problem = payload as ProblemDetail;
    const message =
      problem?.detail ??
      problem?.title ??
      (typeof payload === "string" ? payload : "Lỗi không xác định từ backend");
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return payload as T;
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
};

// ---------- Products (catalog-service) ----------

// Catalog chỉ public trả product ACTIVE (status bị hardcoded trong service),
// nên không có query param `status`. `category` nhận category slug.
export interface ProductQuery {
  page?: number;
  size?: number;
  category?: string; // category slug
  q?: string;
}

export const productApi = {
  list: (query: ProductQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page != null) params.set("page", String(query.page));
    if (query.size != null) params.set("size", String(query.size));
    if (query.category) params.set("category", query.category);
    if (query.q) params.set("q", query.q);
    const qs = params.toString();
    return api<Page<Product>>(`/api/products${qs ? `?${qs}` : ""}`);
  },
  // Catalog không có endpoint theo slug — chỉ GET /api/products/{id} (UUID).
  getById: (id: string) => api<Product>(`/api/products/${id}`),
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
  // Admin: chuyển trạng thái đơn. Backend chỉ cho PENDING/INVENTORY_RESERVED
  // → CONFIRMED/REJECTED/CANCELLED.
  updateStatusAdmin: (id: string, req: UpdateOrderStatusRequest) =>
    api<OrderResponse>(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),
  // Customer huỷ đơn của chính mình — chỉ cho đơn PENDING/CONFIRMED/PROCESSING.
  customerCancel: (id: string) =>
    api<OrderResponse>(`/api/orders/${id}/cancel`, {
      method: "POST",
    }),
  // Customer yêu cầu trả hàng — chỉ cho đơn DELIVERED.
  customerRequestReturn: (id: string, reason?: string) =>
    api<OrderResponse>(`/api/orders/${id}/return-request`, {
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

// ---------- Helpers ----------

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
