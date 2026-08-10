"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, SlidersHorizontal, RefreshCw, HeartOff } from "lucide-react";
import { productApi, type ProductQuery } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import type { Page, Product } from "@/lib/types";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Directly derive state from URL search parameters (Single Source of Truth)
  const categorySlug = searchParams.get("category") ?? undefined;
  const showWishlistOnly = searchParams.get("wishlist") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [pageNum, setPageNum] = useState(0);
  const [size] = useState(12);

  const { addToCart, pending } = useAddToCart();
  const { wishlist, wishlistCount, loaded: wishlistLoaded } = useWishlist();

  const loadProducts = useCallback(async () => {
    // If in wishlist mode, wait for localStorage hydration
    if (showWishlistOnly && !wishlistLoaded) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query: ProductQuery = {
        page: pageNum,
        size: showWishlistOnly ? 100 : size,
        category: categorySlug || undefined,
        q: appliedQ || undefined,
      };
      const data = await productApi.list(query);
      let content = data.content;

      // Filter by Wishlist if active
      if (showWishlistOnly) {
        if (wishlist.length > 0) {
          content = content.filter((item) => wishlist.includes(String(item.id)));
        } else {
          content = [];
        }
      }

      // Filter by Price Range if active
      if (minPrice != null || maxPrice != null) {
        content = content.filter((item) => {
          if (minPrice != null && item.price < minPrice) return false;
          if (maxPrice != null && item.price > maxPrice) return false;
          return true;
        });
      }

      setProducts(content);
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách sản phẩm");
      setProducts([]);
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [pageNum, size, categorySlug, appliedQ, minPrice, maxPrice, showWishlistOnly, wishlist, wishlistLoaded]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPageNum(0);
    setAppliedQ(q.trim());
  }

  function handleCategoryChange(slug?: string) {
    setPageNum(0);
    if (slug) {
      router.replace(`/?category=${slug}`);
    } else {
      router.replace("/");
    }
  }

  function handleToggleWishlist() {
    setPageNum(0);
    if (showWishlistOnly) {
      router.replace("/");
    } else {
      router.replace("/?wishlist=true");
    }
  }

  function gotoPage(n: number) {
    setPageNum(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero / Page Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 border border-primary/20 shadow-xs">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Khám phá Sản phẩm
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">
          Trải nghiệm mua sắm trực tuyến hiện đại với hàng ngàn sản phẩm công nghệ, điện tử và gia dụng chính hãng.
        </p>
      </div>

      {/* Search & Top Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc SKU sản phẩm..."
              className="pl-9 pr-4"
            />
          </div>
          <Button type="submit" variant="default" className="gap-1.5">
            Tìm kiếm
          </Button>
          {(appliedQ || categorySlug || minPrice != null || maxPrice != null || showWishlistOnly) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQ("");
                setAppliedQ("");
                setMinPrice(undefined);
                setMaxPrice(undefined);
                router.replace("/");
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </form>
      </div>

      {/* Main Grid with Sidebar Category Filter */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Sidebar Category Filter (Desktop & Mobile horizontal scroll) */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 rounded-xl border bg-card p-4 shadow-xs">
            <CategoryFilter
              selectedSlug={categorySlug}
              onSelectCategory={handleCategoryChange}
              showWishlistOnly={showWishlistOnly}
              onSelectWishlist={handleToggleWishlist}
              wishlistCount={wishlistCount}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={(min, max) => {
                setMinPrice(min);
                setMaxPrice(max);
                setPageNum(0);
              }}
            />
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <main className="lg:col-span-9 space-y-8 min-h-[600px] flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => void loadProducts()}>
                <RefreshCw className="size-3.5 mr-1" /> Thử lại
              </Button>
            </div>
          )}

          {/* Skeleton Loading (No CLS) */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-stretch">
              {Array.from({ length: size }).map((_, i) => (
                <Card key={i} className="h-[400px] flex flex-col justify-between p-0 overflow-hidden">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="p-4 space-y-3 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="p-4 border-t flex justify-between gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="rounded-2xl border border-dashed py-20 text-center space-y-3 bg-muted/20">
              {showWishlistOnly ? (
                <>
                  <HeartOff className="mx-auto size-10 text-muted-foreground/40" />
                  <h3 className="text-lg font-bold">Chưa có sản phẩm yêu thích</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Nhấn vào biểu tượng trái tim trên mỗi sản phẩm để thêm vào danh sách yêu thích của bạn.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.replace("/");
                    }}
                  >
                    Xem tất cả sản phẩm
                  </Button>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="mx-auto size-10 text-muted-foreground/40" />
                  <h3 className="text-lg font-bold">Không tìm thấy sản phẩm nào</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Thử tìm kiếm với từ khóa khác hoặc bỏ lọc danh mục để xem tất cả sản phẩm.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQ("");
                      setAppliedQ("");
                      router.replace("/");
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-stretch">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    addToCart={addToCart}
                    pending={pending}
                  />
                ))}
              </div>

              {/* Fixed Pagination Container */}
              {page && (page.page?.totalPages ?? 0) > 1 && (
                <div className="mt-auto pt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page.page?.first ?? false}
                    onClick={() => gotoPage((page.page?.number ?? 0) - 1)}
                  >
                    Trang trước
                  </Button>

                  <span className="text-sm font-medium text-muted-foreground px-2 tabular-nums">
                    Trang {(page.page?.number ?? 0) + 1} / {page.page?.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page.page?.last ?? false}
                    onClick={() => gotoPage((page.page?.number ?? 0) + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <HomeContent />
    </Suspense>
  );
}
