"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tag,
  Plus,
  Search,
  Globe,
  RefreshCw,
  Sparkles,
  Pencil,
  Trash2,
  Package,
  ChevronRight,
  X,
} from "lucide-react";

import { brandApi } from "@/lib/api";
import type { Brand, CreateBrandRequest, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

type DialogMode = "create" | "edit";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<Brand | null>(null);

  // Products panel
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");

  function loadBrands() {
    setLoading(true);
    brandApi
      .list()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load brands:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBrands();
  }, []);

  function handleNameChange(val: string) {
    setName(val);
    if (dialogMode === "create") {
      const generatedSlug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  }

  function openCreateDialog() {
    setDialogMode("create");
    setEditTarget(null);
    setName("");
    setSlug("");
    setLogoUrl("");
    setCountry("");
    setDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(brand: Brand) {
    setDialogMode("edit");
    setEditTarget(brand);
    setName(brand.name ?? "");
    setSlug(brand.slug ?? "");
    setLogoUrl(brand.logoUrl ?? "");
    setCountry(brand.country ?? "");
    setDescription(brand.description ?? "");
    setDialogOpen(true);
  }

  async function handleDeleteBrand(brand: Brand) {
    if (!confirm(`Bạn có chắc muốn xóa thương hiệu "${brand.name}"?`)) return;
    try {
      await brandApi.delete(brand.id);
      toast.success({ title: "Đã xóa", description: `Đã xóa thương hiệu "${brand.name}"` });
      if (selectedBrand?.id === brand.id) setSelectedBrand(null);
      loadBrands();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error({ title: "Không thể xóa", description: error.message });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error({ title: "Lỗi", description: "Vui lòng nhập tên và slug thương hiệu" });
      return;
    }

    setSubmitting(true);
    const req: CreateBrandRequest = {
      name: name.trim(),
      slug: slug.trim(),
      logoUrl: logoUrl.trim() || undefined,
      country: country.trim() || undefined,
      description: description.trim() || undefined,
    };

    try {
      if (dialogMode === "create") {
        await brandApi.create(req);
        toast.success({ title: "Thành công", description: `Đã tạo thương hiệu "${name}"` });
      } else if (editTarget) {
        await brandApi.update(editTarget.id, req);
        toast.success({ title: "Đã cập nhật", description: `Thương hiệu "${name}" đã được lưu` });
      }
      setDialogOpen(false);
      loadBrands();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error({ title: "Lỗi", description: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelectBrand(brand: Brand) {
    if (selectedBrand?.id === brand.id) {
      setSelectedBrand(null);
      setBrandProducts([]);
      return;
    }
    setSelectedBrand(brand);
    setLoadingProducts(true);
    try {
      const page = await brandApi.getProducts(brand.id, 0, 20);
      setBrandProducts(page.content ?? []);
    } catch {
      setBrandProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  const filteredBrands = brands.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.country?.toLowerCase().includes(search.toLowerCase()) ||
      b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Tag className="size-6 text-blue-600" />
            Quản lý Thương hiệu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách thương hiệu / nhà sản xuất trong Catalog Service ({brands.length} thương hiệu)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadBrands}
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9"
          >
            <Plus className="size-4" />
            Thêm thương hiệu
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm thương hiệu theo tên, xuất xứ, slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brands Table */}
        <div className={selectedBrand ? "lg:col-span-3" : "lg:col-span-5"}>
          <Card className="bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">Logo</th>
                    <th className="px-4 py-3.5 font-semibold">Tên thương hiệu</th>
                    <th className="px-4 py-3.5 font-semibold">Slug</th>
                    <th className="px-4 py-3.5 font-semibold">Quốc gia</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Số SP</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Đang tải danh sách thương hiệu...
                      </td>
                    </tr>
                  ) : filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        Không tìm thấy thương hiệu nào.
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((b) => (
                      <tr
                        key={b.id}
                        className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                          selectedBrand?.id === b.id ? "bg-blue-50/60" : ""
                        }`}
                        onClick={() => handleSelectBrand(b)}
                      >
                        <td className="px-4 py-3.5">
                          {b.logoUrl ? (
                            <div className="relative size-10 rounded-lg overflow-hidden border bg-gray-50">
                              <Image
                                src={b.logoUrl}
                                alt={b.name}
                                fill
                                sizes="40px"
                                className="object-contain p-1"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                              {b.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            {b.name}
                            {selectedBrand?.id === b.id && (
                              <ChevronRight className="size-3.5 text-blue-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{b.slug}</td>
                        <td className="px-4 py-3.5 text-gray-700">
                          {b.country ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Globe className="size-3.5 text-gray-400" />
                              {b.country}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant="secondary" className="font-semibold text-xs">
                            {b.productCount ?? 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(b)}
                              className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="size-3.5 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBrand(b)}
                              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Brand Products Panel */}
        {selectedBrand && (
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">
                    Sản phẩm của {selectedBrand.name} ({selectedBrand.productCount ?? brandProducts.length})
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedBrand(null); setBrandProducts([]); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {loadingProducts ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải sản phẩm...
                  </div>
                ) : brandProducts.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    <Package className="size-8 mx-auto mb-2 opacity-30" />
                    Thương hiệu chưa có sản phẩm nào.
                  </div>
                ) : (
                  brandProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {p.imageUrl ? (
                        <div className="relative size-10 rounded-md overflow-hidden border bg-gray-50 shrink-0">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div className="size-10 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                          <Package className="size-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(p.price)}
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] shrink-0 ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                <span>{brandProducts.length} sản phẩm hiển thị</span>
                <Link
                  href={`/products?brandId=${selectedBrand.id}`}
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                >
                  Xem trên trang mua sắm →
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create / Edit Brand Modal */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-md">
            <Dialog.Header>
              <Dialog.Title className="flex items-center gap-2">
                {dialogMode === "create" ? (
                  <>
                    <Sparkles className="size-5 text-blue-600" />
                    Thêm thương hiệu mới
                  </>
                ) : (
                  <>
                    <Pencil className="size-5 text-blue-600" />
                    Chỉnh sửa thương hiệu
                  </>
                )}
              </Dialog.Title>
              <Dialog.Description>
                {dialogMode === "create"
                  ? "Thương hiệu mới sẽ xuất hiện trong bộ lọc và danh sách sản phẩm"
                  : `Đang chỉnh sửa: ${editTarget?.name}`}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.CloseIconButton />
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <Label htmlFor="brand-name" className="text-xs font-semibold">
                  Tên thương hiệu *
                </Label>
                <Input
                  id="brand-name"
                  placeholder="Ví dụ: Apple, Sony, Samsung..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand-slug" className="text-xs font-semibold">
                  Slug (URL) *
                </Label>
                <Input
                  id="brand-slug"
                  placeholder="apple, sony, samsung"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="brand-country" className="text-xs font-semibold">
                  Quốc gia xuất xứ
                </Label>
                <Input
                  id="brand-country"
                  placeholder="Ví dụ: Mỹ, Nhật Bản, Hàn Quốc, Anh..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand-logo" className="text-xs font-semibold">
                  URL Logo
                </Label>
                <Input
                  id="brand-logo"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand-desc" className="text-xs font-semibold">
                  Mô tả
                </Label>
                <textarea
                  id="brand-desc"
                  placeholder="Thông tin giới thiệu về thương hiệu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={submitting}
                >
                  {submitting
                    ? "Đang lưu..."
                    : dialogMode === "create"
                    ? "Tạo thương hiệu"
                    : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
