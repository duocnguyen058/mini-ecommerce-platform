"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  Pencil,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { userApi } from "@/lib/api";
import type { UserResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEnabled, setEditEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  function loadUsers() {
    setLoading(true);
    userApi
      .getAll()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEditDialog(u: UserResponse) {
    setEditUser(u);
    setEditFullName(u.fullName ?? "");
    setEditPhone(u.phone ?? "");
    setEditEnabled(u.enabled ?? false);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const updated = await userApi.updateById(editUser.id, {
        fullName: editFullName,
        phone: editPhone,
        enabled: editEnabled,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditUser(null);
      toast.success({ title: "Đã cập nhật", description: `Tài khoản "${updated.username}" đã được cập nhật` });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error({ title: "Lỗi", description: error.message });
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (roleFilter === "ADMIN") return u.roles?.some((r) => r.includes("ADMIN"));
    if (roleFilter === "CUSTOMER") return u.roles?.some((r) => r.includes("CUSTOMER"));
    return true;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.roles?.some((r) => r.includes("ADMIN"))).length;
  const customerCount = totalUsers - adminCount;
  const enabledCount = users.filter((u) => u.enabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            Quản lý Người dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách tài khoản và phân quyền trong hệ thống Identity Service
          </p>
        </div>
        <Button
          onClick={loadUsers}
          variant="outline"
          size="sm"
          className="gap-1.5 h-9"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{totalUsers}</div>
              <div className="text-xs text-gray-500">Tổng tài khoản</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-purple-700">{adminCount}</div>
              <div className="text-xs text-gray-500">Quản trị viên</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-700">{customerCount}</div>
              <div className="text-xs text-gray-500">Khách hàng</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-700">{enabledCount}</div>
              <div className="text-xs text-gray-500">Đã kích hoạt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm theo username, họ tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={roleFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("ALL")}
            className="h-10 text-xs"
          >
            Tất cả ({totalUsers})
          </Button>
          <Button
            variant={roleFilter === "ADMIN" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("ADMIN")}
            className="h-10 text-xs"
          >
            Admin ({adminCount})
          </Button>
          <Button
            variant={roleFilter === "CUSTOMER" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("CUSTOMER")}
            className="h-10 text-xs"
          >
            Customer ({customerCount})
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Tài khoản</th>
                <th className="px-4 py-3.5 font-semibold">Họ và tên</th>
                <th className="px-4 py-3.5 font-semibold">Email</th>
                <th className="px-4 py-3.5 font-semibold">Vai trò</th>
                <th className="px-4 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-4 py-3.5 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3.5 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdminUser = u.roles?.some((r) => r.includes("ADMIN"));
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900">{u.username}</td>
                      <td className="px-4 py-3.5 text-gray-700">{u.fullName || "—"}</td>
                      <td className="px-4 py-3.5 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3.5 text-gray-400" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isAdminUser ? (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[11px]">
                            ROLE_ADMIN
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[11px]">
                            ROLE_CUSTOMER
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.enabled ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
                            Đã kích hoạt
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[11px]">
                            Chờ kích hoạt
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                            className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="size-3.5 mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(u)}
                            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="size-3.5 mr-1" />
                            Sửa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog.Root open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup className="max-w-md">
              <Dialog.Header>
                <Dialog.Title className="flex items-center gap-2">
                  <Shield className="size-5 text-blue-600" />
                  Chi tiết tài khoản
                </Dialog.Title>
                <Dialog.Description>
                  Thông tin người dùng trong hệ thống Identity
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.CloseIconButton />
              <div className="space-y-3 py-2 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-mono text-xs text-gray-800">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Username</span>
                  <span className="font-semibold text-gray-900">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Họ và tên</span>
                  <span className="text-gray-900">{selectedUser.fullName || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Số điện thoại</span>
                  <span className="text-gray-900">{selectedUser.phone || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Vai trò</span>
                  <span className="font-medium text-blue-600">{selectedUser.roles?.join(", ")}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-500">Trạng thái kích hoạt</span>
                  <span className={selectedUser.enabled ? "text-emerald-600 font-semibold" : "text-yellow-600 font-semibold"}>
                    {selectedUser.enabled ? "Đã xác thực & kích hoạt" : "Chờ xác thực"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Ngày đăng ký</span>
                  <span className="text-gray-700">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </span>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Dialog.Root open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup className="max-w-md">
              <Dialog.Header>
                <Dialog.Title className="flex items-center gap-2">
                  <Pencil className="size-5 text-blue-600" />
                  Chỉnh sửa người dùng
                </Dialog.Title>
                <Dialog.Description>
                  Chỉnh sửa thông tin cho tài khoản{" "}
                  <span className="font-semibold text-gray-800">@{editUser.username}</span>.
                  Email và tên đăng nhập không thể thay đổi.
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.CloseIconButton />
              <form onSubmit={handleSaveUser} className="space-y-4 py-2">
                {/* Read-only fields */}
                <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Username</span>
                    <span className="font-mono text-xs text-gray-400">{editUser.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Email</span>
                    <span className="text-xs text-gray-400">{editUser.email}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-fullname" className="text-xs font-semibold">
                    Họ và tên
                  </Label>
                  <Input
                    id="edit-fullname"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone" className="text-xs font-semibold">
                    Số điện thoại
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Trạng thái tài khoản</Label>
                  <button
                    type="button"
                    onClick={() => setEditEnabled(!editEnabled)}
                    className={`mt-1.5 flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      editEnabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-yellow-200 bg-yellow-50 text-yellow-800"
                    }`}
                  >
                    {editEnabled ? (
                      <ToggleRight className="size-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ToggleLeft className="size-5 text-yellow-500 shrink-0" />
                    )}
                    <span className="font-medium">
                      {editEnabled ? "Tài khoản đang hoạt động" : "Tài khoản bị vô hiệu hóa"}
                    </span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditUser(null)}
                    disabled={saving}
                  >
                    <X className="size-4 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    <Save className="size-4 mr-1" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
