"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { toast } from "@/lib/toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Không tìm thấy mã xác thực trong đường dẫn.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setSuccess(true);
        setMessage(res.message || "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
        toast.success({ title: "Thành công", description: "Tài khoản của bạn đã được kích hoạt." });
      })
      .catch((err) => {
        setSuccess(false);
        const msg = err instanceof Error ? err.message : "Xác thực thất bại";
        setMessage(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function handleResend() {
    if (!resendEmail.trim()) {
      toast.error({ title: "Lỗi", description: "Vui lòng nhập địa chỉ email của bạn." });
      return;
    }
    setResending(true);
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      toast.success({ title: "Đã gửi email", description: res.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể gửi lại email";
      toast.error({ title: "Thất bại", description: msg });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
            {loading ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : success ? (
              <CheckCircle2 className="size-10 text-green-500" />
            ) : (
              <XCircle className="size-10 text-red-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {loading ? "Đang xác thực email..." : success ? "Xác thực thành công!" : "Xác thực thất bại"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && success && (
            <p className="text-sm text-muted-foreground">
              Tài khoản <strong>ShopNow</strong> của bạn đã sẵn sàng sử dụng. Hãy đăng nhập để bắt đầu mua sắm!
            </p>
          )}

          {!loading && !success && (
            <div className="mt-4 border-t pt-4 text-left space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Gửi lại email xác thực:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button size="sm" onClick={handleResend} disabled={resending}>
                  {resending ? "Đang gửi..." : "Gửi lại"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {success ? (
            <Button className="w-full" onClick={() => router.push("/login")}>
              Đăng nhập ngay
            </Button>
          ) : (
            <Link href="/login" className="text-sm text-primary hover:underline">
              Quay lại trang Đăng nhập
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center">Đang tải...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
