"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryApi, productApi } from "@/lib/api";
import type { InventoryItem, InventoryStatus, Product } from "@/lib/types";
import { toast } from "@/lib/toast";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // form state
  const [productId, setProductId] = useState("");
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [quantityOnHand, setQuantityOnHand] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // adjust stock state
  const [adjustFor, setAdjustFor] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  function refresh() {
    setLoading(true);
    setError(null);
    inventoryApi
      .list({ page, size })
      .then((p) => {
        setItems(p.content);
        // Backend trả Page<T> dạng wrapper {content, page:{totalElements,totalPages}}.
        const total = p.page?.totalElements ?? 0;
        const pages = p.page?.totalPages ?? 0;
        setTotalElements(total);
        setTotalPages(pages);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi khi tải tồn kho"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    productApi
      .list({ page: 0, size: 50 })
      .then((p) => setProducts(p.content))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setSku(p.sku);
      setName(p.name);
    }
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !sku.trim() || !name.trim() || !quantityOnHand) {
      toast.error({ title: "Vui lòng điền đủ các trường bắt buộc" });
      return;
    }
    const qty = Number(quantityOnHand);
    const threshold = Number(lowStockThreshold || "0");
    if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
      toast.error({ title: "Số lượng phải là số nguyên không âm" });
      return;
    }
    if (!Number.isFinite(threshold) || threshold < 0 || !Number.isInteger(threshold)) {
      toast.error({ title: "Ngưỡng tồn thấp phải là số nguyên không âm" });
      return;
    }
    setSubmitting(true);
    inventoryApi
      .create({
        productId,
        sku: sku.trim(),
        name: name.trim(),
        quantityOnHand: qty,
        lowStockThreshold: threshold,
      })
      .then((created) => {
        toast.success({ title: `Đã tạo tồn kho cho "${created.name}"` });
        setProductId("");
        setSku("");
        setName("");
        setQuantityOnHand("");
        setLowStockThreshold("5");
        setFormOpen(false);
        if (page === 0) refresh();
        else setPage(0);
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi tạo tồn kho",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setSubmitting(false));
  }

  function onAdjust(item: InventoryItem, delta: number) {
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
      toast.error({ title: "Số lượng điều chỉnh phải là số nguyên khác 0" });
      return;
    }
    setAdjusting(true);
    inventoryApi
      .adjustStock(item.productId, { quantityDelta: delta })
      .then((updated) => {
        toast.success({
          title: "Đã cập nhật tồn kho",
          description: `${item.name}: ${item.quantityOnHand} → ${updated.quantityOnHand} (còn ${updated.availableQuantity} khả dụng)`,
        });
        setItems((prev) =>
          prev.map((x) =>
            x.productId === updated.productId ? updated : x,
          ),
        );
        setAdjustFor(null);
        setAdjustDelta("");
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi điều chỉnh tồn",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setAdjusting(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tồn kho</h1>
          <p className="text-sm text-muted-foreground">
            Tổng cộng {(totalElements ?? 0).toLocaleString("vi-VN")} mặt hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-1.5 size-4" />
            Tải lại
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setProductId("");
              setSku("");
              setName("");
              setQuantityOnHand("");
              setLowStockThreshold("5");
              setFormOpen((v) => !v);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            {formOpen ? "Đóng" : "Tạo mặt hàng"}
          </Button>
        </div>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tạo mặt hàng tồn kho</CardTitle>
            <CardDescription>
              Mỗi productId chỉ có 1 inventory item (1-1 với product trong catalog).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-product">Sản phẩm</Label>
                <select
                  id="inv-product"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={productId}
                  onChange={(e) => onSelectProduct(e.target.value)}
                  required
                >
                  <option value="">— Chọn sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-sku">SKU</Label>
                <Input
                  id="inv-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="inv-name">Tên hiển thị</Label>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-qty">Số lượng tồn ban đầu</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  min={0}
                  step={1}
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-thr">Ngưỡng sắp hết</Label>
                <Input
                  id="inv-thr"
                  type="number"
                  min={0}
                  step={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Đang tạo…" : "Tạo mặt hàng"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh sách ({items.length} / {totalElements})
          </CardTitle>
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
              Chưa có mặt hàng tồn kho. Tạo một mặt hàng để bắt đầu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Tồn</TableHead>
                  <TableHead className="text-right">Đã giữ</TableHead>
                  <TableHead className="text-right">Khả dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {it.sku}
                      </code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {it.quantityOnHand}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {it.quantityReserved}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {it.availableQuantity}
                    </TableCell>
                    <TableCell>
                      <InventoryStatusBadge status={it.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {adjustFor?.id === it.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            className="h-7 w-20 text-xs"
                            placeholder="+/- n"
                            value={adjustDelta}
                            onChange={(e) => setAdjustDelta(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={adjusting}
                            onClick={() =>
                              onAdjust(it, Number(adjustDelta))
                            }
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAdjustFor(null);
                              setAdjustDelta("");
                            }}
                          >
                            Huỷ
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdjustFor(it);
                              setAdjustDelta("");
                            }}
                            title="Điều chỉnh tồn (+/-)"
                          >
                            <ArrowUp className="size-3" />
                            <ArrowDown className="size-3" />
                            <span className="ml-1">Điều chỉnh</span>
                          </Button>
                        </div>
                      )}
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
    </div>
  );
}

function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const cls =
    status === "IN_STOCK"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "LOW_STOCK"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  const label =
    status === "IN_STOCK"
      ? "Còn hàng"
      : status === "LOW_STOCK"
      ? "Sắp hết"
      : "Hết hàng";
  return <Badge className={cls}>{label}</Badge>;
}
