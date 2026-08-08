import type { ReactNode } from "react";
import { AdminGuard, AdminLayout } from "@/components/admin-guard";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
