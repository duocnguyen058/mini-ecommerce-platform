"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Boxes,
  FolderTree,
  Package,
  Warehouse,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  categoryApi,
  inventoryApi,
  orderApi,
  productApi,
} from "@/lib/api";

interface OverviewStats {
  totalProducts: number;
  totalCategories: number;
  totalInventoryItems: number;
  totalOrders: number;
}

interface ApiError {
  api: "products" | "categories" | "inventory" | "orders";
  message: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Backend trả Page<T> dạng wrapper {content, page:{totalElements, ...}}
    // cho products/inventory/orders. categories trả List<Category>.
    // Gọi song song — nếu 1 API lỗi thì các API khác vẫn hiển thị bình thường.
    const safe = async <T,>(
      label: ApiError["api"],
      p: Promise<T>,
      fallback: T,
    ): Promise<T> => {
      try {
        return await p;
      } catch (err) {
        if (!cancelled) {
          setErrors((prev) => [
            ...prev,
            {
              api: label,
              message:
                err instanceof Error ? err.message : "Lỗi không xác định",
            },
          ]);
        }
        return fallback;
      }
    };

    (async () => {
      // Initial state cho skeleton.
      if (!cancelled) {
        setStats({
          totalProducts: 0,
          totalCategories: 0,
          totalInventoryItems: 0,
          totalOrders: 0,
        });
      }

      const [products, categories, inventory, orders] = await Promise.all([
        safe("products", productApi.list({ page: 0, size: 1 }), null),
        safe("categories", categoryApi.list(), []),
        safe("inventory", inventoryApi.list({ page: 0, size: 1 }), null),
        safe("orders", orderApi.list({ page: 0, size: 1 }), null),
      ]);

      if (cancelled) return;
      setStats({
        // Wrapper: response.page.totalElements
        totalProducts: products?.page?.totalElements ?? 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalInventoryItems: inventory?.page?.totalElements ?? 0,
        totalOrders: orders?.page?.totalElements ?? 0,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Trang quản trị hệ thống. Dùng menu bên trái để quản lý sản phẩm,
          danh mục, tồn kho và đơn hàng.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Một số API lỗi khi tải thống kê:{" "}
          {errors.map((e) => `${e.api} (${e.message})`).join("; ")}
        </div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Sản phẩm (đang bán)"
            value={stats.totalProducts}
            icon={Package}
            href="/admin/products"
          />
          <StatCard
            label="Danh mục"
            value={stats.totalCategories}
            icon={FolderTree}
            href="/admin/categories"
          />
          <StatCard
            label="Mặt hàng tồn kho"
            value={stats.totalInventoryItems}
            icon={Warehouse}
            href="/admin/inventory"
          />
          <StatCard
            label="Đơn hàng"
            value={stats.totalOrders}
            icon={Boxes}
            href="/admin/orders"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {(value ?? 0).toLocaleString("vi-VN")}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
