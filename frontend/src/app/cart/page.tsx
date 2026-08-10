"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";
import { QuantityInput } from "@/components/quantity-input";
import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { cartApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, refresh } = useCart();
  const { products, loading: productsLoading } = useCartProducts(cart);
  const [updating, setUpdating] = useState<string | null>(null);

  const loading = cartLoading || productsLoading;

  useEffect(() => {
    if (!cartLoading && cart === null) {
      refresh();
    }
  }, [cartLoading, cart, refresh]);

  const getProduct = useCallback(
    (productId: string) => products[productId],
    [products]
  );

  async function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    setUpdating(productId);
    try {
      await cartApi.setQuantity(productId, { quantity });
      await refresh();
      toast.success({ title: "Đã cập nhật số lượng" });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể cập nhật số lượng";
      toast.error({ title: "Thất bại", description: msg });
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(productId: string) {
    setUpdating(productId);
    try {
      await cartApi.removeItem(productId);
      await refresh();
      toast.success({ title: "Đã xóa sản phẩm khỏi giỏ hàng" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể xóa sản phẩm";
      toast.error({ title: "Thất bại", description: msg });
    } finally {
      setUpdating(null);
    }
  }

  async function handleClear() {
    try {
      await cartApi.clear();
      await refresh();
      toast.success({ title: "Đã xóa toàn bộ giỏ hàng" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể xóa giỏ hàng";
      toast.error({ title: "Thất bại", description: msg });
    }
  }

  const items = cart?.items ?? [];
  const totalVND = items.reduce((sum, item) => {
    const p = getProduct(item.productId);
    const price = p?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Giỏ hàng của bạn
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {totalQty} sản phẩm trong giỏ
            </p>
          )}
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            onClick={handleClear}
          >
            <Trash2 className="size-3.5" /> Xóa tất cả
          </Button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="mx-auto max-w-md py-12 text-center space-y-4">
          <Card className="p-8 rounded-2xl border-dashed">
            <CardHeader className="p-0">
              <ShoppingBag className="mx-auto size-12 text-muted-foreground/40 mb-2" />
              <CardTitle className="text-xl font-bold">
                Giỏ hàng của bạn đang trống
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-4">
              <p className="text-sm text-muted-foreground">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Khám phá hàng ngàn sản phẩm ưu đãi ngay hôm nay!
              </p>
              <Button
                size="lg"
                className="w-full font-bold gap-2"
                onClick={() => router.push("/")}
              >
                Mua sắm ngay <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cart Content Layout */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Item List */}
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const product = getProduct(item.productId);
              const pendingThis = updating === item.productId;
              return (
                <Card
                  key={item.productId}
                  className="rounded-xl border hover:border-primary/30 transition-all shadow-xs overflow-hidden"
                >
                  <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                    {/* Image */}
                    <div className="shrink-0">
                      {product?.imageUrl ? (
                        <Link href={`/products/${product.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl}
                            alt={product.name ?? ""}
                            className="size-20 sm:size-24 rounded-lg object-cover border bg-muted"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </Link>
                      ) : (
                        <div className="flex size-20 sm:size-24 items-center justify-center rounded-lg bg-muted border">
                          <span className="text-2xl font-bold text-muted-foreground/40">
                            {product?.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {product ? (
                        <>
                          <Link
                            href={`/products/${product.id}`}
                            className="font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs font-mono text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                          <p className="text-sm font-extrabold text-primary pt-1 tabular-nums">
                            {formatVND(product.price)}
                          </p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      )}
                    </div>

                    {/* Quantity Input + Delete Action */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                      <QuantityInput
                        value={item.quantity}
                        onChange={(val) => updateQuantity(item.productId, val)}
                        disabled={pendingThis}
                        size="sm"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        disabled={pendingThis}
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="size-3.5" /> Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="size-3.5" /> Tiếp tục mua sắm
              </Button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <Card className="w-full shrink-0 lg:w-80 rounded-xl border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-semibold tabular-nums">
                  {formatVND(totalVND)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>

              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="font-bold text-base">Tổng cộng</span>
                <span className="text-xl font-extrabold text-primary tabular-nums">
                  {formatVND(totalVND)}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full font-bold gap-2 shadow-md"
                disabled={updating !== null}
                onClick={() => router.push("/checkout")}
              >
                Tiến hành thanh toán <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => router.push("/")}
              >
                Quay về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
