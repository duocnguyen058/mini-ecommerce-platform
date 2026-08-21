"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Trash2, ArrowRight, Package, ArrowLeft } from "lucide-react";

import { useWishlist } from "@/lib/use-wishlist";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { productApi, formatVND } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, loaded } = useWishlist();
  const { addToCart, pending: cartLoading } = useAddToCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!loaded) return;

    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      wishlist.map((id) =>
        productApi.getById(id).then(p => ({ id, product: p })).catch(() => ({ id, product: null }))
      )
    )
      .then((results) => {
        const valid = results.filter((r): r is { id: string; product: Product } => r.product !== null).map(r => r.product);
        const stale = results.filter(r => r.product === null).map(r => r.id);
        stale.forEach(id => toggleWishlist(id));
        setProducts(valid);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [wishlist, loaded]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 mb-1"
            >
              <ArrowLeft className="size-3.5" />
              Tiếp tục mua sắm
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Heart className="size-6 text-red-500 fill-red-500" />
            Danh sách yêu thích
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Các sản phẩm bạn đã lưu để xem lại hoặc mua sau ({products.length} sản phẩm)
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-xl border bg-white p-4 space-y-3 animate-pulse">
              <div className="h-48 rounded-lg bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-8 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
            <Heart className="size-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Danh sách yêu thích đang trống
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Bạn chưa lưu sản phẩm nào. Hãy bấm vào biểu tượng trái tim ở các sản phẩm bạn yêu thích để lưu vào đây nhé!
          </p>
          <Link href="/products">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              Khám phá sản phẩm ngay
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = hasDiscount
              ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
              >
                <div>
                  {/* Image container */}
                  <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
                    <Link href={`/products/${product.id}`} className="relative block h-full w-full">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <Package className="size-12 stroke-1" />
                        </div>
                      )}
                    </Link>

                    {/* Discount badge */}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        -{discountPercent}%
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-gray-400 hover:text-red-600 hover:bg-white shadow-sm transition-colors"
                      title="Xóa khỏi yêu thích"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Product Category & Brand */}
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{product.category?.name ?? "Sản phẩm"}</span>
                    {product.stockQuantity !== undefined && (
                      <span
                        className={
                          product.stockQuantity > 0
                            ? "text-emerald-600 font-medium"
                            : "text-red-500 font-medium"
                        }
                      >
                        {product.stockQuantity > 0 ? `Còn ${product.stockQuantity}` : "Hết hàng"}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Link href={`/products/${product.id}`} className="block">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-bold text-red-600">
                      {formatVND(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatVND(product.originalPrice!)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button
                    onClick={() => addToCart(product.id, 1, { productName: product.name, productImage: product.imageUrl ?? undefined })}
                    disabled={cartLoading || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9"
                  >
                    <ShoppingCart className="size-3.5" />
                    Thêm giỏ hàng
                  </Button>

                  <Link href={`/products/${product.id}`}>
                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
