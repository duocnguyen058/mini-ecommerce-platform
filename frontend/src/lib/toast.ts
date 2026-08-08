// Thin wrapper quanh `toast` ToastManager của @base-ui để gọi imperative
// dạng toast.success(...) / toast.error(...) — ngắn gọn hơn toast.add({ type }).
//
// Singleton `toast` được export từ components/ui/toast (đã được ToastProvider
// Mount sẵn trong layout), nên chỉ cần import { toast } là dùng được.

import { toast as manager } from "@/components/ui/toast";

type ToastInput = {
  title: string;
  description?: string;
  timeout?: number;
};

export const toast = {
  success({ title, description, timeout = 3500 }: ToastInput) {
    return manager.add({ type: "success", title, description, timeout });
  },
  error({ title, description, timeout = 5000 }: ToastInput) {
    return manager.add({ type: "error", title, description, timeout });
  },
  info({ title, description, timeout = 3500 }: ToastInput) {
    return manager.add({ type: "info", title, description, timeout });
  },
  warning({ title, description, timeout = 4500 }: ToastInput) {
    return manager.add({ type: "warning", title, description, timeout });
  },
  loading({ title, description }: ToastInput) {
    return manager.add({ type: "loading", title, description, timeout: 0 });
  },
  promise<T>(
    p: Promise<T>,
    opts: {
      loading:ToastInput;
      success: (value: T) => ToastInput;
      error: (err: unknown) => ToastInput;
    },
  ) {
    return manager.promise(p, {
      loading: opts.loading,
      success: (val) => ({ type: "success", ...opts.success(val) }),
      error: (err) => ({ type: "error", ...opts.error(err) }),
    });
  },
};
