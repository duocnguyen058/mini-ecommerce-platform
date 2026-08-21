"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package, Tag, Warehouse, TrendingUp, TrendingDown,
  AlertTriangle, ShoppingBag, Eye, Heart, ArrowUpRight, BarChart3, Users,
  CheckCircle2, Clock, Truck, RotateCcw, XCircle, DollarSign, RefreshCw
} from "lucide-react";
import { productApi, categoryApi, brandApi, userApi, orderApi, inventoryApi, formatVND } from "@/lib/api";
import type { OrderSummary, InventorySummary } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalUsers: number;
  orders: OrderSummary | null;
  inventory: InventorySummary | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalUsers: 0,
    orders: null,
    inventory: null,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [
        productsRes,
        categoriesRes,
        brandsRes,
        usersRes,
        orderSummaryRes,
        inventorySummaryRes,
        topSellingRes,
      ] = await Promise.allSettled([
        productApi.list({ page: 0, size: 1 }),
        categoryApi.list(),
        brandApi.list(),
        userApi.getAll(),
        orderApi.getSummary(),
        inventoryApi.getSummary(),
        productApi.list({ page: 0, size: 5, sort: "soldCount,desc" }),
      ]);

      const totalProducts = productsRes.status === "fulfilled"
        ? (productsRes.value?.page?.totalElements ?? productsRes.value?.content?.length ?? 0)
        : 0;

      const totalCategories = categoriesRes.status === "fulfilled" && Array.isArray(categoriesRes.value)
        ? categoriesRes.value.length
        : 0;

      const totalBrands = brandsRes.status === "fulfilled" && Array.isArray(brandsRes.value)
        ? brandsRes.value.length
        : 0;

      const totalUsers = usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
        ? usersRes.value.length
        : 0;

      const orders = orderSummaryRes.status === "fulfilled" ? orderSummaryRes.value : null;
      const inventory = inventorySummaryRes.status === "fulfilled" ? inventorySummaryRes.value : null;

      const topProductsList = topSellingRes.status === "fulfilled"
        ? (topSellingRes.value?.content ?? [])
        : [];

      setStats({
        totalProducts,
        totalCategories,
        totalBrands,
        totalUsers,
        orders,
        inventory,
      });
      setTopProducts(topProductsList);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalRevenue = stats.orders?.totalRevenue ?? 0;
  const totalOrders = stats.orders?.totalOrders ?? 0;

  const mainMetrics = [
    {
      title: "Tổng doanh thu",
      value: formatVND(totalRevenue),
      icon: DollarSign,
      color: "bg-emerald-600",
      link: "/admin/orders",
      badge: "Thực tế",
    },
    {
      title: "Tổng đơn hàng",
      value: totalOrders.toLocaleString("vi-VN"),
      icon: ShoppingBag,
      color: "bg-blue-600",
      link: "/admin/orders",
      badge: "Database",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts.toLocaleString("vi-VN"),
      icon: Package,
      color: "bg-indigo-600",
      link: "/admin/products",
      badge: "Catalog",
    },
    {
      title: "Tổng người dùng",
      value: stats.totalUsers.toLocaleString("vi-VN"),
      icon: Users,
      color: "bg-purple-600",
      link: "/admin/users",
      badge: "Identity",
    },
  ];

  const catalogMetrics = [
    { title: "Danh mục", value: stats.totalCategories, icon: Tag, color: "text-purple-600 bg-purple-50", link: "/admin/categories" },
    { title: "Thương hiệu", value: stats.totalBrands, icon: ShoppingBag, color: "text-pink-600 bg-pink-50", link: "/admin/brands" },
    { title: "Tồn kho khả dụng", value: stats.inventory?.totalAvailableQuantity ?? 0, icon: Warehouse, color: "text-blue-600 bg-blue-50", link: "/admin/inventory" },
    { title: "Hết hàng", value: stats.inventory?.outOfStockCount ?? 0, icon: AlertTriangle, color: "text-red-600 bg-red-50", link: "/admin/inventory" },
    { title: "Sắp hết hàng", value: stats.inventory?.lowStockCount ?? 0, icon: TrendingDown, color: "text-amber-600 bg-amber-50", link: "/admin/inventory" },
  ];

  const orderStatusCards = [
    { label: "Chờ duyệt", count: stats.orders?.pendingCount ?? 0, icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200", status: "PENDING" },
    { label: "Đã duyệt / Giao", count: (stats.orders?.confirmedCount ?? 0) + (stats.orders?.shippingCount ?? 0), icon: Truck, color: "text-blue-700 bg-blue-50 border-blue-200", status: "CONFIRMED" },
    { label: "Hoàn tất", count: stats.orders?.deliveredCount ?? 0, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200", status: "DELIVERED" },
    { label: "Đã hủy", count: stats.orders?.cancelledCount ?? 0, icon: XCircle, color: "text-gray-700 bg-gray-50 border-gray-200", status: "CANCELLED" },
    { label: "Đã trả hàng", count: stats.orders?.returnedCount ?? 0, icon: RotateCcw, color: "text-purple-700 bg-purple-50 border-purple-200", status: "RETURNED" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="size-6 text-blue-600" />
            Dashboard Quản Trị Hệ Thống
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Dữ liệu đồng bộ trực tiếp thời gian thực từ toàn bộ các Microservices
          </p>
        </div>
        <Button
          onClick={loadDashboard}
          variant="outline"
          size="sm"
          className="gap-1.5 h-9"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map(({ title, value, icon: Icon, color, link, badge }) => (
          <Link
            key={title}
            href={link}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center text-white shadow-sm`}>
                <Icon className="size-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {badge}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {loading ? <div className="skeleton h-8 w-24 rounded" /> : value}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>{title}</span>
              <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <ShoppingBag className="size-4 text-blue-600" />
            Phân Loại Đơn Hàng Theo Trạng Thái
          </h2>
          <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline font-medium">
            Quản lý đơn hàng →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {orderStatusCards.map(({ label, count, icon: Icon, color, status }) => (
            <Link
              key={label}
              href={`/admin/orders?status=${status}`}
              className={`rounded-xl border p-3 flex items-center gap-3 transition-colors hover:bg-white hover:shadow-sm ${color}`}
            >
              <Icon className="size-5 shrink-0" />
              <div>
                <div className="text-lg font-bold leading-tight">
                  {loading ? "..." : count.toLocaleString("vi-VN")}
                </div>
                <div className="text-xs font-medium opacity-80">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {catalogMetrics.map(({ title, value, icon: Icon, color, link }) => (
          <Link
            key={title}
            href={link}
            className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow transition-shadow flex items-center gap-3"
          >
            <div className={`size-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                {loading ? "..." : value.toLocaleString("vi-VN")}
              </div>
              <div className="text-xs text-gray-500">{title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="size-4 text-red-500" /> Top Sản Phẩm Bán Chạy Nhất
            </h2>
            <Link href="/admin/products?sort=soldCount,desc" className="text-xs text-blue-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl || ""}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category?.name || "Danh mục"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{formatVND(p.price || 0)}</div>
                    <div className="text-xs text-gray-400">Đã bán: {(p.soldCount || 0).toLocaleString("vi-VN")}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links + Inventory Alert */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">Thao Tác Quản Trị</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sản phẩm", href: "/admin/products", icon: Package, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
                { label: "Kho hàng", href: "/admin/inventory", icon: Warehouse, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
                { label: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag, color: "text-green-600 bg-green-50 hover:bg-green-100" },
                { label: "Danh mục", href: "/admin/categories", icon: Tag, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
                { label: "Thương hiệu", href: "/admin/brands", icon: Tag, color: "text-pink-600 bg-pink-50 hover:bg-pink-100" },
                { label: "Người dùng", href: "/admin/users", icon: Users, color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-colors ${color}`}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {((stats.inventory?.outOfStockCount ?? 0) > 0 || (stats.inventory?.lowStockCount ?? 0) > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-500" /> Cảnh Báo Tồn Kho
              </h2>
              <div className="space-y-2">
                {(stats.inventory?.outOfStockCount ?? 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-xs font-medium text-red-700">
                      {stats.inventory?.outOfStockCount} sản phẩm đã hết hàng trong kho
                    </span>
                    <Link href="/admin/inventory" className="text-xs font-semibold text-red-600 hover:underline">
                      Nhập kho →
                    </Link>
                  </div>
                )}
                {(stats.inventory?.lowStockCount ?? 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-xs font-medium text-amber-700">
                      {stats.inventory?.lowStockCount} sản phẩm sắp hết hàng
                    </span>
                    <Link href="/admin/inventory" className="text-xs font-semibold text-amber-600 hover:underline">
                      Xem →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
