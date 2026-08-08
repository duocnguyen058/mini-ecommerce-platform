"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

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
  Dialog,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditProductDialog } from "@/components/edit-product-dialog";
import {
  adminProductApi,
  categoryApi,
  formatVND,
} from "@/lib/api";
import type { Category, Product, ProductStatus } from "@/lib/types";
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_BADGE_CLASS,
} from "@/lib/types";
import { toast } from "@/lib/toast";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STATUS_OPTIONS: ProductStatus[] = ["ACTIVE", "INACTIVE", "DRAFT"];

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // edit + delete
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // form state
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");

  function autoSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200);
  }

  function refresh() {
    setLoading(true);
    setError(null);
    adminProductApi
      .listAll({
        page,
        size,
        q: search.trim() || undefined,
        category: category || undefined,
      })
      .then((p) => {
        setItems(p.content);
        // Backend trả Page<T> dạng wrapper {content, page:{totalElements,totalPages}}.
        const total = p.page?.totalElements ?? 0;
        const pages = p.page?.totalPages ?? 0;
        setTotalElements(total);
        setTotalPages(pages);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi khi tải sản phẩm"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category]);

  function resetForm() {
    setCategoryId("");
    setSku("");
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setStatus("ACTIVE");
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      toast.error({ title: "Vui lòng chọn danh mục" });
      return;
    }
    if (!sku.trim() || !name.trim() || !slug.trim() || !price.trim()) {
      toast.error({ title: "Vui lòng điền đủ SKU, tên, slug, giá" });
      return;
    }
    if (!SLUG_PATTERN.test(slug.trim())) {
      toast.error({
        title: "Slug không hợp lệ",
        description: "Slug chỉ chứa chữ thường, số và dấu gạch ngang.",
      });
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error({ title: "Giá phải là số không âm" });
      return;
    }
    setSubmitting(true);
    adminProductApi
      .create({
        categoryId,
        sku: sku.trim(),
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        status,
      })
      .then((created) => {
        toast.success({ title: `Đã tạo sản phẩm "${created.name}"` });
        resetForm();
        setFormOpen(false);
        if (page === 0) refresh();
        else setPage(0);
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi tạo sản phẩm",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setSubmitting(false));
  }

  function onUpdated(updated: Product) {
    setItems((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    adminProductApi
      .delete(deleteTarget.id)
      .then(() => {
        toast.success({ title: `Đã xoá "${deleteTarget.name}"` });
        setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteOpen(false);
        setDeleteTarget(null);
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi xoá sản phẩm",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setDeleting(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Tổng cộng {(totalElements ?? 0).toLocaleString("vi-VN")} sản phẩm.
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
              resetForm();
              setFormOpen((v) => !v);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            {formOpen ? "Đóng" : "Tạo sản phẩm"}
          </Button>
        </div>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tạo sản phẩm mới</CardTitle>
            <CardDescription>
              Sản phẩm mới sẽ được gắn với danh mục đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onCreate}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="p-cat">Danh mục</Label>
                <select
                  id="p-cat"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">— Chọn danh mục —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="p-sku">SKU</Label>
                <Input
                  id="p-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="PHONE-001"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="p-name">Tên</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    if (!slug || slug === autoSlug(name)) {
                      setSlug(autoSlug(v));
                    }
                  }}
                  placeholder="Điện thoại Demo"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="p-slug">Slug</Label>
                <Input
                  id="p-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="dien-thoai-demo"
                  required
                />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="p-desc">Mô tả</Label>
                <textarea
                  id="p-desc"
                  className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết…"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="p-price">Giá (VND)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="10000000"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="p-status">Trạng thái</Label>
                <select
                  id="p-status"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ProductStatus)
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {PRODUCT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Đang tạo…" : "Tạo sản phẩm"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên / SKU…"
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              aria-label="Lọc theo danh mục"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có sản phẩm.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {p.sku}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVND(p.price)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditTarget(p);
                            setEditOpen(true);
                          }}
                          title="Sửa sản phẩm"
                          aria-label="Sửa sản phẩm"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeleteTarget(p);
                            setDeleteOpen(true);
                          }}
                          title="Xoá sản phẩm"
                          aria-label="Xoá sản phẩm"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
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

      <EditProductDialog
        product={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onUpdated}
      />

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-sm">
            <Dialog.CloseIconButton />
            <Dialog.Header>
              <Dialog.Title>Xoá sản phẩm?</Dialog.Title>
              <Dialog.Description>
                {deleteTarget ? (
                  <>
                    Sản phẩm <b>{deleteTarget.name}</b> (SKU{" "}
                    <code className="rounded bg-muted px-1 text-xs">
                      {deleteTarget.sku}
                    </code>
                    ) sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.
                  </>
                ) : (
                  "Đang tải…"
                )}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer className="mt-2">
              <Dialog.Close
                render={
                  <Button variant="outline" disabled={deleting}>
                    Huỷ
                  </Button>
                }
              />
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xoá…" : "Xoá"}
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge className={PRODUCT_STATUS_BADGE_CLASS[status]}>
      {PRODUCT_STATUS_LABEL[status]}
    </Badge>
  );
}
