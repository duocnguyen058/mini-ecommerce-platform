// Tập trung label + badge class + transition cho OrderStatus — dùng chung cho FE.
// Tránh duplicate label map ở orders/page.tsx, orders/[id]/page.tsx, admin/orders/page.tsx.

import type { OrderStatus } from "@/lib/types";

/** Label tiếng Việt cho từng trạng thái đơn hàng. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã trả hàng",
};

/** Tailwind class cho badge — phân biệt trạng thái bằng màu. */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  SHIPPING: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  RETURNED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

/** Danh sách status hiển thị tab filter (customer + admin dùng chung). */
export const ORDER_STATUS_FILTERS: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

/** Transition hợp lệ theo state machine — admin dùng để render button PATCH. */
export const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["RETURNED"],
};

/** Label cho button transition (admin). */
export const TRANSITION_LABEL: Record<OrderStatus, string> = {
  CONFIRMED: "Xác nhận",
  SHIPPING: "Bàn giao VC",
  DELIVERED: "Xác nhận giao",
  CANCELLED: "Huỷ đơn",
  RETURNED: "Nhập lại kho",
  PENDING: "Chờ xác nhận",
};
