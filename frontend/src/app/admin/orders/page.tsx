"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVND, orderApi } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import { toast } from "@/lib/toast";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_FILTERS,
  VALID_TRANSITIONS,
  TRANSITION_LABEL,
} from "@/lib/order-status-labels";

const STATUS_FILTERS: (OrderStatus | "ALL")[] = ["ALL", ...ORDER_STATUS_FILTERS];

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [patchTarget, setPatchTarget] = useState<OrderResponse | null>(null);
  const [patchStatus, setPatchStatus] = useState<OrderStatus | null>(null);
  const [patchNote, setPatchNote] = useState("");
  const [patching, setPatching] = useState(false);

  function refresh() {
    setLoading(true);
    setError(null);
    orderApi
      .list({
        status: filter === "ALL" ? undefined : filter,
        page,
        size,
      })
      .then((p) => {
        const total = p.page?.totalElements ?? 0;
        const pages = p.page?.totalPages ?? 0;
        setItems(p.content);
        setTotalElements(total);
        setTotalPages(pages);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi khi tải đơn hàng"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  function openPatchDialog(order: OrderResponse, target: OrderStatus) {
    setPatchTarget(order);
    setPatchStatus(target);
    setPatchNote("");
  }

  function closePatchDialog() {
    if (patching) return;
    setPatchTarget(null);
    setPatchStatus(null);
    setPatchNote("");
  }

  function confirmPatch() {
    if (!patchTarget || !patchStatus) return;
    setPatching(true);
    orderApi
      .updateStatusAdmin(patchTarget.id, {
        newStatus: patchStatus,
        note: patchNote.trim() || undefined,
      })
      .then((updated) => {
        const statusLabel = ORDER_STATUS_LABEL[patchStatus];
        toast.success({
          title: `Đã chuyển sang "${statusLabel}"`,
          description: `Đơn ${patchTarget.id.slice(0, 8)}… → ${updated.status}`,
        });
        if (filter === "ALL" || filter === updated.status) {
          setItems((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );
        } else {
          setItems((prev) => prev.filter((o) => o.id !== updated.id));
          setTotalElements((n) => Math.max(0, n - 1));
        }
        closePatchDialog();
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi chỉnh trạng thái",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setPatching(false));
  }

  const canTransition = (order: OrderResponse): boolean =>
    (VALID_TRANSITIONS[order.status as OrderStatus]?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Đơn hàng</h1>
          <p className="text-sm text-muted-foreground">
            Tổng cộng {(totalElements ?? 0).toLocaleString("vi-VN")} đơn (toàn hệ thống).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-1.5 size-4" />
          Tải lại
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(s);
              setPage(0);
            }}
          >
            {s === "ALL" ? "Tất cả" : ORDER_STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filter === "ALL" ? "Tất cả đơn" : `Đơn ${ORDER_STATUS_LABEL[filter]}`}
          </CardTitle>
          <CardDescription>
            Click các nút thao tác bên cạnh mỗi đơn để chuyển trạng thái.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có đơn hàng nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {o.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.userId.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVND(o.totalAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.items.length} món
                    </TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_BADGE_CLASS[o.status as OrderStatus] ?? ""}>
                        {ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canTransition(o) &&
                          (VALID_TRANSITIONS[o.status as OrderStatus] ?? []).map(
                            (target) => (
                              <button
                                key={target}
                                className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                                onClick={() =>
                                  openPatchDialog(o, target)
                                }
                                title={`Chuyển sang ${ORDER_STATUS_LABEL[target]}`}
                              >
                                {TRANSITION_LABEL[target]}
                              </button>
                            ),
                          )}
                        {!canTransition(o) && (
                          <span className="block text-right text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </Button>
              <span className="text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog.Root
        open={patchTarget !== null && patchStatus !== null}
        onOpenChange={(o) => {
          if (!o) closePatchDialog();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-md">
            <Dialog.CloseIconButton />
            <Dialog.Header>
              <Dialog.Title>Chuyển trạng thái đơn</Dialog.Title>
              <Dialog.Description>
                {patchTarget && patchStatus ? (
                  <>
                    Đơn <b>{patchTarget.id.slice(0, 8)}…</b> →{" "}
                    <b>{ORDER_STATUS_LABEL[patchStatus]}</b>
                  </>
                ) : (
                  "Đang tải…"
                )}
              </Dialog.Description>
            </Dialog.Header>
            <div className="grid gap-2">
              <Label htmlFor="patch-note">
                Ghi chú (không bắt buộc)
              </Label>
              <Input
                id="patch-note"
                value={patchNote}
                onChange={(e) => setPatchNote(e.target.value)}
                maxLength={500}
              />
            </div>
            <Dialog.Footer className="mt-2">
              <Dialog.Close
                render={
                  <Button variant="outline" disabled={patching}>
                    Huỷ
                  </Button>
                }
              />
              <Button onClick={confirmPatch} disabled={patching}>
                {patching ? "Đang lưu…" : "Xác nhận"}
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}