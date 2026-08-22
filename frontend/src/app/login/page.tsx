"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { getPendingCartItem } from "@/lib/pending-cart";
import { getPendingWishlistItem } from "@/lib/pending-wishlist";
import type { PendingCartItem } from "@/lib/pending-cart";
import type { PendingWishlistItem } from "@/lib/pending-wishlist";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingCartItem, setPendingCartItem] = useState<PendingCartItem | null>(null);
  const [pendingWishlistItem, setPendingWishlistItem] = useState<PendingWishlistItem | null>(null);

  useEffect(() => {
    setPendingCartItem(getPendingCartItem());
    setPendingWishlistItem(getPendingWishlistItem());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim() || !password) {
      setErrorMsg("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      toast.success({ title: "Đăng nhập thành công" });
      window.location.href = next;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      const lower = msg.toLowerCase();
      setErrorMsg(
        lower.includes("invalid") || lower.includes("credentials") || lower.includes("sai") || lower.includes("authentication failed") || lower.includes("không đúng")
          ? "Tên đăng nhập hoặc mật khẩu không đúng."
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg border-border/80 bg-white">
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
          <CardDescription>Đăng nhập để đặt hàng và xem lịch sử đơn.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {pendingCartItem && (
              <div className="flex items-center gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
                <ShoppingCart className="size-4 shrink-0" />
                <span>
                  Đăng nhập để thêm{" "}
                  <strong>{pendingCartItem.productName ?? "sản phẩm"}</strong>
                  {" "}vào giỏ hàng của bạn.
                </span>
              </div>
            )}
            {!pendingCartItem && pendingWishlistItem && (
              <div className="flex items-center gap-3 rounded-md bg-pink-50 p-3 text-sm text-pink-700 border border-pink-200">
                <Heart className="size-4 shrink-0 fill-pink-500 text-pink-500" />
                <span>
                  Đăng nhập để thêm{" "}
                  <strong>{pendingWishlistItem.productName ?? "sản phẩm"}</strong>
                  {" "}vào danh sách yêu thích của bạn.
                </span>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrorMsg(null); }}
                placeholder="vd: nguyen_van_a"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                disabled={submitting}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center w-full min-h-[calc(100vh-220px)] py-12 px-4">
      <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
