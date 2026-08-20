"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { orderApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE_CLASS,
} from "@/lib/order-status-labels";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/orders/${params.id}`);
    }
  }, [authLoading, user, router, params.id]);

  // Eslint disable: phụ thuộc params.id
  useEffect(() => {
    async function load() {
      if (!user || !params.id) return;
      setLoading(true);
      setError(null);
      try {
        const o = await orderApi.getById(params.id);
        setOrder(o);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không tải được đơn hàng";
        setError(msg);
        toast.error({ title: "Lỗi", description: msg });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id, user]);

  async function cancelOrder() {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await orderApi.customerCancel(order.id);
      setOrder(updated);
      toast.success({
        title: "Đã huỷ đơn",
        description: `Đơn ${updated.id.slice(0, 8)}… đã chuyển sang "${ORDER_STATUS_LABEL[updated.status]}"`,
      });
      setCancelOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể huỷ đơn";
      toast.error({ title: "Lỗi", description: msg });
    } finally {
      setCancelling(false);
    }
  }

  if (!authLoading && !user) return null;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error ?? "Không tìm thấy đơn hàng."}
        </div>
        <Button
          variant="outline"
          className="mt-4"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          ← Quay lại danh sách
        </Button>
      </div>
    );
  }

  const canCancel =
    order.status === "PENDING" ||
    order.status === "CONFIRMED" ||
    order.status === "SHIPPING";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Đơn #{order.id.slice(0, 8)}…
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo lúc {formatDateTime(order.createdAt)}
            {order.updatedAt !== order.createdAt && (
              <> · Cập nhật lúc {formatDateTime(order.updatedAt)}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="mr-1.5 size-4" />
              Huỷ đơn
            </Button>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog.Root open={cancelOpen} onOpenChange={setCancelOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-sm">
            <Dialog.CloseIconButton />
            <Dialog.Header>
              <Dialog.Title>Huỷ đơn hàng?</Dialog.Title>
              <Dialog.Description>
                Đơn <b>#{order.id.slice(0, 8)}…</b> sẽ chuyển sang trạng thái
                &ldquo;Đã huỷ&rdquo;. Tồn kho đã giữ sẽ được trả lại và bạn không thể tiếp
                tục thao tác trên đơn này.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer className="mt-2">
              <Dialog.Close
                render={
                  <Button variant="outline" disabled={cancelling}>
                    Đóng
                  </Button>
                }
              />
              <Button
                variant="destructive"
                onClick={cancelOrder}
                disabled={cancelling}
              >
                {cancelling ? "Đang huỷ…" : "Xác nhận huỷ"}
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="space-y-4">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tóm tắt đơn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã đơn (UUID)</span>
              <span className="font-mono text-xs">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tiền tệ</span>
              <span>{order.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reservation IDs</span>
              <span className="font-mono text-xs">{formatReservations(order.reservationIds)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tổng tiền</span>
              <span className="text-primary text-lg tabular-nums">{formatVND(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping address */}
        {order.shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Địa chỉ giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="font-medium">{order.shippingAddress.recipient ?? "—"}</span> {order.shippingAddress.phone && `(${order.shippingAddress.phone})`}</p>
              <p className="text-muted-foreground">{order.shippingAddress.streetLine ?? ""}</p>
              <p className="text-muted-foreground">
                {[order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.shippingAddress.country && (
                <p className="text-muted-foreground">{order.shippingAddress.country}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm trong đơn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((it) => (
              <div key={`${it.productId}-${it.sku}`} className="flex justify-between gap-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium leading-tight">{it.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {it.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatVND(it.unitPrice)} × {it.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">{formatVND(it.lineTotal)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${ORDER_STATUS_BADGE_CLASS[status] ?? ""}`}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatReservations(ids?: string[]): string {
  if (!ids || ids.length === 0) return "—";
  return ids.length === 1 ? ids[0] : `${ids.length} reservations`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
