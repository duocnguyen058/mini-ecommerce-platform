"use client";

import { useState, useEffect, useCallback } from "react";
import type { Address } from "./types";

export interface StoredAddress extends Address {
  id: string;
  isDefault?: boolean;
}

const ADDRESS_STORAGE_KEY = "mini_ecommerce_addresses";

export function getStoredAddresses(): StoredAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  const recipient = addr.recipient?.trim() ?? "";
  if (!recipient) return "Vui lòng nhập họ và tên người nhận";
  if (recipient.length < 2) {
    return "Họ và tên người nhận phải có ít nhất 2 ký tự";
  }
  const phone = addr.phone?.trim() ?? "";
  if (!phone) return "Vui lòng nhập số điện thoại";
  if (!/^[0-9+\-\s()]{8,15}$/.test(phone)) {
    return "Số điện thoại không hợp lệ (từ 8 đến 15 chữ số)";
  }
  const street = addr.streetLine?.trim() ?? "";
  if (!street) {
    return "Vui lòng nhập địa chỉ giao hàng";
  }
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
        recipient: newAddr.recipient?.trim() ?? "",
        streetLine: newAddr.streetLine?.trim() ?? "",
        ward: newAddr.ward?.trim() || undefined,
        district: newAddr.district?.trim() || undefined,
        city: newAddr.city?.trim() || "Việt Nam",
        country: newAddr.country?.trim() || "VN",
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
