"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  Zap, TrendingUp, Star, ChevronRight, Package,
  Smartphone, Monitor, Headphones, Home, Shirt, ShoppingBag, Sparkles, Dumbbell
} from "lucide-react";
import { productApi, formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { RecentlyViewed } from "@/components/recently-viewed";
import { QuickViewModal } from "@/components/quick-view-modal";

const CATEGORIES = [
  { label: "Điện thoại & Tablet", slug: "dien-thoai-may-tinh-bang", icon: Smartphone, color: "from-amber-100 to-orange-100", iconColor: "text-[#a66e38]" },
  { label: "Laptop & Máy tính", slug: "laptop-may-tinh", icon: Monitor, color: "from-amber-100 to-yellow-100", iconColor: "text-[#8f5a28]" },
  { label: "Âm thanh & Phụ kiện", slug: "thiet-bi-so-am-thanh", icon: Headphones, color: "from-stone-100 to-amber-100", iconColor: "text-[#74451b]" },
  { label: "Điện lạnh & Gia dụng", slug: "dien-lanh-gia-dung", icon: Home, color: "from-orange-100 to-amber-100", iconColor: "text-[#a66e38]" },
  { label: "Thời trang Nam", slug: "thoi-trang-nam", icon: Shirt, color: "from-amber-50 to-stone-100", iconColor: "text-[#583313]" },
  { label: "Thời trang Nữ", slug: "thoi-trang-nu", icon: ShoppingBag, color: "from-rose-100 to-amber-100", iconColor: "text-[#8f5a28]" },
  { label: "Mỹ phẩm & Làm đẹp", slug: "my-pham-cham-soc-ca-nhan", icon: Sparkles, color: "from-amber-100 to-yellow-100", iconColor: "text-[#a66e38]" },
  { label: "Nhà cửa & Đời sống", slug: "nha-cua-doi-song", icon: Home, color: "from-stone-100 to-orange-100", iconColor: "text-[#74451b]" },
];

const TRUST_BADGES = [
  { icon: "🚚", title: "Giao hàng 2h", desc: "Giao trong 2 giờ nội thành" },
  { icon: "🔄", title: "Đổi trả 7 ngày", desc: "30 ngày đổi trả miễn phí" },
  { icon: "✅", title: "Chính hãng 100%", desc: "Cam kết 100% chính hãng" },
  { icon: "🛡️", title: "Hỗ trợ 24/7", desc: "Luôn bên bạn khi cần" },
];

// Flash Sale countdown
function FlashSaleTimer() {
  const [time, setTime] = useState({ h: 5, m: 32, s: 47 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
        <span key={i} className="flash-sale-timer">{val}</span>
      )).reduce((acc, el, i) =>
        i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-amber-900 font-bold">:</span>, el], [] as React.ReactNode[]
      )}
    </div>
  );
}

function ProductSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
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
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart, pending } = useAddToCart();
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, brands: 0 });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [hotData, newData, allProductsData, brandsData] = await Promise.all([
        productApi.list({ page: 0, size: 10, sort: "soldCount,desc" }).catch(() => ({ content: [] as Product[], page: { totalElements: 0, totalPages: 0 } })),
        productApi.list({ page: 0, size: 10, sort: "createdAt,desc" }).catch(() => ({ content: [] as Product[], page: { totalElements: 0, totalPages: 0 } })),
        productApi.list({ page: 0, size: 1 }).catch(() => null),
        import("@/lib/api").then(m => m.brandApi.list()).catch(() => []),
      ]);
      setHotProducts(hotData.content ?? []);
      setNewProducts(newData.content ?? []);
      setStats({
        products: allProductsData?.page?.totalElements ?? hotData.content?.length ?? 24,
        brands: Array.isArray(brandsData) && brandsData.length > 0 ? brandsData.length : 6,
      });
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="relative overflow-hidden brand-header">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
              <Zap className="size-4 text-amber-200" />
              <span className="text-white text-sm font-medium">Ưu đãi hôm nay</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Mua sắm thông minh<br />
              <span className="text-amber-200">Giá tốt nhất!</span>
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-6">
              Hàng chính hãng từ các thương hiệu hàng đầu · Giao nhanh 2h · Đảm bảo chất lượng
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="/products" className="btn-brand bg-white text-[#8f5a28] hover:bg-[#fdf9f5] shadow-lg font-bold">
                Mua ngay
              </Link>
              <Link href="/products?sort=soldCount,desc" className="px-5 py-2.5 border-2 border-white/60 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm">
                Bán chạy nhất
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 hidden md:flex gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sản phẩm", value: stats.products > 0 ? `${stats.products}+` : "24+" },
                { label: "Thương hiệu", value: stats.brands > 0 ? `${stats.brands}+` : "6+" },
                { label: "Danh mục", value: `${CATEGORIES.length}` },
                { label: "Chính hãng", value: "100%" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
                  <div className="text-2xl font-extrabold text-white">{value}</div>
                  <div className="text-white/85 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 mt-8 mb-4">
        <div className="trust-badge-grid">
          {TRUST_BADGES.map((badge, i) => (
            <div key={i} className="trust-badge">
              <div className="trust-badge-icon">{badge.icon}</div>
              <div>
                <p className="trust-badge-title">{badge.title}</p>
                <p className="trust-badge-sub">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        {/* Categories Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Danh Mục Nổi Bật</h2>
            <Link href="/products" className="text-sm text-[#a66e38] hover:text-[#8f5a28] hover:underline flex items-center gap-1 font-semibold">
              Xem tất cả <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="cat-pill group"
                >
                  <div className={`cat-pill-icon bg-gradient-to-br ${cat.color} group-hover:scale-105 transition-transform`}>
                    <Icon className={`size-6 ${cat.iconColor}`} />
                  </div>
                  <span className="text-xs text-gray-700 font-medium leading-tight text-center line-clamp-2">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Flash Sale Section */}
        <section className="bg-white rounded-2xl border border-amber-100/80 shadow-xs overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-amber-100/60 bg-[#fdf9f5]/50">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-[#a66e38] fill-[#a66e38]" />
              <h2 className="text-lg font-extrabold text-[#a66e38] uppercase tracking-wide">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-500">Kết thúc sau:</span>
              <FlashSaleTimer />
            </div>
            <Link href="/products?sort=discountPercent,desc" className="ml-auto text-sm text-[#a66e38] hover:text-[#8f5a28] hover:underline flex items-center gap-1 font-semibold">
              Xem tất cả <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <ProductSectionSkeleton />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {hotProducts.slice(0, 5).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    pending={pending as boolean}
                    onQuickView={setQuickViewId}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Hot Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="size-5 text-[#a66e38]" /> Sản Phẩm Bán Chạy
            </h2>
            <Link href="/products?sort=soldCount,desc" className="text-sm text-[#a66e38] hover:text-[#8f5a28] hover:underline flex items-center gap-1 font-semibold">
              Xem tất cả <ChevronRight className="size-4" />
            </Link>
          </div>
          {loading ? (
            <ProductSectionSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {hotProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  pending={pending as boolean}
                  onQuickView={setQuickViewId}
                />
              ))}
            </div>
          )}
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Star className="size-5 text-[#a66e38] fill-[#a66e38]" /> Hàng Mới Về
            </h2>
            <Link href="/products?sort=createdAt,desc" className="text-sm text-[#a66e38] hover:text-[#8f5a28] hover:underline flex items-center gap-1 font-semibold">
              Xem tất cả <ChevronRight className="size-4" />
            </Link>
          </div>
          {loading ? (
            <ProductSectionSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {newProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  pending={pending as boolean}
                  onQuickView={setQuickViewId}
                />
              ))}
            </div>
          )}
        </section>

        <RecentlyViewed onQuickView={setQuickViewId} />
      </div>
      
      <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
