"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { orderApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_FILTERS,
} from "@/lib/order-status-labels";

const STATUS_FILTERS: ("ALL" | OrderStatus)[] = ["ALL", ...ORDER_STATUS_FILTERS];

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/orders");
    }
  }, [authLoading, user, router]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await orderApi.list({
        status: status !== "ALL" ? status : undefined,
        page: currentPage,
        size: PAGE_SIZE,
      });
      setOrders(data.content);
      setTotalPages(data.page?.totalPages ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không tải được danh sách đơn";
      toast.error({ title: "Lỗi", description: msg });
      setOrders([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [user, status, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
  }, [loadOrders]);

  function onChangeStatus(s: "ALL" | OrderStatus) {
    setStatus(s);
    setCurrentPage(0);
  }

  if (!authLoading && !user) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Đơn hàng của tôi</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => onChangeStatus(s)}
          >
            {s === "ALL" ? "Tất cả" : ORDER_STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
          <Button className="mt-4" variant="outline" nativeButton={false} render={<Link href="/" />}>
            Mua sắm ngay
          </Button>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="space-y-3">
            {orders.map((o) => (
              <Card
                key={o.id}
                className="transition-shadow hover:shadow-md"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/orders/${o.id}`)}
              >
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {o.items.length} mục - {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary tabular-nums">
                      {formatVND(o.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">Xem chi tiết →</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((n) => Math.max(0, n - 1))}
              >
                Trang trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((n) => n + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASS[status] ?? ""}`}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
