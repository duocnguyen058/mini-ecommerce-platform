"use client";

import { useMemo } from "react";
import { getMockReviews, type ReviewSummary } from "@/lib/mock-reviews";
import { RatingStars } from "@/components/rating-stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const data: ReviewSummary = useMemo(() => getMockReviews(productId), [productId]);

  return (
    <Card className="rounded-xl border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Đánh giá sản phẩm ({data.totalReviews})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary Header */}
        <div className="grid gap-6 rounded-lg bg-muted/30 p-4 sm:grid-cols-12 sm:items-center">
          {/* Average score column */}
          <div className="flex flex-col items-center justify-center text-center sm:col-span-4 sm:border-r sm:border-border/60">
            <span className="text-4xl font-extrabold text-foreground tabular-nums">
              {data.averageRating.toFixed(1)}
            </span>
            <div className="mt-1">
              <RatingStars rating={data.averageRating} size="lg" />
            </div>
            <span className="mt-1.5 text-xs text-muted-foreground">
              Dựa trên {data.totalReviews} đánh giá từ khách hàng
            </span>
          </div>

          {/* Distribution breakdown bar chart column */}
          <div className="space-y-2 sm:col-span-8">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.distribution[star as keyof typeof data.distribution];
              const percentage = Math.round((count / data.totalReviews) * 100);
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
          {data.reviews.map((rev) => {
            const initial = rev.reviewerName[0]?.toUpperCase() ?? "U";
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
                          {rev.reviewerName}
                        </span>
                        {rev.verifiedPurchase && (
                          <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-[10px] text-green-700 dark:bg-green-950/40 dark:text-green-300">
                            <CheckCircle2 className="size-3 text-green-600" />
                            Đã mua hàng
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {rev.date}
                      </span>
                    </div>
                  </div>

                  <RatingStars rating={rev.rating} size="sm" />
                </div>

                <p className="text-sm leading-relaxed text-foreground/90 pl-10">
                  {rev.comment}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
