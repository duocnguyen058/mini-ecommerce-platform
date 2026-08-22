"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

// Định dạng số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
const VN_PHONE_RE = /^(0[3-9]\d{8})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

function mapBackendError(msg: string): { field: keyof FieldErrors | "global"; message: string } {
  const m = msg.toLowerCase();
  if (m.includes("username") && (m.includes("exist") || m.includes("taken") || m.includes("đã tồn tại")))
    return { field: "username", message: "Tên đăng nhập đã tồn tại" };
  if (m.includes("email") && (m.includes("exist") || m.includes("taken") || m.includes("đã")))
    return { field: "email", message: "Email đã được sử dụng" };
  return { field: "global", message: msg };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function RegisterForm() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    // Xóa lỗi của field khi user bắt đầu sửa
    if (errors[key as keyof FieldErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
    if (globalError) setGlobalError(null);
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};

    const trimmedFullName = form.fullName.trim();
    if (!trimmedFullName) {
      e.fullName = "Vui lòng nhập đầy đủ Họ và Tên";
    } else if (trimmedFullName.split(/\s+/).filter(Boolean).length < 2) {
      e.fullName = "Vui lòng nhập cả Họ và Tên (ít nhất 2 từ, ví dụ: Nguyễn Văn A)";
    } else if (trimmedFullName.length < 3) {
      e.fullName = "Họ và tên phải có ít nhất 3 ký tự";
    }

    if (!form.username.trim())
      e.username = "Vui lòng nhập tên đăng nhập";
    else if (form.username.trim().length < 3)
      e.username = "Tên đăng nhập phải có ít nhất 3 ký tự";

    if (!form.email.trim())
      e.email = "Vui lòng nhập email";
    else if (!EMAIL_RE.test(form.email.trim()))
      e.email = "Email không hợp lệ";

    if (form.phone.trim() && !VN_PHONE_RE.test(form.phone.trim()))
      e.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu 0)";

    if (!form.password)
      e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 8)
      e.password = "Mật khẩu phải có ít nhất 8 ký tự";

    if (!form.confirmPassword)
      e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Mật khẩu xác nhận không đúng";

    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
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
      setDone(true);
      toast.success({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email của bạn để xác thực tài khoản.",
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Đăng ký thất bại";
      const mapped = mapBackendError(raw);
      if (mapped.field === "global") {
        setGlobalError(mapped.message);
      } else {
        setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-primary">
          <Mail className="size-8" />
        </div>
        <h2 className="text-xl font-semibold">Vui lòng xác thực Email của bạn</h2>
        <p className="text-sm text-muted-foreground">
          Chúng tôi đã gửi một email xác thực đến địa chỉ: <br />
          <strong className="text-foreground">{form.email}</strong>
        </p>
        <div className="rounded-md bg-blue-50 p-4 text-xs text-blue-700 border border-blue-200 text-left space-y-1">
          <p className="font-semibold">✉️ Hướng dẫn tiếp theo:</p>
          <p>1. Mở ứng dụng Email hoặc truy cập hòm thư của bạn.</p>
          <p>2. Nhấp vào nút <strong>&quot;Xác thực tài khoản ngay&quot;</strong> trong email.</p>
          <p>3. Sau khi xác thực thành công, bạn có thể đăng nhập vào ShopNow.</p>
        </div>
        <Link href="/login" className="mt-2 w-full">
          <Button variant="outline" className="w-full">Đi tới trang Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký tài khoản</CardTitle>
          <CardDescription>Tạo tài khoản khách hàng để bắt đầu mua sắm.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {globalError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 font-medium">
                ⚠️ {globalError}
              </div>
            )}

            {/* Họ và tên */}
            <div className="space-y-1">
              <Label htmlFor="fullName">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Nguyễn Văn A"
                disabled={submitting}
                className={errors.fullName ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              <FieldError msg={errors.fullName} />
            </div>

            {/* Tên đăng nhập */}
            <div className="space-y-1">
              <Label htmlFor="username">
                Tên đăng nhập <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="vd: nguyen_van_a"
                disabled={submitting}
                className={errors.username ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              <FieldError msg={errors.username} />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="example@email.com"
                disabled={submitting}
                className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              <FieldError msg={errors.email} />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="0912345678"
                disabled={submitting}
                className={errors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              <FieldError msg={errors.phone} />
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1">
              <Label htmlFor="password">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={submitting}
                  className={errors.password ? "border-red-400 focus-visible:ring-red-400 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Strength hint */}
              {form.password && (
                <p className={`text-xs ${form.password.length >= 8 ? "text-green-600" : "text-orange-500"}`}>
                  {form.password.length >= 8 ? "✓ Đủ độ dài" : `Còn thiếu ${8 - form.password.length} ký tự`}
                </p>
              )}
              <FieldError msg={errors.password} />
            </div>

            {/* Nhắc lại mật khẩu */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">
                Nhắc lại mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  disabled={submitting}
                  className={errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-green-600">✓ Mật khẩu khớp</p>
              )}
              <FieldError msg={errors.confirmPassword} />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
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
    <div className="flex-1 flex items-center justify-center w-full min-h-[calc(100vh-220px)] py-12 px-4">
      <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12">Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
