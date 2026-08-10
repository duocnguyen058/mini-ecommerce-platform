"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddressManager } from "@/components/address-manager";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { useAddresses, type StoredAddress } from "@/lib/use-addresses";
import { orderApi, cartApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { OrderResponse } from "@/lib/types";
import { ORDER_STATUS_LABEL } from "@/lib/order-status-labels";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh, clearCartState } = useCart();
  const { products, loading: productsLoading } = useCartProducts(cart);
  const { defaultAddress } = useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<StoredAddress | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress, selectedAddress]);

  if (!authLoading && !user) return null;

  const items = cart?.items ?? [];
  const totalAmount = items.reduce((sum, it) => {
    const p = products[it.productId];
    return sum + (p ? p.price * it.quantity : 0);
  }, 0);

  const activeShippingAddr = selectedAddress ?? defaultAddress;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.warning({
        title: "Giỏ hàng trống",
        description: "Không có sản phẩm để thanh toán.",
      });
      return;
    }

    if (!activeShippingAddr) {
      toast.error({
        title: "Thiếu địa chỉ giao hàng",
        description: "Vui lòng chọn hoặc thêm địa chỉ giao hàng trước khi đặt hàng.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const body = { shippingAddress: activeShippingAddr, currency: "VND" };
      const order = (await orderApi.checkout(
        body,
        idempotencyKey
      )) as OrderResponse;

      try {
        await cartApi.clear();
      } catch {
        // BE already cleared cart
      }
      clearCartState();

      toast.success({
        title: "Đặt hàng thành công!",
        description: `Mã đơn hàng #${order.id.slice(
          0,
          8
        )} — Trạng thái: ${ORDER_STATUS_LABEL[order.status] ?? order.status}`,
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể đặt hàng";
      toast.error({ title: "Đặt hàng thất bại", description: msg });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const loading = cartLoading || productsLoading;

  if (loading && cart !== null) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 space-y-6">
        <Breadcrumb items={[{ label: "Thanh toán" }]} />
        <Card className="p-12 text-center border-dashed rounded-2xl">
          <ShoppingBag className="mx-auto size-12 text-muted-foreground/40 mb-3" />
          <h2 className="text-xl font-bold">Giỏ hàng của bạn đang trống</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vui lòng chọn sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.
          </p>
          <Button
            className="mt-6 font-bold"
            onClick={() => router.push("/")}
          >
            Quay lại mua sắm
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Giỏ hàng", href: "/cart" },
          { label: "Thanh toán" },
        ]}
      />

      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
        Thanh toán đơn hàng
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Address Manager */}
        <div className="lg:col-span-7 space-y-6">
          <AddressManager
            selectedAddressId={activeShippingAddr?.id}
            onSelectAddress={(addr) => setSelectedAddress(addr)}
          />

          <Card className="rounded-xl border shadow-xs bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-green-600" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Thanh toán khi nhận hàng (COD). Quý khách kiểm tra hàng trước khi thanh toán cho nhân viên giao hàng.
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <Card className="rounded-xl border shadow-xs sticky top-20">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-bold">Sản phẩm thanh toán ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-border/40">
                {items.map((item) => {
                  const p = products[item.productId];
                  return (
                    <div key={item.productId} className="flex justify-between gap-3 text-sm pt-3 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {p?.name ?? "Đang tải..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums shrink-0">
                        {p ? formatVND(p.price * item.quantity) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-semibold tabular-nums">{formatVND(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-semibold text-green-600">Miễn phí</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-base">Tổng cộng</span>
                  <span className="text-xl font-extrabold text-primary tabular-nums">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold h-12 shadow-md gap-2"
                disabled={submitting}
              >
                {submitting ? "Đang xử lý đơn..." : "Xác nhận đặt hàng"}
                <ArrowRight className="size-4" />
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                Nhấn &quot;Xác nhận đặt hàng&quot; đồng nghĩa với việc bạn đồng ý tuân thủ các điều khoản dịch vụ của Mini E-Commerce.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
