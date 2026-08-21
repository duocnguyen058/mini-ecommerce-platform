"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ShoppingCart, Trash2, ChevronRight, PackageOpen } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cartApi, productApi, formatVND } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/types";

interface EnrichedCartItem {
  productId: string;
  quantity: number;
  product: Product | null;
}

export function MiniCartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, refresh } = useCart();
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openMiniCart", handleOpen as EventListener);
    return () => window.removeEventListener("openMiniCart", handleOpen as EventListener);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  useEffect(() => {
    async function enrichItems() {
      if (!cart?.items.length) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const enriched = await Promise.all(
          cart.items.map(async (item) => {
            try {
              const product = await productApi.getById(item.productId);
              return { ...item, product };
            } catch {
              return { ...item, product: null };
            }
          })
        );
        setItems(enriched);
      } catch (err) {
        console.error("Failed to enrich cart items", err);
      } finally {
        setLoading(false);
      }
    }

    enrichItems();
  }, [cart]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartApi.setQuantity(productId, { quantity });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await cartApi.removeItem(productId);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const subtotal = items.reduce((acc, item) => {
    if (item.product) {
      return acc + item.product.price * item.quantity;
    }
    return acc;
  }, 0);

  const freeShipTarget = 500000;
  const progress = Math.min((subtotal / freeShipTarget) * 100, 100);
  const remaining = Math.max(freeShipTarget - subtotal, 0);

  return (
    <>
      <div 
        className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} 
        onClick={() => setIsOpen(false)}
      />
      <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">Giỏ hàng của bạn</h2>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart?.itemCount || 0}
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between text-xs font-medium mb-2">
              {remaining > 0 ? (
                <span className="text-gray-600">Mua thêm <span className="text-blue-600 font-bold">{formatVND(remaining)}</span> để được miễn phí vận chuyển</span>
              ) : (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  🎉 Bạn đã được miễn phí vận chuyển!
                </span>
              )}
            </div>
            <div className="free-ship-bar-track">
              <div className="free-ship-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <ShoppingCart className="size-8" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Bạn chưa đăng nhập</p>
                <p className="text-sm text-gray-500 mt-1">Đăng nhập để xem giỏ hàng của bạn.</p>
              </div>
              <Link 
                href="/login"
                onClick={() => setIsOpen(false)}
                className="btn-brand mt-2 inline-flex"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                <PackageOpen className="size-10" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Giỏ hàng trống</p>
                <p className="text-sm text-gray-500 mt-1">Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!</p>
              </div>
              <Link 
                href="/products"
                onClick={() => setIsOpen(false)}
                className="btn-brand mt-2 inline-flex"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-20 h-20 skeleton rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton w-full rounded" />
                      <div className="h-4 skeleton w-1/2 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-2 bg-white rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50">
                      {item.product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <PackageOpen className="size-6" />
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <Link 
                          href={`/products/${item.productId}`}
                          onClick={() => setIsOpen(false)}
                          className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors"
                        >
                          {item.product?.name || "Sản phẩm không tồn tại"}
                        </Link>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-sm font-bold text-blue-600">
                          {item.product ? formatVND(item.product.price) : "---"}
                        </div>
                        <div className="flex items-center border border-gray-200 rounded-lg h-7">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-l-lg transition-colors"
                          >
                            −
                          </button>
                          <div className="w-8 text-center text-xs font-medium border-x border-gray-200 flex items-center justify-center">
                            {item.quantity}
                          </div>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {user && items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Tổng tạm tính:</span>
              <span className="text-xl font-extrabold text-blue-600">{formatVND(subtotal)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link 
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="btn-brand w-full py-3 flex items-center justify-center gap-2"
              >
                Tiến hành thanh toán <ChevronRight className="size-4" />
              </Link>
              <Link 
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors block"
              >
                Xem chi tiết giỏ hàng
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
