"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { categoryApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import { toast } from "@/lib/toast";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    setLoading(true);
    setError(null);
    categoryApi
      .list()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi khi tải danh mục"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function autoSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 140);
  }

  function handleNameChange(val: string) {
    setName(val);
    setSlug(autoSlug(val));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error({ title: "Vui lòng nhập tên và slug" });
      return;
    }
    if (!SLUG_PATTERN.test(slug.trim())) {
      toast.error({
        title: "Slug không hợp lệ",
        description: "Slug chỉ chứa chữ thường, số và dấu gạch ngang.",
      });
      return;
    }
    setSubmitting(true);
    categoryApi
      .create({ name: name.trim(), slug: slug.trim() })
      .then((created) => {
        toast.success({ title: `Đã tạo danh mục "${created.name}"` });
        setName("");
        setSlug("");
        refresh();
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi tạo danh mục",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setSubmitting(false));
  }

  async function handleDeleteCategory(cat: Category) {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    try {
      await categoryApi.delete(cat.id);
      toast.success({ title: "Đã xóa", description: `Đã xóa danh mục "${cat.name}"` });
      refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error({ title: "Không thể xóa danh mục", description: error.message });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Tag className="size-6 text-blue-600" />
            Quản lý Danh mục
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách danh mục sản phẩm trong Catalog Service ({items.length} danh mục)
          </p>
        </div>
        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          className="gap-1.5 h-9"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form thêm mới */}
        <Card className="bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="size-4 text-blue-600" /> Thêm danh mục mới
            </CardTitle>
            <CardDescription>
              Danh mục giúp phân loại và lọc sản phẩm trong toàn hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="cat-name" className="text-xs font-semibold">Tên danh mục *</Label>
                <Input
                  id="cat-name"
                  placeholder="Ví dụ: Thiết bị số, Phụ kiện..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="cat-slug" className="text-xs font-semibold">Slug (URL) *</Label>
                <Input
                  id="cat-slug"
                  placeholder="thiet-bi-so, phu-kien"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="font-mono text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-1.5 size-4" />
                {submitting ? "Đang tạo…" : "Tạo danh mục"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bảng danh sách */}
        <Card className="bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh mục hiện có</CardTitle>
            <CardDescription>
              Dữ liệu danh mục và số lượng sản phẩm liên kết từ Catalog Database.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-4 text-sm text-destructive">{error}</div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Số sản phẩm</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-blue-600" />
                      Đang tải danh mục...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Chưa có danh mục nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((cat, idx) => (
                    <TableRow key={cat.id}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{cat.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold text-xs">
                          {cat.productCount ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat)}
                          className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
