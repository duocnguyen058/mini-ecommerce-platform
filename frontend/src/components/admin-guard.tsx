"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type React from "react";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  Tag,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// Bảo vệ mọi route /admin/** — chỉ user có role ADMIN mới truy cập.
// Redirect về /login (kèm ?next=) nếu chưa đăng nhập, hoặc / (kèm toast) nếu
// không phải admin.

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (!user.roles?.some((r) => r.includes("ADMIN"))) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user || !user.roles?.some((r) => r.includes("ADMIN"))) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-3">
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const NAV_ITEMS: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/brands", label: "Thương hiệu", icon: Tag },
  { href: "/admin/inventory", label: "Tồn kho", icon: Warehouse },
  { href: "/admin/orders", label: "Đơn hàng", icon: Boxes },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];


export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-lg border bg-card p-3 text-card-foreground">
            <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quản trị
            </p>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-blue-50 font-semibold text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
