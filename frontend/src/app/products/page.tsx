"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal, ChevronDown, Star, X, Filter,
  ArrowUpDown, TrendingUp, Clock, DollarSign
} from "lucide-react";
import { productApi, formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

const PRICE_RANGES = [
  { label: "Dưới 500K", min: 0, max: 500000 },
  { label: "500K - 1 triệu", min: 500000, max: 1000000 },
  { label: "1 - 5 triệu", min: 1000000, max: 5000000 },
  { label: "5 - 20 triệu", min: 5000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: 999999999 },
];

const SORT_OPTIONS = [
  { label: "Phổ biến nhất", value: "soldCount,desc", icon: TrendingUp },
  { label: "Mới nhất", value: "createdAt,desc", icon: Clock },
  { label: "Giá thấp → cao", value: "price,asc", icon: DollarSign },
  { label: "Giá cao → thấp", value: "price,desc", icon: DollarSign },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, pending } = useAddToCart();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "soldCount,desc";
  const wishlistOnly = searchParams.get("wishlist") === "true";

  const { wishlist, isWishlisted, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageNum, setPageNum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; parentId?: string | null }[]>([]);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const size = 20;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (wishlistOnly) {
        if (wishlist.length === 0) {
          setProducts([]);
          setTotal(0);
          setTotalPages(0);
          setLoading(false);
          return;
        }
        const results = await Promise.all(
          wishlist.map(id => productApi.getById(id).then(p => ({ id, product: p })).catch(() => ({ id, product: null })))
        );
        // Auto-clean stale IDs that no longer exist in the database
        const staleIds = results.filter(r => r.product === null).map(r => r.id);
        staleIds.forEach(id => toggleWishlist(id));
        const validProducts = results.filter((r): r is { id: string; product: Product } => r.product !== null).map(r => r.product);
        setProducts(validProducts);
        setTotal(validProducts.length);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      const params: Parameters<typeof productApi.list>[0] = {
        page: pageNum,
        size,
        sort,
      };
      if (q) params.q = q;
      if (category) params.category = category;

      if (selectedBrand) params.brandId = selectedBrand;
      if (selectedPriceRange) {
        params.minPrice = selectedPriceRange.min;
        params.maxPrice = selectedPriceRange.max;
      }

      const data = await productApi.list(params);
      let list = data.content ?? [];

      if (selectedRating) {
        list = list.filter((p: any) => (p.ratingAvg ?? 0) >= selectedRating);
      }

      setProducts(list);
      setTotal(data.page?.totalElements ?? list.length);
      setTotalPages(data.page?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [pageNum, sort, q, category, selectedBrand, selectedPriceRange, selectedRating, wishlistOnly, wishlist, toggleWishlist]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    import("@/lib/api").then(m => {
      m.brandApi.list().then(setBrands).catch(() => {});
      m.categoryApi.list().then(setCategories).catch(() => {});
    });
  }, []);

  const setSort = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", val);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedBrand("");
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setPageNum(0);
  };

  const hasFilters = selectedBrand || selectedPriceRange || selectedRating;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
      {/* Breadcrumb + Query title */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-[#a66e38]">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-800">Sản phẩm</span>
          {wishlistOnly && <><span>/</span><span className="text-[#a66e38] font-semibold">Yêu thích</span></>}
          {q && <><span>/</span><span className="text-[#a66e38]">&quot;{q}&quot;</span></>}
        </div>
        {wishlistOnly ? (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ❤️ Danh sách sản phẩm yêu thích
              <span className="text-sm font-normal text-gray-500 ml-1">({total} sản phẩm)</span>
            </h1>
            {total > 0 && (
              <button
                onClick={() => {
                  wishlist.forEach(id => toggleWishlist(id));
                }}
                className="text-sm text-red-500 hover:text-red-700 hover:underline"
              >
                Xóa tất cả yêu thích
              </button>
            )}
          </div>
        ) : q ? (
          <h1 className="text-xl font-bold text-gray-800">
            Kết quả tìm kiếm cho <span className="text-[#a66e38]">&quot;{q}&quot;</span>
            <span className="text-sm font-normal text-gray-500 ml-2">({total} sản phẩm)</span>
          </h1>
        ) : null}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <aside className={`${mobileFilterOpen ? "fixed inset-0 z-50 bg-black/50" : "hidden"} md:block md:static md:z-auto md:bg-transparent w-full md:w-56 flex-shrink-0`}>
          <div className={`${mobileFilterOpen ? "absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto" : ""} md:sticky md:top-20 space-y-4`}>
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 md:p-0">
              <h2 className="flex items-center gap-2 font-semibold text-gray-800">
                <SlidersHorizontal className="size-4 text-[#a66e38]" /> Bộ lọc
              </h2>
              <div className="flex gap-2">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-[#a66e38] hover:underline">
                    Xóa tất cả
                  </button>
                )}
                {mobileFilterOpen && (
                  <button onClick={() => setMobileFilterOpen(false)}>
                    <X className="size-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl border border-amber-100/80 p-4">
              <h3 className="filter-group-title text-[#8f5a28]">Danh mục</h3>
              
              <Link
                href="/products"
                className={`block py-1.5 text-sm transition-colors ${
                  !category ? "text-[#a66e38] font-bold" : "text-gray-600 hover:text-[#a66e38]"
                }`}
              >
                {!category && <span className="mr-1">›</span>} Tất cả sản phẩm
              </Link>

              {categories.length > 0 ? (
                categories
                  .filter(c => !c.parentId)
                  .map((parent) => {
                    const isParentActive = category === parent.slug;
                    const subCats = categories.filter(c => c.parentId === parent.id);
                    const isSubActive = subCats.some(sub => sub.slug === category);
                    const isOpen = isParentActive || isSubActive;

                    return (
                      <div key={parent.id} className="my-0.5">
                        <Link
                          href={`/products?category=${parent.slug}`}
                          className={`block py-1.5 text-sm transition-colors font-medium ${
                            isParentActive
                              ? "text-[#a66e38] font-bold"
                              : "text-gray-700 hover:text-[#a66e38]"
                          }`}
                        >
                          {isParentActive && <span className="mr-1">›</span>}
                          {parent.name}
                        </Link>

                        {/* Subcategories drilldown */}
                        {subCats.length > 0 && isOpen && (
                          <div className="pl-3 space-y-1 my-1 border-l-2 border-amber-200">
                            {subCats.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${sub.slug}`}
                                className={`block py-1 text-xs transition-colors ${
                                  category === sub.slug
                                    ? "text-[#a66e38] font-semibold"
                                    : "text-gray-500 hover:text-[#a66e38]"
                                }`}
                              >
                                {category === sub.slug && <span className="mr-1">›</span>}
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                /* Static Fallback */
                [
                  { label: "Điện thoại & Tablet", slug: "dien-thoai-may-tinh-bang" },
                  { label: "Laptop & Máy tính", slug: "laptop-may-tinh" },
                  { label: "Âm thanh", slug: "thiet-bi-so-am-thanh" },
                  { label: "Gia dụng", slug: "dien-lanh-gia-dung" },
                  { label: "Thời trang Nam", slug: "thoi-trang-nam" },
                  { label: "Thời trang Nữ", slug: "thoi-trang-nu" },
                  { label: "Mỹ phẩm", slug: "my-pham-cham-soc-ca-nhan" },
                  { label: "Nhà cửa", slug: "nha-cua-doi-song" },
                ].map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className={`block py-1.5 text-sm transition-colors ${
                      category === cat.slug
                        ? "text-[#a66e38] font-semibold"
                        : "text-gray-600 hover:text-[#a66e38]"
                    }`}
                  >
                    {category === cat.slug && <span className="mr-1">›</span>}
                    {cat.label}
                  </Link>
                ))
              )}
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-xl border border-amber-100/80 p-4">
              <h3 className="filter-group-title text-[#8f5a28]">Khoảng giá</h3>
              <div className="space-y-1">
                {PRICE_RANGES.map((range) => {
                  const isSelected = selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max;
                  return (
                    <button
                      key={range.label}
                      onClick={() => {
                        setSelectedPriceRange(isSelected ? null : range);
                        setPageNum(0);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded text-sm transition-colors ${
                        isSelected ? "bg-[#f7ede0] text-[#8f5a28] font-semibold" : "text-gray-600 hover:bg-[#fdf9f5]"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-xl border border-amber-100/80 p-4">
              <h3 className="filter-group-title text-[#8f5a28]">Đánh giá</h3>
              <div className="space-y-1">
                {[5, 4, 3].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => { setSelectedRating(selectedRating === stars ? null : stars); setPageNum(0); }}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-sm transition-colors ${
                      selectedRating === stars ? "bg-[#f7ede0] text-[#8f5a28] font-semibold" : "text-gray-600 hover:bg-[#fdf9f5]"
                    }`}
                  >
                    <div className="flex">
                      {Array.from({ length: stars }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span>{stars} sao trở lên</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div className="bg-white rounded-xl border border-amber-100/80 p-4">
                <h3 className="filter-group-title text-[#8f5a28]">Thương hiệu</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={selectedBrand === brand.id}
                        onChange={() => {
                          setSelectedBrand(selectedBrand === brand.id ? "" : brand.id);
                          setPageNum(0);
                        }}
                        className="rounded border-amber-300 text-[#a66e38] focus:ring-[#a66e38]"
                      />
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar: sort + filter toggle */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-amber-200 rounded-lg text-sm text-gray-700 hover:border-[#a66e38] hover:text-[#a66e38] transition-colors bg-white"
            >
              <Filter className="size-4" /> Lọc
            </button>

            <span className="text-sm text-gray-500 mr-1">Sắp xếp:</span>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    sort === opt.value
                      ? "bg-[#a66e38] text-white border-[#a66e38]"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#a66e38] hover:text-[#a66e38]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="ml-auto text-sm text-gray-500">
              {total} sản phẩm
            </span>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-amber-100/60">
                  <div className="skeleton aspect-square" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-3 rounded w-full" />
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-4 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 text-sm mb-4">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={clearFilters} className="text-sm text-[#a66e38] hover:underline font-semibold">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  pending={pending as boolean}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={pageNum === 0}
                onClick={() => setPageNum(p => p - 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-[#a66e38] hover:text-[#a66e38] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                ← Trước
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const page = i;
                return (
                  <button
                    key={page}
                    onClick={() => setPageNum(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? "bg-[#a66e38] text-white"
                        : "border border-gray-200 text-gray-700 hover:border-[#a66e38] hover:text-[#a66e38] bg-white"
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              <button
                disabled={pageNum >= totalPages - 1}
                onClick={() => setPageNum(p => p + 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-[#a66e38] hover:text-[#a66e38] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
              >
                Tiếp →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-gray-400">Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
