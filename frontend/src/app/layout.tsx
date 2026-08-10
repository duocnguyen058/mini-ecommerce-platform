import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider, ToastPortal } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/use-wishlist";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Mini E-Commerce Platform",
  description: "Nền tảng thương mại điện tử - Microservices Spring Boot + Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <TooltipProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Navbar />
                  <main className="flex-1 flex flex-col">{children}</main>
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
