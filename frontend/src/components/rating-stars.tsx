"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number; // 0 to 5
  max?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  totalReviews?: number;
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  size = "md",
  showNumber = false,
  totalReviews,
  className,
}: RatingStarsProps) {
  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  };

  const roundedRating = Math.round(rating * 10) / 10;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${roundedRating}/${max} sao`}>
        {Array.from({ length: max }).map((_, index) => {
          const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));

          if (fillPercentage >= 100) {
            return (
              <Star
                key={index}
                className={cn("fill-amber-400 text-amber-400 shrink-0", iconSizes[size])}
              />
            );
          } else if (fillPercentage > 0) {
            return (
              <div key={index} className="relative shrink-0">
                <Star className={cn("text-muted-foreground/30 shrink-0", iconSizes[size])} />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={cn("fill-amber-400 text-amber-400 shrink-0", iconSizes[size])} />
                </div>
              </div>
            );
          } else {
            return (
              <Star
                key={index}
                className={cn("text-muted-foreground/30 shrink-0", iconSizes[size])}
              />
            );
          }
        })}
      </div>

      {showNumber && (
        <span className="font-semibold text-sm text-foreground tabular-nums">
          {roundedRating.toFixed(1)}
        </span>
      )}

      {totalReviews != null && (
        <span className="text-xs text-muted-foreground">
          ({totalReviews})
        </span>
      )}
    </div>
  );
}
