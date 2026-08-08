"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { productApi, formatVND, type ProductQuery } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import type { Page, Product } from "@/lib/types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [pageNum, setPageNum] = useState(0);
  const [size] = useState(12);
  const { addToCart, pending } = useAddToCart();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: ProductQuery = { page: pageNum, size, q: appliedQ || undefined };
      const data = await productApi.list(query);
      setProducts(data.content);
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong tai duoc danh sach san pham");
      setProducts([]);
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [pageNum, size, appliedQ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPageNum(0);
    setAppliedQ(q.trim());
  }

  function gotoPage(n: number) {
    setPageNum(n);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">San pham</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Khám phá danh mục sản phẩm từ catalog-service.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tim theo ten hoac SKU..."
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Tim
        </Button>
        {appliedQ && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              setAppliedQ("");
              setPageNum(0);
            }}
          >
            Xoa loc
          </Button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-40 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Products grid */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Khong co san pham nao phu hop.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                addToCart={addToCart}
                pending={pending}
              />
            ))}
          </div>

          {/* Pagination */}
          {page && (page.page?.totalPages ?? 0) > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page.page?.first ?? false}
                onClick={() => gotoPage((page.page?.number ?? 0) - 1)}
              >
                Truoc
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {(page.page?.number ?? 0) + 1} / {page.page?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page.page?.last ?? false}
                onClick={() => gotoPage((page.page?.number ?? 0) + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({
  product,
  addToCart,
  pending,
}: {
  product: Product;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  pending: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  return (
    <Card key={product.id} className="h-full">
      <CardHeader>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted/60 to-muted">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/40">
                {product.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-8">
          {product.description || "San pham tu catalog."}
        </CardDescription>
        {product.category && (
          <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {product.category.name}
          </span>
        )}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-primary">{formatVND(product.price)}</span>
          <span className="text-xs text-muted-foreground">/ SKU: {product.sku}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <div className="flex items-center rounded-md border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => setQty((v) => Math.max(1, v - 1))}
            aria-label="Giam so luong"
          >
            &ndash;
          </Button>
          <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => setQty((v) => Math.min(99, v + 1))}
            aria-label="Tang so luong"
          >
            +
          </Button>
        </div>
        <Button
          type="button"
          className="ml-auto"
          disabled={pending}
          onClick={() => addToCart(product.id, qty)}
        >
          Them vao gio
        </Button>
      </CardFooter>
    </Card>
  );
}
