"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, ShoppingCart, Heart, Share2, Shield, Truck,
  RotateCcw, ChevronLeft, ChevronRight, MessageCircle,
  Package, ThumbsUp, Check, AlertTriangle, Info
} from "lucide-react";
import { productApi, formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/types";
import { useRecentlyViewed, RecentlyViewed } from "@/components/recently-viewed";
import { StickyAddToCart } from "@/components/sticky-add-to-cart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice: number;
  stockQuantity: number;
  attributesJson: string;
  imageUrl: string;
}

interface MediaItem {
  id: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  altText: string;
  sortOrder: number;
}

interface Spec {
  groupName: string;
  specKey: string;
  specValue: string;
}

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  isVerifiedPurchase: boolean;
  likesCount: number;
  createdAt: string;
}

interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  starBreakdown: Record<string, number>;
}

interface Comment {
  id: string;
  userName: string;
  content: string;
  isAdmin: boolean;
  likesCount: number;
  createdAt: string;
}

function StockBadge({ qty }: { qty?: number }) {
  if (qty === undefined) return null;
  if (qty === 0) return <span className="badge-out flex items-center gap-1"><AlertTriangle className="size-3" />Hết hàng</span>;
  if (qty <= 5) return <span className="badge-low flex items-center gap-1"><AlertTriangle className="size-3" />Chỉ còn {qty} sản phẩm</span>;
  return <span className="text-green-600 text-sm font-medium flex items-center gap-1"><Check className="size-4" />Còn {qty} sản phẩm</span>;
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "size-3" : size === "lg" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart, pending } = useAddToCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<(Product & Record<string, any>) | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [brand, setBrand] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "reviews" | "qa">("specs");
  const [newComment, setNewComment] = useState("");

  const liked = isWishlisted(id);
  const { addId, removeId } = useRecentlyViewed();
  const priceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [activeImg, product?.imageUrl]);

  useEffect(() => {
    async function load() {
      try {
        const p = await productApi.get(id);
        setProduct(p as any);
        addId(id);

        const [mediaRes, variantsRes, specsRes, reviewsRes, reviewSummaryRes, commentsRes, brandsRes, invRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/v1/products/${id}/media`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/v1/products/${id}/variants`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/v1/products/${id}/specs`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/v1/products/${id}/reviews?size=10`).then(r => r.ok ? r.json() : { content: [] }),
          fetch(`${API_BASE}/api/v1/products/${id}/reviews/summary`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/api/v1/products/${id}/comments?size=10`).then(r => r.ok ? r.json() : { content: [] }),
          fetch(`${API_BASE}/api/v1/brands`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/inventory/${id}`).then(r => r.ok ? r.json() : null),
        ]);

        if (mediaRes.status === "fulfilled") setMedia(Array.isArray(mediaRes.value) ? mediaRes.value : []);
        if (variantsRes.status === "fulfilled") setVariants(Array.isArray(variantsRes.value) ? variantsRes.value : []);
        if (specsRes.status === "fulfilled") setSpecs(Array.isArray(specsRes.value) ? specsRes.value : []);
        if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value?.content ?? []);
        if (reviewSummaryRes.status === "fulfilled") setReviewSummary(reviewSummaryRes.value);
        if (commentsRes.status === "fulfilled") setComments(commentsRes.value?.content ?? []);
        if (invRes.status === "fulfilled" && invRes.value) setInventory(invRes.value);

        if (brandsRes.status === "fulfilled" && Array.isArray(brandsRes.value)) {
          const allBrands: any[] = brandsRes.value;
          const matched = allBrands.find(b =>
            (p.brandId && b.id === p.brandId) ||
            p.name.toLowerCase().includes(b.name.toLowerCase())
          );
          if (matched) setBrand(matched);
        }
      } catch (err) {
        if ((err as { status?: number }).status === 404) {
          removeId(id);
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, addId, removeId]);


  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 rounded w-3/4" />
            <div className="skeleton h-4 rounded w-1/2" />
            <div className="skeleton h-12 rounded w-1/3" />
            <div className="skeleton h-4 rounded" />
            <div className="skeleton h-4 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-6xl">😔</span>
        <h1 className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm</h1>
        <Link href="/products" className="text-blue-600 hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice;
  const discountPct = product.discountPercent ?? 0;
  const allImages = media.length > 0
    ? media.filter(m => m.mediaType === "IMAGE").map(m => m.mediaUrl)
    : [product.imageUrl].filter(Boolean);

  // Group specs by groupName
  const specGroups = specs.reduce((acc, spec) => {
    if (!acc[spec.groupName]) acc[spec.groupName] = [];
    acc[spec.groupName].push(spec);
    return acc;
  }, {} as Record<string, Spec[]>);

  async function handleSubmitComment() {
    if (!newComment.trim()) return;
    try {
      await fetch(`${API_BASE}/api/v1/products/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: "Người dùng", content: newComment }),
      });
      setNewComment("");
      // Reload comments
      const res = await fetch(`${API_BASE}/api/v1/products/${id}/comments?size=10`);
      const data = await res.json();
      setComments(data?.content ?? []);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <ChevronRight className="size-3" />
          <Link href="/products" className="hover:text-blue-600">Sản phẩm</Link>
          {product.category && (
            <>
              <ChevronRight className="size-3" />
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-600">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="size-3" />
          <span className="text-gray-700 truncate max-w-48">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Image Gallery */}
            <div className="p-6 border-r border-gray-100">
              {/* Main Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 group">
                {allImages[activeImg] && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={allImages[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-7xl font-bold text-gray-300">{product.name?.[0]?.toUpperCase() ?? "?"}</span>
                  </div>
                )}

                {/* Nav arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      onClick={() => setActiveImg(i => Math.min(allImages.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </>
                )}

                {discountPct > 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="badge-sale text-sm px-2 py-1">-{discountPct}%</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImg === i ? "border-blue-600" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img ?? undefined} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {/* Video thumbnail */}
                  {product.videoUrl && (
                    <a
                      href={product.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 bg-gray-100 flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-500 font-medium">▶ Video</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="p-6 space-y-4">
              {/* Brand */}
              {(brand || product.brandId) && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/products?brandId=${brand?.id || product.brandId}`}
                    className="text-xs text-[#a66e38] font-semibold uppercase tracking-wider hover:underline"
                  >
                    Thương hiệu: {brand?.name || "Chính hãng"}
                  </Link>
                  {brand?.country && (
                    <span className="text-xs text-gray-400">· Xuất xứ: {brand.country}</span>
                  )}
                </div>
              )}

              {/* Name */}
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              {/* Rating + Sold */}
              <div className="flex items-center gap-3 flex-wrap">
                {reviewSummary && reviewSummary.totalReviews > 0 ? (
                  <>
                    <span className="text-amber-500 font-bold text-sm">{reviewSummary.averageRating.toFixed(1)}</span>
                    <StarDisplay rating={reviewSummary.averageRating} />
                    <span className="text-sm text-gray-500">
                      ({reviewSummary.totalReviews} đánh giá)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Chưa có đánh giá</span>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">
                  {(() => {
                    const realSold = inventory?.soldQuantity ?? product.soldCount ?? 0;
                    return realSold > 0 ? `Đã bán ${realSold.toLocaleString("vi-VN")}` : "Đã bán 0";
                  })()}
                </span>
              </div>

              {/* Price */}
              <div ref={priceRef} className="bg-[#fdf9f5] border border-amber-100/60 rounded-xl p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#a66e38]">
                    {formatVND(displayPrice)}
                  </span>
                  {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                     <span className="text-lg text-gray-400 line-through">
                      {formatVND(displayOriginalPrice)}
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="badge-sale text-sm px-2 py-1">-{discountPct}%</span>
                  )}
                </div>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Phân loại:</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      let attrs: Record<string, string> = {};
                      try { attrs = JSON.parse(v.attributesJson || "{}"); } catch {}
                      const label = Object.values(attrs).join(" / ") || v.name;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            selectedVariant?.id === v.id
                              ? "border-[#a66e38] bg-[#f7ede0] text-[#a66e38] font-bold"
                              : "border-gray-200 text-gray-700 hover:border-amber-300"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
                <div className="qty-stepper">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <input readOnly value={qty} />
                  <button onClick={() => setQty(q => q + 1)}>+</button>
                </div>
                <StockBadge qty={inventory?.availableQuantity ?? product.stockQuantity ?? 0} />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  disabled={!!pending}
                  onClick={() => addToCart(product.id, qty)}
                  className="flex-1 py-3 rounded-xl border-2 border-[#a66e38] text-[#a66e38] font-semibold hover:bg-[#f7ede0] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="size-5" />
                  Thêm vào giỏ
                </button>
                <button
                  className="btn-brand flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                  onClick={() => { addToCart(product.id, qty); router.push("/cart"); }}
                >
                  Mua ngay
                </button>
                <button
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors ${
                    liked ? "border-[#a66e38] bg-[#f7ede0] text-[#a66e38]" : "border-gray-200 text-gray-400 hover:border-[#a66e38] hover:text-[#a66e38]"
                  }`}
                >
                  <Heart className={`size-5 ${liked ? "fill-[#a66e38]" : ""}`} />
                </button>
              </div>


              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[
                  { icon: Shield, text: product.warrantyPolicy ?? "Bảo hành 12 tháng" },
                  { icon: Truck, text: "Giao hàng nhanh 2h" },
                  { icon: RotateCcw, text: "Đổi trả 30 ngày" },
                  { icon: Package, text: "Hàng chính hãng" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon className="size-4 text-green-500 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Short info */}
              <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
                {product.sku && <div>SKU: <span className="font-mono">{product.sku}</span></div>}
                <div>Xuất xứ: {brand?.country || product.originCountry || "Chính hãng"}</div>
                {product.weightG && <div>Trọng lượng: {product.weightG}g</div>}
              </div>

            </div>
          </div>
        </div>

        {/* Tabs: Specs / Reviews / Q&A */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex border-b border-gray-100">
            {[
              { key: "specs", label: "Thông số kỹ thuật" },
              { key: "reviews", label: `Đánh giá (${reviewSummary?.totalReviews ?? 0})` },
              { key: "qa", label: `Hỏi đáp (${comments.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Description tab (always show) */}
            {product.description && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Info className="size-4" /> Mô tả sản phẩm
                </h3>
                {/<[a-z][\s\S]*>/i.test(product.description) ? (
                  <div
                    className="text-sm text-gray-600 leading-relaxed space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-gray-600 [&_strong]:font-semibold [&_strong]:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === "specs" && (
              <div className="space-y-4">
                {Object.keys(specGroups).length === 0 ? (
                  <p className="text-gray-400 text-sm">Chưa có thông số kỹ thuật.</p>
                ) : (
                  Object.entries(specGroups).map(([group, groupSpecs]) => (
                    <div key={group}>
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">{group}</h4>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        {groupSpecs.map((spec, i) => {
                          let displayVal = spec.specValue;
                          if (spec.specKey.toLowerCase().includes("xuất xứ") && brand?.country) {
                            displayVal = brand.country;
                          } else if (spec.specKey.toLowerCase().includes("thương hiệu") && brand?.name) {
                            displayVal = brand.name;
                          }
                          return (
                            <div key={i} className={`flex ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                              <div className="w-40 md:w-52 flex-shrink-0 px-4 py-2.5 text-sm text-gray-500 font-medium border-r border-gray-100">
                                {spec.specKey}
                              </div>
                              <div className="flex-1 px-4 py-2.5 text-sm text-gray-800">
                                {displayVal}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Rating Summary */}
                {reviewSummary && (
                  <div className="flex gap-8 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold text-amber-500">{reviewSummary.averageRating}</div>
                      <StarDisplay rating={reviewSummary.averageRating} size="lg" />
                      <div className="text-xs text-gray-400 mt-1">{reviewSummary.totalReviews} đánh giá</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviewSummary.starBreakdown[String(stars)] ?? 0;
                        const pct = reviewSummary.totalReviews > 0 ? (count / reviewSummary.totalReviews) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-8">{stars} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review List */}
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              {review.userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-800">{review.userName}</span>
                              {review.isVerifiedPurchase && (
                                <span className="ml-2 text-xs text-green-500 flex items-center gap-0.5 inline-flex">
                                  <Check className="size-3" /> Đã mua hàng
                                </span>
                              )}
                            </div>
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                          <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <ThumbsUp className="size-3" /> Hữu ích ({review.likesCount})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === "qa" && (
              <div className="space-y-4">
                {/* Submit comment */}
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Đặt câu hỏi về sản phẩm..."
                    rows={2}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm">Chưa có câu hỏi nào.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((cmt) => (
                      <div key={cmt.id} className={`rounded-xl p-4 ${cmt.isAdmin ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            cmt.isAdmin ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"
                          }`}>
                            {cmt.isAdmin ? "A" : cmt.userName?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {cmt.isAdmin ? "Hỗ trợ ShopNow" : cmt.userName}
                          </span>
                          {cmt.isAdmin && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Admin</span>}
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(cmt.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{cmt.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <RecentlyViewed excludeId={id} />
      </div>
      {product && <StickyAddToCart product={product} targetRef={priceRef} />}
    </div>
  );
}
