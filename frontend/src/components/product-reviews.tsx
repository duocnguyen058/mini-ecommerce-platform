"use client";

import { useEffect, useState } from "react";
import { RatingStars } from "@/components/rating-stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ProductReviewsProps {
  productId: string;
}

interface ReviewItem {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

interface ReviewSummaryData {
  totalReviews: number;
  averageRating: number;
  starBreakdown: Record<string, number>;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryData>({
    totalReviews: 0,
    averageRating: 5.0,
    starBreakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      setLoading(true);
      try {
        const [reviewsRes, summaryRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/v1/products/${productId}/reviews?size=10`),
          fetch(`${API_BASE}/api/v1/products/${productId}/reviews/summary`),
        ]);

        if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
          const json = await reviewsRes.value.json();
          if (isMounted) {
            setReviews(json.content ?? json ?? []);
          }
        }

        if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
          const sumJson = await summaryRes.value.json();
          if (isMounted) {
            setSummary({
              totalReviews: sumJson.totalReviews ?? 0,
              averageRating: sumJson.averageRating ?? 5.0,
              starBreakdown: sumJson.starBreakdown ?? { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
            });
          }
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <Card className="rounded-xl border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <span>Đánh giá sản phẩm ({summary.totalReviews})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary Header */}
        <div className="grid gap-6 rounded-lg bg-muted/30 p-4 sm:grid-cols-12 sm:items-center">
          {/* Average score column */}
          <div className="flex flex-col items-center justify-center text-center sm:col-span-4 sm:border-r sm:border-border/60">
            <span className="text-4xl font-extrabold text-foreground tabular-nums">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "5.0"}
            </span>
            <div className="mt-1">
              <RatingStars rating={summary.averageRating} size="lg" />
            </div>
            <span className="mt-1.5 text-xs text-muted-foreground">
              {summary.totalReviews > 0
                ? `Dựa trên ${summary.totalReviews} đánh giá từ khách hàng`
                : "Chưa có đánh giá nào cho sản phẩm này"}
            </span>
          </div>

          {/* Distribution breakdown bar chart column */}
          <div className="space-y-2 sm:col-span-8">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.starBreakdown[String(star)] ?? 0;
              const percentage = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="flex w-12 items-center gap-1 font-medium text-muted-foreground">
                    {star} <span className="text-amber-400">★</span>
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review List */}
        <div className="divide-y divide-border/40 space-y-4 pt-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Đang tải đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
            </div>
          ) : (
            reviews.map((rev) => {
              const name = rev.userName || "Khách hàng";
              const initial = name[0]?.toUpperCase() ?? "K";
              const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("vi-VN") : "";
              return (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {name}
                          </span>
                          {rev.verifiedPurchase && (
                            <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-[10px] text-green-700 dark:bg-green-950/40 dark:text-green-300">
                              <CheckCircle2 className="size-3 text-green-600" />
                              Đã mua hàng
                            </Badge>
                          )}
                        </div>
                        {dateStr && (
                          <span className="text-[11px] text-muted-foreground">
                            {dateStr}
                          </span>
                        )}
                      </div>
                    </div>

                    <RatingStars rating={rev.rating} size="sm" />
                  </div>

                  <p className="text-sm leading-relaxed text-foreground/90 pl-10">
                    {rev.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
