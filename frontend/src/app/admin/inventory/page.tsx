"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Search, RefreshCw, Package, AlertTriangle, CheckCircle,
  Download, Upload, ChevronUp, ChevronDown, X, Plus, Minus, Settings,
  TrendingDown, Filter
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  quantityReserved: number;
  totalImported?: number;
  soldQuantity?: number;
  lowStockThreshold: number;
  version: number;
  updatedAt: string;
}

type StockFilter = "all" | "out" | "low" | "ok";

function getStockStatus(item: InventoryItem): { label: string; badge: string } {
  const avail = item.quantityOnHand - item.quantityReserved;
  if (avail <= 0) return { label: "Hết hàng", badge: "badge-out" };
  if (avail <= item.lowStockThreshold) return { label: "Sắp hết", badge: "badge-low" };
  return { label: "Còn hàng", badge: "text-green-600 bg-green-100 text-xs px-2 py-0.5 rounded-full font-medium" };
}

function AdminInventoryContent() {
  const searchParams = useSearchParams();
  const filterParam = (searchParams.get("filter") ?? "all") as StockFilter;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>(filterParam);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk update states
  const [bulkMode, setBulkMode] = useState<"set" | "increase" | "decrease">("set");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotalImported, setEditTotalImported] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editThreshold, setEditThreshold] = useState("");

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));
      if (appliedQ) params.set("q", appliedQ);
      if (stockFilter !== "all") params.set("stockStatus", stockFilter.toUpperCase());

      const res = await fetch(`${API_BASE}/api/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.content ?? []);
        setTotal(data.page?.totalElements ?? data.totalElements ?? 0);
        setTotalPages(data.page?.totalPages ?? data.totalPages ?? 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, appliedQ, stockFilter]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  }

  function startInlineEdit(item: InventoryItem) {
    setEditingId(item.id);
    const initialTotal = item.totalImported ?? (item.quantityOnHand + (item.soldQuantity ?? 0));
    setEditTotalImported(String(initialTotal));
    setEditQty(String(item.quantityOnHand));
    setEditThreshold(String(item.lowStockThreshold));
  }

  async function saveInlineEdit(itemId: string) {
    try {
      const payload: { totalImported?: number; quantityOnHand?: number; lowStockThreshold: number } = {
        lowStockThreshold: parseInt(editThreshold) || 5,
      };
      if (editTotalImported !== "") {
        payload.totalImported = parseInt(editTotalImported) || 0;
      }
      await fetch(`${API_BASE}/api/admin/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBulkUpdate() {
    if (!bulkValue || selected.size === 0) return;
    const qty = parseInt(bulkValue);
    if (isNaN(qty)) return;
    setBulkLoading(true);
    try {
      const payload = [...selected].map(id => ({
        inventoryItemId: id,
        mode: bulkMode, // set | increase | decrease
        quantity: qty,
      }));
      await fetch(`${API_BASE}/api/admin/inventory/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSelected(new Set());
      setBulkValue("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleExportCSV() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory/export?format=csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback: generate CSV from current page
        const header = "ID,SKU,Tên,Tồn kho,Đã đặt,Còn lại,Ngưỡng cảnh báo";
        const rows = items.map(i =>
          `${i.id},${i.sku},"${i.name}",${i.quantityOnHand},${i.quantityReserved},${i.quantityOnHand - i.quantityReserved},${i.lowStockThreshold}`
        );
        const csv = [header, ...rows].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    } catch { }
  }

  const summaryStats = {
    total: items.length,
    outOfStock: items.filter(i => i.quantityOnHand - i.quantityReserved <= 0).length,
    lowStock: items.filter(i => {
      const avail = i.quantityOnHand - i.quantityReserved;
      return avail > 0 && avail <= i.lowStockThreshold;
    }).length,
    inStock: items.filter(i => i.quantityOnHand - i.quantityReserved > i.lowStockThreshold).length,
  };

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kho Hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} mặt hàng · Cập nhật hàng loạt, Import/Export CSV</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
          >
            <Upload className="size-4" /> Import CSV
          </button>
          <button onClick={() => load()} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng mặt hàng", count: summaryStats.total, icon: Package, color: "text-blue-500 bg-blue-100", filter: "all" },
          { label: "Còn hàng", count: summaryStats.inStock, icon: CheckCircle, color: "text-green-500 bg-green-100", filter: "ok" },
          { label: "Sắp hết", count: summaryStats.lowStock, icon: AlertTriangle, color: "text-amber-500 bg-amber-100", filter: "low" },
          { label: "Hết hàng", count: summaryStats.outOfStock, icon: TrendingDown, color: "text-red-500 bg-red-100", filter: "out" },
        ].map(({ label, count, icon: Icon, color, filter }) => (
          <button
            key={label}
            onClick={() => { setStockFilter(filter as StockFilter); setPage(0); }}
            className={`bg-white rounded-xl border p-4 text-left transition-all shadow-sm ${stockFilter === filter ? "border-red-300 ring-1 ring-red-200" : "border-gray-100 hover:border-gray-300"}`}
          >
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
              <Icon className="size-4" />
            </div>
            <div className="text-xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setAppliedQ(searchQ); setPage(0); }}
          className="flex gap-2 flex-1"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SKU..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-red-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
            Tìm
          </button>
          {appliedQ && (
            <button type="button" onClick={() => { setAppliedQ(""); setSearchQ(""); }} className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Stock filter tabs */}
        <div className="flex gap-1.5">
          {(["all", "ok", "low", "out"] as StockFilter[]).map(f => (
            <button
              key={f}
              onClick={() => { setStockFilter(f); setPage(0); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                stockFilter === f
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Tất cả" : f === "ok" ? "Còn hàng" : f === "low" ? "Sắp hết" : "Hết hàng"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Update */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 flex-wrap animate-fade-in-up">
          <span className="text-sm font-semibold text-blue-700">Đã chọn {selected.size} mặt hàng</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bulkMode}
              onChange={e => setBulkMode(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
            >
              <option value="set">Thiết lập số lượng</option>
              <option value="increase">Tăng số lượng</option>
              <option value="decrease">Giảm số lượng</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="Nhập số lượng..."
              value={bulkValue}
              onChange={e => setBulkValue(e.target.value)}
              className="w-36 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
            />
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkValue || bulkLoading}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {bulkMode === "set" ? <Settings className="size-3.5" /> :
               bulkMode === "increase" ? <Plus className="size-3.5" /> :
               <Minus className="size-3.5" />}
              {bulkLoading ? "Đang cập nhật..." : "Áp dụng"}
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th className="w-10 text-center">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {allSelected ? "☑" : "☐"}
                  </button>
                </th>
                <th className="text-left">Sản phẩm</th>
                <th className="text-left">SKU</th>
                <th className="text-right">Tổng nhập</th>
                <th className="text-right">Tồn kho thực tế</th>
                <th className="text-right">Đã đặt</th>
                <th className="text-right">Khả dụng bán</th>
                <th className="text-right">Đã bán</th>
                <th className="text-left">Trạng thái</th>
                <th className="text-right">Ngưỡng cảnh báo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={11}><div className="skeleton h-12 rounded mx-4 my-1" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">Không có dữ liệu kho hàng</td>
                </tr>
              ) : (
                items.map((item) => {
                  const totalInitial = item.quantityOnHand + (item.soldQuantity ?? 0);
                  const avail = item.quantityOnHand - item.quantityReserved;
                  const status = getStockStatus(item);
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className={selected.has(item.id) ? "bg-blue-50/40" : ""}>
                      <td className="text-center">
                        <button onClick={() => toggleSelect(item.id)} className="text-gray-400 hover:text-gray-600">
                          {selected.has(item.id) ? "☑" : "☐"}
                        </button>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-48 block">{item.name}</span>
                      </td>
                      <td><span className="font-mono text-xs text-gray-500">{item.sku}</span></td>
                      <td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={item.soldQuantity ?? 0}
                            value={editTotalImported}
                            onChange={e => {
                              const val = e.target.value;
                              setEditTotalImported(val);
                              const total = parseInt(val) || 0;
                              const sold = item.soldQuantity ?? 0;
                              setEditQty(String(Math.max(0, total - sold)));
                            }}
                            className="w-20 px-2 py-1 text-sm border border-blue-400 rounded-lg outline-none text-right font-semibold text-blue-600"
                            placeholder="Tổng nhập"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-blue-600">{(item.totalImported ?? totalInitial).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                            {Math.max(0, (parseInt(editTotalImported) || 0) - (item.soldQuantity ?? 0)).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">{item.quantityOnHand.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="text-sm text-gray-500">{item.quantityReserved.toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <span className={`text-sm font-bold ${avail <= 0 ? "text-red-500" : avail <= item.lowStockThreshold ? "text-amber-500" : "text-green-600"}`}>
                          {avail.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm font-medium text-purple-600">{(item.soldQuantity ?? 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={status.badge}>{status.label}</span>
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editThreshold}
                            onChange={e => setEditThreshold(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-amber-300 rounded-lg outline-none text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">{item.lowStockThreshold}</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveInlineEdit(item.id)}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startInlineEdit(item)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors text-xs font-medium"
                            >
                              Chỉnh
                            </button>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</span>
            <div className="flex gap-1.5">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">← Trước</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Import dữ liệu kho</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Dán dữ liệu CSV (định dạng: SKU,Số_lượng) hoặc tải file CSV lên.
            </p>
            <textarea
              rows={8}
              placeholder={"SKU-100001,150\nSKU-100002,80\nSKU-100003,0"}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-red-400 font-mono resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const lines = importText.split("\n").filter(Boolean);
                  const payload = lines.map(line => {
                    const [sku, qty] = line.split(",");
                    return { sku: sku?.trim(), quantity: parseInt(qty?.trim() ?? "0") };
                  }).filter(p => p.sku && !isNaN(p.quantity));
                  try {
                    await fetch(`${API_BASE}/api/admin/inventory/import`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    setShowImport(false);
                    setImportText("");
                    load();
                  } catch {}
                }}
                className="flex-1 py-2 bg-green-500 text-white text-sm rounded-xl hover:bg-green-600 transition-colors"
              >
                Import ({importText.split("\n").filter(Boolean).length} dòng)
              </button>
              <button onClick={() => setShowImport(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Đang tải...</div>}>
      <AdminInventoryContent />
    </Suspense>
  );
}
