"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { orderApi, cartApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Address, OrderResponse } from "@/lib/types";
import { ORDER_STATUS_LABEL } from "@/lib/order-status-labels";

const EMPTY_ADDRESS: Address = {
  recipient: "",
  phone: "",
  streetLine: "",
  city: "",
  district: "",
  ward: "",
  country: "VN",
};

const REQUIRED_FIELDS: Array<{ key: keyof Address; label: string }> = [
  { key: "recipient", label: "Người nhận" },
  { key: "phone", label: "Số điện thoại" },
  { key: "streetLine", label: "Số nhà, tên đường" },
  { key: "ward", label: "Phường/Xã" },
  { key: "district", label: "Quận/Huyện" },
  { key: "city", label: "Tỉnh/Thành phố" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh, clearCartState } = useCart();
  const { products, loading: productsLoading } = useCartProducts(cart);

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, user, router]);

  if (!authLoading && !user) return null;

  const items = cart?.items ?? [];
  const totalAmount = items.reduce((sum, it) => {
    const p = products[it.productId];
    return sum + (p ? p.price * it.quantity : 0);
  }, 0);

  function update<K extends keyof Address>(key: K, val: string) {
    setAddress((prev) => ({ ...prev, [key]: val }));
  }

  function validateAddress(): string | null {
    for (const f of REQUIRED_FIELDS) {
      const v = (address[f.key] ?? "").trim();
      if (!v) {
        return `${f.label} không được để trống`;
      }
    }
    if (!/^[0-9+\-\s()]+$/.test((address.phone ?? "").trim())) {
      return "Số điện thoại không hợp lệ";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.warning({ title: "Giỏ trống", description: "Không có sản phẩm để thanh toán." });
      return;
    }
    const validationError = validateAddress();
    if (validationError) {
      toast.error({ title: "Địa chỉ không hợp lệ", description: validationError });
      return;
    }
    setSubmitting(true);
    try {
      const body = { shippingAddress: address, currency: "VND" };
      const order = (await orderApi.checkout(body, idempotencyKey)) as OrderResponse;

      try {
        await cartApi.clear();
      } catch {
        // BE already cleared
      }
      clearCartState();

      toast.success({
        title: "Đặt hàng thành công",
        description: `Đơn #${order.id.slice(0, 8)} — trạng thái: ${ORDER_STATUS_LABEL[order.status] ?? order.status}`,
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
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">Thanh toán</h1>
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/")}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Địa chỉ giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Người nhận <span className="text-destructive">*</span></Label>
              <Input id="recipient" value={address.recipient} onChange={(e) => update("recipient", e.target.value)} disabled={submitting} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại <span className="text-destructive">*</span></Label>
              <Input id="phone" type="tel" value={address.phone} onChange={(e) => update("phone", e.target.value)} disabled={submitting} required maxLength={20} placeholder="vd: 0901234567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="streetLine">Số nhà, tên đường <span className="text-destructive">*</span></Label>
              <Input id="streetLine" value={address.streetLine} onChange={(e) => update("streetLine", e.target.value)} disabled={submitting} required maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ward">Phường/Xã <span className="text-destructive">*</span></Label>
                <Input id="ward" value={address.ward} onChange={(e) => update("ward", e.target.value)} disabled={submitting} required maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">Quận/Huyện <span className="text-destructive">*</span></Label>
                <Input id="district" value={address.district} onChange={(e) => update("district", e.target.value)} disabled={submitting} required maxLength={80} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
                <Input id="city" value={address.city} onChange={(e) => update("city", e.target.value)} disabled={submitting} required maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Quốc gia</Label>
                <Input id="country" value={address.country || "VN"} onChange={(e) => update("country", e.target.value)} disabled={submitting} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Vui lòng nhập đầy đủ các trường có dấu <span className="text-destructive">*</span>.</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Đơn hàng của bạn</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {items.map((item) => {
              const p = products[item.productId];
              return (
                <div key={item.productId} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {p?.name ?? "Đang tải..."} <span className="text-muted-foreground">&times;{item.quantity}</span>
                  </span>
                  <span className="tabular-nums">
                    {p ? formatVND(p.price * item.quantity) : "—"}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Tạm tính</span>
              <span className="tabular-nums text-primary">{formatVND(totalAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng tiền sẽ do backend tính lại dựa trên giá sản phẩm tại thời điểm checkout.
            </p>
          </CardContent>
          <div className="border-t p-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Đặt hàng"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
