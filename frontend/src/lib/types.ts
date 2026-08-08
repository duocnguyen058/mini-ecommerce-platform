// Các type khớp với backend contract của microservices.
// Xem:
//   - services/catalog-service ProductResponse (record)
//   - services/identity-service AuthResponse, LoginRequest, RegisterRequest
//   - services/cart-service CartResponse, CartItemResponse
//   - services/order-service OrderResponse, OrderItemResponse

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

/** Label tiếng Việt cho ProductStatus — dùng trong admin/products và edit-product-dialog. */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Tạm ẩn",
  DRAFT: "Bản nháp",
};

/** Tailwind badge class cho ProductStatus. */
export const PRODUCT_STATUS_BADGE_CLASS: Record<ProductStatus, string> = {
  ACTIVE:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  INACTIVE: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  DRAFT:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: ProductStatus;
  category: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

// Backend trả Page<T> dạng wrapper {content, page:{...}} qua cấu hình
// @EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO).
// - `content`: mảng items.
// - `page`: metadata (number, size, totalElements, totalPages, ...).
export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
  numberOfElements?: number;
}

export interface Page<T> {
  content: T[];
  page: PageMeta;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string; // "Bearer"
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[]; // ["ROLE_CUSTOMER", ...]
}

// Cart item từ cart-service (chỉ lưu productId + quantity — lấy tên/giá từ catalog).
export interface CartItemResponse {
  productId: string;
  quantity: number;
  addedAt?: string;
}

export interface CartResponse {
  userId: string;
  items: CartItemResponse[];
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface OrderItemResponse {
  id: string;
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  shippingAddress: Address | null;
  reservationId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
}

export interface Address {
  recipient?: string;
  phone?: string;
  streetLine?: string;
  city?: string;
  district?: string;
  ward?: string;
  country?: string;
  userId?: string;
}

// RFC 7807 ProblemDetail — backend trả về khi có lỗi
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  errors?: string[];
}

// ---------- Inventory (inventory-service) ----------

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}
