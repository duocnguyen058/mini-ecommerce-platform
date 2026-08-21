"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Package,
  Heart,
  MapPin,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Pencil,
  Save,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/use-wishlist";
import { userApi, orderApi } from "@/lib/api";
import type { UserResponse, OrderResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressManager } from "@/components/address-manager";
import { toast } from "@/lib/toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { wishlistCount } = useWishlist();

  const [userInfo, setUserInfo] = useState<UserResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "addresses" | "orders">("info");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/profile");
      return;
    }

    setLoading(true);
    Promise.all([
      userApi.getMe().catch(() => null),
      orderApi.list({ size: 5 }).catch(() => null),
    ])
      .then(([userData, ordersData]) => {
        if (userData) setUserInfo(userData);
        if (ordersData?.content) setRecentOrders(ordersData.content);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleStartEdit = () => {
    setEditFullName(userInfo?.fullName || user?.fullName || "");
    setEditPhone(userInfo?.phone || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmed = editFullName.trim();
    if (!trimmed || trimmed.split(/\s+/).filter(Boolean).length < 2) {
      toast.error({ title: "Lỗi họ tên", description: "Vui lòng nhập đầy đủ cả Họ và Tên (tối thiểu 2 từ)." });
      return;
    }
    setSaving(true);
    try {
      const updated = await userApi.updateMe({
        fullName: trimmed,
        phone: editPhone.trim() || undefined,
      });
      setUserInfo(updated);
      setIsEditing(false);
      toast.success({ title: "Đã lưu", description: "Hồ sơ của bạn đã được cập nhật." });
    } catch (err) {
      toast.error({ title: "Lỗi", description: err instanceof Error ? err.message : "Không thể cập nhật hồ sơ. Vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="md:col-span-2 h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  const initial =
    user?.fullName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? "U";

  const isAdmin = user?.roles?.some((r) => r.includes("ADMIN"));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {userInfo?.fullName || user?.fullName || user?.username}
              </h1>
              {isAdmin ? (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">Quản trị viên</Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Khách hàng</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="size-3.5" />
              {userInfo?.email || user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="text-xs h-9">
                Vào trang Quản trị
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9 gap-1.5"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="size-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{recentOrders.length}</div>
            <div className="text-xs text-gray-500">Đơn hàng gần đây</div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Heart className="size-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{wishlistCount}</div>
            <div className="text-xs text-gray-500">Sản phẩm yêu thích</div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-700">Đã kích hoạt</div>
            <div className="text-xs text-gray-500">Email chính chủ</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("info")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "info"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <User className="size-4" />
          Thông tin tài khoản
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "addresses"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPin className="size-4" />
          Sổ địa chỉ nhận hàng
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Package className="size-4" />
          Đơn hàng gần đây
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "info" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Chỉnh sửa họ tên và số điện thoại. Email và tên đăng nhập không thể thay đổi."
                    : "Chi tiết tài khoản đăng ký trên hệ thống"}
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-8 gap-1.5"
                  onClick={handleStartEdit}
                >
                  <Pencil className="size-3.5" />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 gap-1 text-gray-500"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="size-3.5" />
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="size-3.5" />
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {/* Username – read-only, always */}
              <div className="flex justify-between py-2.5 border-b items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <User className="size-3.5" />
                  Tên đăng nhập
                </span>
                <span className="font-medium text-gray-400 flex items-center gap-1.5">
                  {userInfo?.username || user?.username}
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Cố định</span>
                </span>
              </div>

              {/* Full Name – editable */}
              <div className="flex justify-between py-2.5 border-b items-center gap-3">
                <span className="text-gray-500 shrink-0">Họ và tên</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="flex-1 text-right border border-blue-300 rounded-md px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {userInfo?.fullName || user?.fullName || (
                      <span className="text-gray-400 italic">Chưa cập nhật</span>
                    )}
                  </span>
                )}
              </div>

              {/* Email – read-only, always */}
              <div className="flex justify-between py-2.5 border-b items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Email
                </span>
                <span className="font-medium text-gray-400 flex items-center gap-1.5">
                  {userInfo?.email || user?.email}
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Cố định</span>
                </span>
              </div>

              {/* Phone – editable */}
              <div className="flex justify-between py-2.5 border-b items-center gap-3">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Phone className="size-3.5" />
                  Số điện thoại
                </span>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="flex-1 text-right border border-blue-300 rounded-md px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {userInfo?.phone || (
                      <span className="text-gray-400 italic">Chưa cập nhật</span>
                    )}
                  </span>
                )}
              </div>

              {/* Role – read-only */}
              <div className="flex justify-between py-2.5 items-center">
                <span className="text-gray-500">Vai trò</span>
                <span className="font-medium text-blue-600">
                  {userInfo?.roles?.join(", ") || user?.roles?.join(", ")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bảo mật &amp; Trạng thái</CardTitle>
              <CardDescription>Quản lý an toàn tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-xs">Email đã được xác thực</div>
                    <div className="text-[11px] text-emerald-700">Tài khoản được bảo vệ đầy đủ</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800">
                  <ShieldCheck className="size-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs">Xác thực Stateless JWT RSA</div>
                    <div className="text-[11px] text-blue-700">Mã hóa an toàn qua API Gateway</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/orders">
                  <Button variant="outline" className="w-full text-xs gap-2">
                    <Package className="size-4" />
                    Xem tất cả lịch sử đơn hàng
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "addresses" && (
        <div>
          <AddressManager />
        </div>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
              <CardDescription>Danh sách các đơn hàng bạn đã đặt gần đây</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 gap-1">
                Xem tất cả
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Bạn chưa có đơn hàng nào gần đây.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">
                        Đơn #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items?.length ?? 0} sản phẩm • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
