"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ShoppingCart, AlertTriangle, ChevronRight, Check } from "lucide-react";
import { productApi, variantApi, formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import type { Product, ProductVariant } from "@/lib/types";

interface QuickViewModalProps {
  productId: string | null;
  onClose: () => void;
}

export function QuickViewModal({ productId, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [inventory, setInventory] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const { addToCart, pending } = useAddToCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setProduct(null);
    setVariants([]);
    setInventory(null);
    setSelectedVariant(null);
    setQty(1);
    setImgError(false);

    Promise.allSettled([
      productApi.getById(productId),
      variantApi.list(productId),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080"}/api/inventory/${productId}`).then(r => r.ok ? r.json() : null),
    ]).then(([pRes, vRes, iRes]) => {
      if (pRes.status === "fulfilled") setProduct(pRes.value);
      if (vRes.status === "fulfilled") setVariants(vRes.value);
      if (iRes.status === "fulfilled" && iRes.value) setInventory(iRes.value);
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (productId) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [productId, onClose]);

  useEffect(() => {
    if (productId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [productId]);

  if (!productId) return null;

  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const displayOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product?.originalPrice;
  const discountPct = product?.discountPercent ?? 0;
  
  const availableQty = selectedVariant?.stockQuantity ?? inventory?.availableQuantity ?? product?.stockQuantity ?? 0;
  const maxQty = Math.min(availableQty, 99);

  async function handleAddToCart() {
    if (!product || pending || justAdded) return;
    try {
      await addToCart(product.id, qty);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 1000);
    } catch {}
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[1000] backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden pointer-events-auto transform transition-all duration-300">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="size-5" />
          </button>

          {loading || !product ? (
            <div className="w-full p-8 flex gap-8">
              <div className="w-1/2 aspect-square skeleton rounded-xl" />
              <div className="w-1/2 space-y-4 pt-4">
                <div className="h-8 skeleton w-full rounded" />
                <div className="h-6 skeleton w-1/2 rounded" />
                <div className="h-12 skeleton w-1/3 rounded" />
                <div className="h-4 skeleton w-full rounded mt-8" />
                <div className="h-4 skeleton w-5/6 rounded" />
              </div>
            </div>
          ) : (
            <>
              {/* Image Panel */}
              <div className="w-full md:w-1/2 relative bg-gray-50 p-6 flex flex-col justify-center items-center">
                {discountPct > 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="badge-sale px-2.5 py-1 text-sm shadow-md">-{discountPct}%</span>
                  </div>
                )}
                {product.imageUrl && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full max-h-[60vh] object-contain mix-blend-multiply"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-7xl font-bold text-gray-300">
                    {product.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {product.name}
                </h2>
                
                <div className="flex items-center gap-3 mb-4">
                  {(product.ratingCount ?? 0) > 0 ? (
                    <>
                      <div className="flex items-center text-amber-400">
                        {'★'.repeat(Math.round(product.ratingAvg ?? 0))}
                        <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.ratingAvg ?? 0))}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.ratingCount})</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có đánh giá</span>
                  )}
                  {(product.soldCount ?? 0) > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">Đã bán {(product.soldCount ?? 0).toLocaleString("vi-VN")}</span>
                    </>
                  )}
                </div>

                <div className="flex items-baseline gap-3 mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                  <span className="text-3xl font-extrabold text-blue-600">
                    {formatVND(displayPrice)}
                  </span>
                  {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                    <span className="text-base text-gray-400 line-through">
                      {formatVND(displayOriginalPrice)}
                    </span>
                  )}
                </div>

                {availableQty < 20 && availableQty > 0 && (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium border border-orange-100">
                    <AlertTriangle className="size-4" /> Chỉ còn {availableQty} sản phẩm
                  </div>
                )}
                {availableQty === 0 && (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-100">
                    <AlertTriangle className="size-4" /> Hết hàng
                  </div>
                )}

                {variants.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Phân loại:</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map(v => {
                        let attrs: Record<string, string> = {};
                        try { attrs = JSON.parse(v.attributesJson || "{}"); } catch {}
                        const label = Object.values(attrs).join(" / ") || v.name;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                              selectedVariant?.id === v.id
                                ? "border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600"
                                : "border-gray-200 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6 mt-auto pt-4">
                  <div className="qty-stepper flex-shrink-0">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                    <input readOnly value={qty} />
                    <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>
                  </div>
                  <button
                    disabled={!!pending || justAdded || availableQty === 0}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      justAdded 
                        ? "bg-green-500 text-white border-green-500" 
                        : "btn-brand disabled:opacity-50"
                    }`}
                  >
                    {justAdded ? (
                      <><Check className="size-5" /> Đã thêm</>
                    ) : (
                      <><ShoppingCart className="size-5" /> Thêm vào giỏ</>
                    )}
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <Link 
                    href={`/products/${product.id}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Xem chi tiết sản phẩm <ChevronRight className="size-4 ml-1" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
