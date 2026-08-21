"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Package,
  Sparkles,
  Info,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { notificationApi } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.userId;

  const isAdmin = user?.roles?.some((r) => r.includes("ADMIN"));

  async function loadNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      const fetchTasks: Promise<any>[] = [
        userId ? notificationApi.getUserNotifications(userId) : Promise.resolve({ content: [] }),
        import("@/lib/api").then(m => m.orderApi.list({ size: 20 })),
      ];

      if (isAdmin) {
        fetchTasks.push(
          notificationApi.getUserNotifications("00000000-0000-0000-0000-000000000001")
        );
      }

      const results = await Promise.allSettled(fetchTasks);
      const items: Notification[] = [];

      // Backend user notifications
      if (results[0].status === "fulfilled" && results[0].value?.content) {
        items.push(...results[0].value.content);
      }

      // Backend admin notifications (if admin)
      if (isAdmin && results[2]?.status === "fulfilled" && results[2].value?.content) {
        items.push(...results[2].value.content);
      }

      // Realtime order notifications
      if (results[1].status === "fulfilled" && results[1].value?.content) {
        results[1].value.content.forEach((order: any) => {
          const shortId = order.id.slice(0, 8).toUpperCase();
          let title = `Đơn hàng #${shortId}`;
          let statusText = "đã được tạo thành công";

          if (order.status === "CONFIRMED") {
            title = `Đơn hàng #${shortId} đã được xác nhận ✅`;
            statusText = "đã được xác nhận và đang được chuẩn bị đóng gói";
          } else if (order.status === "SHIPPING") {
            title = `Đơn hàng #${shortId} đang giao 🚚`;
            statusText = "đang trên đường giao đến địa chỉ của bạn";
          } else if (order.status === "DELIVERED") {
            title = `Đơn hàng #${shortId} đã giao thành công 📦`;
            statusText = "đã được giao thành công";
          } else if (order.status === "CANCELLED") {
            title = `Đơn hàng #${shortId} đã bị hủy ❌`;
            statusText = "đã bị hủy";
          } else if (order.status === "RETURNED") {
            title = `Đơn hàng #${shortId} đã hoàn trả 🔄`;
            statusText = "đã được hoàn trả thành công";
          }

          const existingDbNotif = items.some(
            (it) => it.referenceUrl?.includes(order.id) && it.title === title
          );

          if (!existingDbNotif) {
            items.push({
              id: `order-notif-${order.id}-${order.status}`,
              userId: userId || "",
              title,
              message: `Đơn hàng #${shortId} ${statusText}. Tổng tiền: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalAmount || 0)}.`,
              notificationType: "ORDER_STATUS",
              isRead: false,
              referenceUrl: `/orders/${order.id}`,
              createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
            });
          }
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/notifications");
      return;
    }
    loadNotifications();
  }, [user, authLoading, userId]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (userId && UUID_REGEX.test(userId)) {
      try {
        await notificationApi.markAllAsRead(userId);
      } catch (err) {
        console.warn("Could not sync mark-all-read with server:", err);
      }
    }
    toast.success({ title: "Thành công", description: "Đã đánh dấu tất cả là đã đọc" });
  }

  async function handleMarkOneRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    // Only call backend API if this is a real persistent DB notification with a valid UUID
    if (UUID_REGEX.test(id)) {
      try {
        await notificationApi.markAsRead(id);
      } catch (err) {
        console.warn("Could not sync mark-read with server for id:", id, err);
      }
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 mb-1"
          >
            <ArrowLeft className="size-3.5" />
            Về trang chủ
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Bell className="size-6 text-blue-600" />
            Thông báo của tôi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cập nhật về đơn hàng, khuyến mãi và hoạt động tài khoản ({unreadCount} chưa đọc)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5"
            >
              <CheckCheck className="size-4 text-blue-600" />
              Đánh dấu đã đọc tất cả
            </Button>
          )}
          <Button
            onClick={loadNotifications}
            variant="ghost"
            size="sm"
            className="h-9"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border bg-white p-4 animate-pulse space-y-2">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Bell className="size-7 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Chưa có thông báo nào</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Bạn sẽ nhận được thông báo khi đơn hàng thay đổi trạng thái hoặc có tin tức khuyến mãi mới.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkOneRead(n.id)}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${
                n.isRead
                  ? "bg-white border-gray-200 text-gray-700"
                  : "bg-blue-50/50 border-blue-200 text-gray-900 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n.notificationType === "ORDER_UPDATE" ? (
                      <Package className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                      {!n.isRead && (
                        <span className="size-2 rounded-full bg-blue-600 inline-block" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                      <Clock className="size-3" />
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>

                {n.referenceUrl && (
                  <Link href={n.referenceUrl}>
                    <Button variant="outline" size="sm" className="text-xs h-8 flex-shrink-0">
                      Xem chi tiết
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
