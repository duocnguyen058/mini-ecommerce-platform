"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Package, LogOut, LogIn, Menu, Store } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/", label: "Sản phẩm" },
  { href: "/orders", label: "Đơn hàng" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();

  const itemCount = cart?.itemCount ?? 0;
  const initial = user?.fullName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? "U";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Store className="size-5 text-primary" />
          <span className="hidden sm:inline">Mini E-Commerce</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                pathname === link.href ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Cart icon */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Giỏ hàng"
            className="relative"
            onClick={() => router.push(user ? "/cart" : "/login?next=/cart")}
          >
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* User menu / login button */}
          {loading ? (
            <div className="size-9 animate-pulse rounded-full bg-muted" aria-hidden />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Tài khoản" className="rounded-full">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground mt-1 truncate">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  <Package className="mr-2 size-4" />
                  Đơn hàng của tôi
                </DropdownMenuItem>
                {user.roles?.some((r) => r.includes("ADMIN")) && (
                  <DropdownMenuItem onClick={() => router.push("/admin/products")}>
                    <Package className="mr-2 size-4" />
                    Quản trị sản phẩm
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                <LogIn className="mr-1.5 size-4" />
                Đăng nhập
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => router.push("/register")}>
                Đăng ký
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 md:hidden">
              {NAV_LINKS.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={pathname === link.href ? "bg-muted" : ""}
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

