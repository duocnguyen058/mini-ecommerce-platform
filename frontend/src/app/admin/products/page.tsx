"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Trash2, CheckSquare, Square,
  ChevronUp, ChevronDown, Package, Edit, Eye, MoreHorizontal, X, Check, Download, Plus
} from "lucide-react";
import Link from "next/link";
import { productApi, formatVND } from "@/lib/api";
import type { Product, ProductStatus } from "@/lib/types";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_BADGE_CLASS } from "@/lib/types";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ProductStatus | "">("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quick edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState<ProductStatus>("ACTIVE");

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<ProductStatus>("ACTIVE");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setSelectedCategoryId(data[0].id);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/brands`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApi.list({
        page,
        size: PAGE_SIZE,
        q: q || undefined,
        sort: `${sortField},${sortDir}`,
      });
      setProducts(data.content ?? []);
      setTotal(data.page?.totalElements ?? (data as any).totalElements ?? 0);
      setTotalPages(data.page?.totalPages ?? (data as any).totalPages ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, q, sortField, sortDir]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0 || !confirm(`Xóa ${selected.size} sản phẩm?`)) return;
    setBulkLoading(true);
    try {
      await fetch(`${API_BASE}/api/admin/products/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...selected]),
      });
      setSelected(new Set());
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkStatus(targetStatus?: ProductStatus) {
    const statusToApply = targetStatus || bulkStatus;
    if (selected.size === 0 || !statusToApply) return;
    setBulkLoading(true);
    try {
      await fetch(`${API_BASE}/api/admin/products/bulk-status?status=${statusToApply}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...selected]),
      });
      setSelected(new Set());
      setBulkStatus("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  }

  async function saveQuickEdit(productId: string) {
    try {
      await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          status: editStatus,
        }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronUp className="size-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="size-3 text-red-500" /> : <ChevronDown className="size-3 text-red-500" />;
  };

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500">Quản lý catalog, thông tin sản phẩm và giá cả</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="mr-1 size-3.5" />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-[#a66e38] hover:bg-[#8c5b2d]">
            <Plus className="mr-1 size-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Tổng sản phẩm</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Đang kinh doanh</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {products.filter((p) => p.status === "ACTIVE").length}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Ngừng kinh doanh</p>
          <p className="text-2xl font-bold mt-1 text-red-500">
            {products.filter((p) => p.status === "INACTIVE").length}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Đang chọn</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{selected.size}</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white border rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form
            onSubmit={(e) => { e.preventDefault(); setQ(searchInput); setPage(0); }}
            className="relative flex-1 w-full flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc SKU sản phẩm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a66e38]"
              />
            </div>
            <Button type="submit" size="sm" className="bg-[#a66e38] hover:bg-[#8c5b2d]">
              Tìm
            </Button>
            {q && (
              <Button type="button" variant="outline" size="sm" onClick={() => { setQ(""); setSearchInput(""); setPage(0); }}>
                <X className="size-4" />
              </Button>
            )}
          </form>
        </div>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <span className="font-semibold text-blue-800">
              Đã chọn {selected.size} sản phẩm
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus("ACTIVE")}
                className="h-7 text-xs bg-white text-green-700 border-green-300 hover:bg-green-50"
              >
                Hiển thị tất cả
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus("INACTIVE")}
                className="h-7 text-xs bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Ẩn tất cả
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-7 text-xs"
              >
                <Trash2 className="size-3 mr-1" />
                Xóa tất cả
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-200 rounded">
                    {allSelected ? (
                      <CheckSquare className="size-4 text-[#a66e38]" />
                    ) : someSelected ? (
                      <div className="size-4 bg-[#a66e38] rounded-xs flex items-center justify-center text-white font-bold text-[10px]">
                        -
                      </div>
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3">Sản phẩm</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-800 select-none" onClick={() => handleSort("sku")}>
                  <div className="flex items-center gap-1">SKU {renderSortIcon("sku")}</div>
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-800 select-none" onClick={() => handleSort("price")}>
                  <div className="flex items-center gap-1">Giá {renderSortIcon("price")}</div>
                </th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-800 select-none" onClick={() => handleSort("soldCount")}>
                  <div className="flex items-center gap-1">Đã bán {renderSortIcon("soldCount")}</div>
                </th>
                <th className="text-left px-4 py-3">Danh mục</th>
                <th className="text-right px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="skeleton h-12 rounded mx-4 my-1" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr key={product.id} className={selected.has(product.id) ? "bg-blue-50/50" : ""}>
                      <td className="text-center">
                        <button onClick={() => toggleSelect(product.id)}>
                          {selected.has(product.id) ? (
                            <CheckSquare className="size-4 text-red-500" />
                          ) : (
                            <Square className="size-4 text-gray-300 hover:text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl ?? ""}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-52">{product.name}</p>
                            {product.shortDescription && (
                              <p className="text-xs text-gray-400 truncate max-w-52">{product.shortDescription}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-500">{product.sku}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-28 px-2 py-1 text-sm border border-red-300 rounded-lg outline-none focus:border-red-400"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-red-500">{formatVND(product.price)}</div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-xs text-gray-400 line-through">{formatVND(product.originalPrice)}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as ProductStatus)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-red-400"
                          >
                            <option value="ACTIVE">Đang bán</option>
                            <option value="INACTIVE">Tạm ẩn</option>
                            <option value="DRAFT">Bản nháp</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRODUCT_STATUS_BADGE_CLASS[product.status]}`}>
                            {PRODUCT_STATUS_LABEL[product.status]}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{(product.soldCount ?? 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 truncate max-w-24 block">{product.category?.name ?? "-"}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveQuickEdit(product.id)}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                title="Lưu"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Hủy"
                              >
                                <X className="size-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/products/${product.id}`}
                                target="_blank"
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem"
                              >
                                <Eye className="size-4" />
                              </Link>
                              <button
                                onClick={() => {
                                  setEditingId(product.id);
                                  setEditPrice(String(product.price));
                                  setEditStatus(product.status);
                                }}
                                className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Chỉnh nhanh"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa sản phẩm này?")) {
                                    fetch(`${API_BASE}/api/admin/products/${product.id}`, { method: "DELETE" })
                                      .then(() => load());
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Trang {page + 1} / {totalPages} · {total.toLocaleString()} sản phẩm
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Thêm Sản Phẩm Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newName.trim() || !newPrice) return;
                setAddingProduct(true);
                try {
                  const slug = newName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  await fetch(`${API_BASE}/api/admin/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      categoryId: selectedCategoryId || (categories[0]?.id ?? "4d4427e3-c44d-44fa-ba33-14a0a393fb83"),
                      brandId: selectedBrandId || null,
                      name: newName.trim(),
                      sku: newSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
                      slug,
                      description: newDescription.trim() || newName.trim(),
                      price: parseFloat(newPrice),
                      imageUrl: newImageUrl.trim() || null,
                      status: newStatus,
                    }),
                  });
                  setShowAddModal(false);
                  setNewName(""); setNewSku(""); setNewPrice(""); setNewImageUrl(""); setNewDescription(""); setSelectedBrandId("");
                  load();
                } catch (err) {
                  console.error(err);
                } finally {
                  setAddingProduct(false);
                }
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sản phẩm..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Giá bán (₫) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="150000"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mã SKU</label>
                  <input
                    type="text"
                    placeholder="Tự động nếu bỏ trống"
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <select
                    value={selectedBrandId}
                    onChange={e => setSelectedBrandId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">-- Không --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ProductStatus)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Tạm ẩn</option>
                    <option value="DRAFT">Bản nháp</option>
                  </select>
                </div>
              </div>


              <div>
                <label className="block font-medium text-gray-700 mb-1">URL Hình ảnh</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết sản phẩm..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 resize-none text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addingProduct}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addingProduct ? "Đang luôn..." : "Tạo sản phẩm"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
