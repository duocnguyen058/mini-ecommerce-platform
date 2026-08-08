"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.password || !form.email.trim() || !form.fullName.trim()) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ các trường bắt buộc." });
      return;
    }
    if (form.password.length < 6) {
      toast.warning({ title: "Mật khẩu quá ngắn", description: "Mật khẩu tối thiểu 6 ký tự." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.warning({ title: "Xác nhận mật khẩu sai", description: "Mật khẩu không khớp." });
      return;
    }
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
      });
      toast.success({ title: "Đăng ký thành công", description: "Tài khoản đã được tạo." });
      router.push(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại";
      toast.error({ title: "Đăng ký thất bại", description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký tài khoản</CardTitle>
          <CardDescription>Tạo tài khoản khách hàng để bắt đầu mua sắm.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} disabled={submitting} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên đăng nhập *</Label>
              <Input id="username" autoComplete="username" value={form.username} onChange={(e) => update("username", e.target.value)} disabled={submitting} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} disabled={submitting} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} disabled={submitting} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Nhắc lại mật khẩu *</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} disabled={submitting} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-medium text-primary hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12">Đang tải...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
