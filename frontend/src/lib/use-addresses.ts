"use client";

import { useState, useEffect, useCallback } from "react";
import type { Address } from "./types";

export interface StoredAddress extends Address {
  id: string;
  isDefault?: boolean;
}

const ADDRESS_STORAGE_KEY = "mini_ecommerce_addresses";

const DEFAULT_INITIAL_ADDRESSES: StoredAddress[] = [
  {
    id: "addr-default-1",
    recipient: "Nguyễn Văn A",
    phone: "0901234567",
    streetLine: "123 Đường Lê Lợi",
    ward: "Phường Bến Nghé",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    country: "VN",
    isDefault: true,
  },
  {
    id: "addr-default-2",
    recipient: "Trần Thị B",
    phone: "0987654321",
    streetLine: "456 Đường Nguyễn Huệ",
    ward: "Phường Bến Thành",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    country: "VN",
    isDefault: false,
  },
];

export function getStoredAddresses(): StoredAddress[] {
  if (typeof window === "undefined") return DEFAULT_INITIAL_ADDRESSES;
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        ADDRESS_STORAGE_KEY,
        JSON.stringify(DEFAULT_INITIAL_ADDRESSES)
      );
      return DEFAULT_INITIAL_ADDRESSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_INITIAL_ADDRESSES;
  } catch {
    return DEFAULT_INITIAL_ADDRESSES;
  }
}

export function saveStoredAddresses(addresses: StoredAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.error("Failed to save addresses:", err);
  }
}

export function validateAddressInput(
  addr: Partial<Address>
): string | null {
  if (!addr.recipient?.trim()) return "Vui lòng nhập tên người nhận";
  if (!addr.phone?.trim()) return "Vui lòng nhập số điện thoại";
  if (!/^[0-9+\-\s()]{9,15}$/.test(addr.phone.trim())) {
    return "Số điện thoại không hợp lệ (cần từ 9 - 15 chữ số)";
  }
  if (!addr.streetLine?.trim()) return "Vui lòng nhập số nhà, tên đường";
  if (!addr.ward?.trim()) return "Vui lòng nhập Phường/Xã";
  if (!addr.district?.trim()) return "Vui lòng nhập Quận/Huyện";
  if (!addr.city?.trim()) return "Vui lòng nhập Tỉnh/Thành phố";
  return null;
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<StoredAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const list = getStoredAddresses();
    setAddresses(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const addAddress = useCallback(
    (newAddr: Omit<StoredAddress, "id">) => {
      const error = validateAddressInput(newAddr);
      if (error) throw new Error(error);

      const id = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isFirst = addresses.length === 0;
      const created: StoredAddress = {
        ...newAddr,
        id,
        isDefault: newAddr.isDefault ?? isFirst,
      };

      let updated = addresses;
      if (created.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      updated = [created, ...updated];
      setAddresses(updated);
      saveStoredAddresses(updated);
      return created;
    },
    [addresses]
  );

  const updateAddress = useCallback(
    (id: string, newAddr: Partial<StoredAddress>) => {
      const existing = addresses.find((a) => a.id === id);
      if (!existing) throw new Error("Không tìm thấy địa chỉ");

      const merged = { ...existing, ...newAddr };
      const error = validateAddressInput(merged);
      if (error) throw new Error(error);

      let updated = addresses.map((a) => (a.id === id ? merged : a));
      if (newAddr.isDefault) {
        updated = updated.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }));
      }
      setAddresses(updated);
      saveStoredAddresses(updated);
      return merged;
    },
    [addresses]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      const target = addresses.find((a) => a.id === id);
      const updated = addresses.filter((a) => a.id !== id);
      if (target?.isDefault && updated.length > 0) {
        updated[0] = { ...updated[0], isDefault: true };
      }
      setAddresses(updated);
      saveStoredAddresses(updated);
    },
    [addresses]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      const updated = addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      setAddresses(updated);
      saveStoredAddresses(updated);
    },
    [addresses]
  );

  return {
    addresses,
    defaultAddress,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    reload,
  };
}
