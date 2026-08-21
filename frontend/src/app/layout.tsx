import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider, ToastPortal } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/use-wishlist";
import { Navbar } from "@/components/navbar";
import { PageProgress } from "@/components/page-progress";
import { PageTransition } from "@/components/page-transition";
import { AnnouncementBar } from "@/components/announcement-bar";
import { MiniCartDrawer } from "@/components/mini-cart-drawer";
import { FloatingActions } from "@/components/floating-actions";

export const metadata: Metadata = {
  title: {
    default: "ShopNow - Mua Sắm Trực Tuyến Hàng Triệu Sản Phẩm",
    template: "%s | ShopNow",
  },
  description:
    "Mua sắm trực tuyến hàng triệu sản phẩm chính hãng với giá tốt nhất. Giao hàng siêu nhanh, thanh toán an toàn. Điện thoại, laptop, thời trang, mỹ phẩm và nhiều hơn nữa.",
  keywords: ["mua sắm online", "thương mại điện tử", "điện thoại", "laptop", "thời trang", "mỹ phẩm"],
  authors: [{ name: "ShopNow" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "ShopNow",
    title: "ShopNow - Mua Sắm Trực Tuyến Hàng Triệu Sản Phẩm",
    description:
      "Mua sắm trực tuyến hàng triệu sản phẩm chính hãng với giá tốt nhất.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-foreground antialiased selection:bg-blue-500 selection:text-white">
        <ToastProvider>
          <TooltipProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Suspense fallback={null}>
                    <PageProgress />
                  </Suspense>
                  <AnnouncementBar />
                  <Navbar />
                  <MiniCartDrawer />
                  <PageTransition>
                    <main className="flex-1 flex flex-col">{children}</main>
                  </PageTransition>
                  <FloatingActions />
                  <ToastPortal />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
