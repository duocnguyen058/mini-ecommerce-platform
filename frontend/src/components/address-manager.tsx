"use client";

import { useState } from "react";
import {
  useAddresses,
  type StoredAddress,
} from "@/lib/use-addresses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Check, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface AddressManagerProps {
  selectedAddressId?: string;
  onSelectAddress?: (addr: StoredAddress) => void;
}

export function AddressManager({
  selectedAddressId,
  onSelectAddress,
}: AddressManagerProps) {
  const {
    addresses,
    defaultAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<StoredAddress | null>(null);

  // Form State
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [streetLine, setStreetLine] = useState("");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const activeAddr =
    addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;

  function resetForm() {
    setEditingAddr(null);
    setRecipient("");
    setPhone("");
    setStreetLine("");
    setWard("");
    setDistrict("");
    setCity("");
    setIsDefault(false);
  }

  function handleOpenCreate() {
    resetForm();
    setFormOpen(true);
  }

  function handleOpenEdit(addr: StoredAddress) {
    setEditingAddr(addr);
    setRecipient(addr.recipient ?? "");
    setPhone(addr.phone ?? "");
    setStreetLine(addr.streetLine ?? "");
    setWard(addr.ward ?? "");
    setDistrict(addr.district ?? "");
    setCity(addr.city ?? "");
    setIsDefault(addr.isDefault ?? false);
    setFormOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        recipient,
        phone,
        streetLine,
        ward,
        district,
        city,
        country: "VN",
        isDefault,
      };

      let saved: StoredAddress;
      if (editingAddr) {
        saved = updateAddress(editingAddr.id, payload);
        toast.success({ title: "Cập nhật địa chỉ thành công" });
      } else {
        saved = addAddress(payload);
        toast.success({ title: "Đã thêm địa chỉ mới" });
      }

      if (onSelectAddress) {
        onSelectAddress(saved);
      }
      setFormOpen(false);
      resetForm();
    } catch (err) {
      toast.error({
        title: "Lỗi địa chỉ",
        description: err instanceof Error ? err.message : "Vui lòng kiểm tra lại thông tin",
      });
    }
  }

  function handleDelete(id: string) {
    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      deleteAddress(id);
      toast.success({ title: "Đã xóa địa chỉ" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Currently Selected Address Card */}
      <Card className="rounded-xl border border-border/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span>Địa chỉ nhận hàng</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() => setDialogOpen(true)}
            >
              Đổi địa chỉ
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1 font-semibold"
              onClick={handleOpenCreate}
            >
              <Plus className="size-3.5" />
              Thêm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeAddr ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {activeAddr.recipient}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="font-mono text-muted-foreground">
                  {activeAddr.phone}
                </span>
                {activeAddr.isDefault && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px] ml-1">
                    Mặc định
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {activeAddr.streetLine}, {activeAddr.ward}, {activeAddr.district}, {activeAddr.city}
              </p>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Bạn chưa có địa chỉ giao hàng nào.
              </p>
              <Button type="button" size="sm" onClick={handleOpenCreate}>
                <Plus className="size-4 mr-1" /> Thêm địa chỉ mới
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Selection List Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-xl">
            <Dialog.Header>
              <Dialog.Title>Chọn địa chỉ giao hàng</Dialog.Title>
              <Dialog.Description>
                Danh sách các địa chỉ bạn đã lưu trữ
              </Dialog.Description>
            </Dialog.Header>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 py-2">
              {addresses.map((addr) => {
                const isSelected = activeAddr?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className="space-y-1 text-sm flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {addr.recipient}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="font-mono text-muted-foreground">
                          {addr.phone}
                        </span>
                        {addr.isDefault && (
                          <Badge variant="outline" className="text-[10px]">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {addr.streetLine}, {addr.ward}, {addr.district}, {addr.city}
                      </p>
                      {!addr.isDefault && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => setDefaultAddress(addr.id)}
                        >
                          Thiết lập mặc định
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => {
                          if (onSelectAddress) onSelectAddress(addr);
                          setDialogOpen(false);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check className="size-3.5" /> Đã chọn
                          </>
                        ) : (
                          "Chọn địa chỉ"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(addr)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(addr.id)}
                        title="Xóa"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Dialog.Footer className="mt-4 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleOpenCreate}
              >
                <Plus className="size-4 mr-1" /> Thêm địa chỉ mới
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
              >
                Đóng
              </Button>
            </Dialog.Footer>
            <Dialog.CloseIconButton />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add / Edit Address Form Modal */}
      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup className="max-w-md">
            <Dialog.Header>
              <Dialog.Title>
                {editingAddr ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ giao hàng mới"}
              </Dialog.Title>
              <Dialog.Description>
                Nhập đầy đủ thông tin nhận hàng bên dưới
              </Dialog.Description>
            </Dialog.Header>

            <form onSubmit={handleSave} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="addr-recipient">Họ và tên người nhận <span className="text-destructive">*</span></Label>
                <Input
                  id="addr-recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addr-phone">Số điện thoại <span className="text-destructive">*</span></Label>
                <Input
                  id="addr-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addr-street">Số nhà, Tên đường <span className="text-destructive">*</span></Label>
                <Input
                  id="addr-street"
                  value={streetLine}
                  onChange={(e) => setStreetLine(e.target.value)}
                  placeholder="Ví dụ: 123 Đường Lê Lợi"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="addr-ward">Phường / Xã <span className="text-destructive">*</span></Label>
                  <Input
                    id="addr-ward"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Phường Bến Nghé"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addr-district">Quận / Huyện <span className="text-destructive">*</span></Label>
                  <Input
                    id="addr-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận 1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addr-city">Tỉnh / Thành phố <span className="text-destructive">*</span></Label>
                <Input
                  id="addr-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="TP. Hồ Chí Minh"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addr-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary size-4"
                />
                <Label htmlFor="addr-default" className="text-xs cursor-pointer font-normal">
                  Đặt làm địa chỉ giao hàng mặc định
                </Label>
              </div>

              <Dialog.Footer className="mt-4 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu địa chỉ</Button>
              </Dialog.Footer>
            </form>

            <Dialog.CloseIconButton />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
