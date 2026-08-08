"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { cartApi } from "@/lib/api";
import { formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";

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
      const msg =
        err instanceof Error ? err.message : "Không thể xóa sản phẩm";
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
      const msg =
        err instanceof Error ? err.message : "Không thể xóa giỏ hàng";
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

  if (!loading && items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 text-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Giỏ hàng trống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và thêm
              một số sản phẩm nhé!
            </p>
            <Button onClick={() => router.push("/")}>Xem sản phẩm</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Giỏ hàng
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {totalQty} sản phẩm
            </p>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Xóa tất cả
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Danh sách sản phẩm */}
          <div className="flex-1 space-y-3">
            {items.map((item) => {
              const product = getProduct(item.productId);
              const pendingThis = updating === item.productId;
              return (
                <Card key={item.productId}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Ảnh sản phẩm */}
                    <div className="hidden shrink-0 sm:block">
                      {product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name ?? ""}
                          className="size-20 rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex size-20 items-center justify-center rounded-md bg-muted">
                          <span className="text-2xl font-bold text-muted-foreground/40">
                            {product?.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 min-w-0">
                      {product ? (
                        <>
                          <CardTitle className="line-clamp-1 text-base">
                            {product.name}
                          </CardTitle>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            / SKU: {product.sku}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-primary">
                            {formatVND(product.price)}
                          </p>
                        </>
                      ) : (
                        <>
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="mt-1 h-3 w-1/2" />
                          <Skeleton className="mt-1 h-4 w-24" />
                        </>
                      )}
                    </div>

                    {/* Tăng/giảm số lượng + xóa */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center rounded-md border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          disabled={pendingThis || item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          aria-label="Giảm số lượng"
                        >
                          &ndash;
                        </Button>
                        <span className="w-8 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          disabled={pendingThis}
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          aria-label="Tăng số lượng"
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs text-destructive"
                        disabled={pendingThis}
                        onClick={() => removeItem(item.productId)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tóm tắt đơn hàng */}
          <Card className="w-full shrink-0 lg:w-80">
            <CardHeader>
              <CardTitle className="text-base">Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{formatVND(totalVND)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-medium text-muted-foreground">
                  Tính khi thanh toán
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-bold text-primary">
                  {formatVND(totalVND)}
                </span>
              </div>
              <Button
                className="mt-2 w-full"
                disabled={updating !== null}
                onClick={() => router.push("/checkout")}
              >
                Tiến hành thanh toán
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/")}>Tiếp tục mua sắm</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
