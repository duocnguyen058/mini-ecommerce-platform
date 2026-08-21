"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingCart, Package, LogOut, LogIn, Menu, Store, Heart,
  Search, ChevronDown, Bell, User, X, Loader2
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/use-wishlist";
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

const CATEGORIES_NAV = [
  { label: "Điện thoại & Tablet", slug: "dien-thoai-may-tinh-bang" },
  { label: "Laptop", slug: "laptop-may-tinh" },
  { label: "Âm thanh", slug: "thiet-bi-so-am-thanh" },
  { label: "Gia dụng", slug: "dien-lanh-gia-dung" },
  { label: "Thời trang Nam", slug: "thoi-trang-nam" },
  { label: "Thời trang Nữ", slug: "thoi-trang-nu" },
  { label: "Mỹ phẩm", slug: "my-pham-cham-soc-ca-nhan" },
  { label: "Nhà cửa", slug: "nha-cua-doi-song" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const itemCount = cart?.itemCount ?? 0;
  const initial = user?.fullName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? "U";

  // Auto-suggest search with cached API client
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await import("@/lib/api").then(m => m.productApi.getSuggestions(searchQuery.trim()));
        setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  }

  function handleSuggestionClick(s: string) {
    setSearchQuery(s);
    setShowSuggestions(false);
    router.push(`/products?q=${encodeURIComponent(s)}`);
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const isAdmin = user?.roles?.some((r) => r.includes("ADMIN"));

  return (
    <header className="sticky top-0 z-40 w-full shadow-xs">
      {/* Top bar - Brand gradient */}
      <div className="navbar w-full">

        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xs">
              <Store className="size-5 text-[#a66e38]" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline tracking-tight">
              ShopNow
            </span>
          </Link>


          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, thương hiệu..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 h-10 px-4 text-sm text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
                  autoComplete="off"
                  id="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                    className="px-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#8f5a28] hover:bg-[#74451b] text-white text-sm font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
                >
                  {searchLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  <span className="hidden sm:inline">Tìm</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-xl z-50 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => handleSuggestionClick(s)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f7ede0] hover:text-[#a66e38] text-left transition-colors"
                    >
                      <Search className="size-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Notifications */}
            {user && (
              <button
                onClick={() => router.push("/notifications")}
                className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Thông báo"
              >
                <Bell className="size-5" />
                <span className="text-[10px] hidden sm:block">Thông báo</span>
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={() => router.push(user ? "/wishlist" : "/login?next=/wishlist")}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Yêu thích"
            >
              <Heart className={cn("size-5", wishlistCount > 0 && "fill-white")} />
              <span className="text-[10px] hidden sm:block">Yêu thích</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 bg-amber-300 text-amber-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => router.push(user ? "/cart" : "/login?next=/cart")}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="size-5" />
              <span className="text-[10px] hidden sm:block">Giỏ hàng</span>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 bg-amber-300 text-amber-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User */}
            {loading ? (
              <div className="size-8 animate-pulse rounded-full bg-white/20" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex flex-col items-center gap-0.5 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] hidden sm:block truncate max-w-16">
                        {user.fullName?.split(" ").pop() ?? "Tôi"}
                      </span>
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-none">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground mt-1 truncate">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 size-4" />
                      Hồ sơ cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/orders")}>
                      <Package className="mr-2 size-4" />
                      Đơn hàng của tôi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/wishlist")}>
                      <Heart className="mr-2 size-4" />
                      Danh sách yêu thích
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/notifications")}>
                      <Bell className="mr-2 size-4" />
                      Thông báo của tôi
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                          Khu vực Quản trị
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <Store className="mr-2 size-4" />
                          Dashboard Quản trị
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/products")}>
                          <Package className="mr-2 size-4" />
                          Quản lý sản phẩm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/inventory")}>
                          <Package className="mr-2 size-4" />
                          Quản lý kho hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/orders")}>
                          <Package className="mr-2 size-4" />
                          Quản lý đơn hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                          <User className="mr-2 size-4" />
                          Quản lý người dùng
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/login")}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogIn className="size-5" />
                  <span className="text-[10px] hidden sm:block">Đăng nhập</span>
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg border border-white/30 transition-colors"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-white border-b border-amber-100 hidden md:block">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {CATEGORIES_NAV.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "flex-shrink-0 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#a66e38] hover:bg-[#f7ede0] transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-[#a66e38]",
                  pathname.includes(cat.slug) && "text-[#a66e38] border-[#a66e38] bg-[#f7ede0]"
                )}
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

