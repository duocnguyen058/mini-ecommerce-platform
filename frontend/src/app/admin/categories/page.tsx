"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Lỗi khi tải danh mục"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function autoSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 140);
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
        setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "vi")));
        setName("");
        setSlug("");
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

  // Backend chưa có DELETE category — hiển thị nút nhưng disable với tooltip.
  const deleteDisabled = true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Danh mục</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục sản phẩm. Hiện backend chỉ hỗ trợ tạo mới.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            Tạo danh mục mới
          </CardTitle>
          <CardDescription>
            Slug dùng cho URL (a-z, 0-9, dấu gạch ngang).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="cat-name">Tên</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slug || slug === autoSlug(name)) {
                    setSlug(autoSlug(v));
                  }
                }}
                placeholder="Điện thoại"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="dien-thoai"
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo…" : "Tạo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh sách ({items.length})
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
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có danh mục.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="w-12 text-right">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {c.slug}
                      </code>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteDisabled}
                        title={
                          deleteDisabled
                            ? "Backend chưa hỗ trợ xoá danh mục"
                            : "Xoá"
                        }
                        aria-label="Xoá danh mục"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
