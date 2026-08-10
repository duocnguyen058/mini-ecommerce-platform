"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, CheckCircle2, ShieldCheck, Truck, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";
import { QuantityInput } from "@/components/quantity-input";
import { RatingStars } from "@/components/rating-stars";
import { ProductReviews } from "@/components/product-reviews";
import { ProductCard } from "@/components/product-card";
import { productApi, formatVND } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);

  const { addToCart, pending } = useAddToCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(productId);

  useEffect(() => {
    async function loadProductData() {
      setLoading(true);
      setError(null);
      try {
        const p = await productApi.getById(productId);
        setProduct(p);

        // Load related products from same category or fallback list
        try {
          const res = await productApi.list({
            category: p.category?.slug,
            size: 5,
          });
          const filtered = res.content.filter((item) => item.id !== p.id);
          setRelatedProducts(filtered.slice(0, 4));
        } catch {
          // ignore related products error
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không tìm thấy sản phẩm hoặc xảy ra lỗi tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      void loadProductData();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
          <div className="space-y-4 lg:col-span-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold text-destructive">Không tìm thấy sản phẩm</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Sản phẩm không tồn tại."}</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Quay về trang sản phẩm
          </Button>
        </Card>
      </div>
    );
  }

  const categoryName = product.category?.name ?? "Sản phẩm";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Sản phẩm", href: "/" },
          { label: categoryName, href: `/?category=${product.category?.slug ?? ""}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Info Grid */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Product Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-muted/50 to-muted shadow-xs">
            {product.imageUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl font-bold text-muted-foreground/30">
                  {product.name?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}

            {product.category && (
              <Badge className="absolute top-4 left-4 text-xs shadow-md">
                {product.category.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">SKU: {product.sku}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <CheckCircle2 className="size-3.5" /> Còn hàng trong kho
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-3 pt-1">
              <RatingStars rating={4.8} size="md" showNumber totalReviews={24} />
              <span className="text-xs text-muted-foreground">| Đã bán 120+</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="rounded-xl border bg-primary/5 p-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-primary tabular-nums">
              {formatVND(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">Đã bao gồm thuế VAT</span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Mô tả sản phẩm</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {product.description || "Sản phẩm chính hãng với tiêu chuẩn chất lượng cao, bảo hành đầy đủ. Hãy sở hữu ngay hôm nay với mức giá ưu đãi tốt nhất."}
            </p>
          </div>

          {/* Quantity & Add to Cart Action */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">Số lượng:</span>
              <QuantityInput value={qty} onChange={setQty} size="lg" disabled={pending} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 text-base font-bold shadow-md h-12"
                disabled={pending}
                onClick={() => addToCart(product.id, qty)}
              >
                <ShoppingCart className="size-5" />
                Thêm vào giỏ hàng
              </Button>
              <Button
                size="lg"
                variant={liked ? "destructive" : "outline"}
                className="h-12 font-bold gap-2 px-4"
                onClick={() => toggleWishlist(product.id, product.name)}
              >
                <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
                <span>{liked ? "Đã thích" : "Yêu thích"}</span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 font-bold"
                onClick={async () => {
                  await addToCart(product.id, qty);
                  router.push("/cart");
                }}
              >
                Mua ngay
              </Button>
            </div>
          </div>

          {/* Service badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-lg bg-muted/40">
              <Truck className="size-5 text-primary" />
              <span>Giao hàng toàn quốc</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-lg bg-muted/40">
              <ShieldCheck className="size-5 text-primary" />
              <span>Bảo hành chính hãng</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-lg bg-muted/40">
              <RefreshCw className="size-5 text-primary" />
              <span>Đổi trả trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <ProductReviews productId={product.id} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Sản phẩm liên quan</h2>
            <Link href={`/?category=${product.category?.slug ?? ""}`} className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                addToCart={addToCart}
                pending={pending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
