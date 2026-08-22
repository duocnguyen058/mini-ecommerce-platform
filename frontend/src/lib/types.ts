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
  parentId?: string | null;
  name: string;
  slug: string;
  icon?: string | null;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  country?: string | null;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  confirmedCount: number;
  shippingCount: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  statusBreakdown: Record<string, number>;
}

export interface InventorySummary {
  totalItems: number;
  totalQuantityOnHand: number;
  totalQuantityReserved: number;
  totalAvailableQuantity: number;
  outOfStockCount: number;
  lowStockCount: number;
}


export interface Product {
  id: string;
  brandId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number;
  imageUrl: string | null;
  videoUrl?: string | null;
  status: ProductStatus;
  weightG?: number;
  dimensions?: string | null;
  warrantyPolicy?: string | null;
  originCountry?: string | null;
  viewCount?: number;
  soldCount?: number;
  wishlistCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  structuredData?: string | null;
  stockQuantity?: number;
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
  paymentMethod: "COD" | "ZALOPAY"; // Sync với Order.paymentMethod (BE)
  shippingAddress: Address | null;
  reservationIds: string[];
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
  totalImported?: number;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  soldQuantity?: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

// ---------- User Management (identity-service) ----------

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  enabled: boolean;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------- Notifications (notification-service v2) ----------

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string; // ORDER_STATUS | PROMOTION | SYSTEM | INVENTORY
  referenceUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  country?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  stockQuantity: number;
  attributesJson?: string | null; // JSON string: {"color":"Xanh","storage":"128GB"}
  createdAt?: string;
  updatedAt?: string;
}

// ---------- Payment (payment-service) ----------

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMethod = "COD" | "ZALOPAY";

export interface PaymentResponse {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  appTransId?: string | null;
  zpTransId?: string | null;
  orderUrl?: string | null; // URL redirect tới ZaloPay payment page
  createdAt: string;
  updatedAt: string;
}

export interface ZaloPayCreateResponse {
  orderUrl: string;       // Redirect user tới URL này
  zpTransToken: string;   // Token ZaloPay
  appTransId: string;     // ID giao dịch phía app
}

// ---------- Coupon (order-service) ----------

export type DiscountType = "PERCENT" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number;
  usedCount: number;
  expiresAt?: string | null;
  remainingUsage: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discountAmount: number;
  code: string;
  message: string;
}
