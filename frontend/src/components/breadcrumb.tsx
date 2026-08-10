"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
  className?: string;
}

export function Breadcrumb({
  items,
  showBackButton = true,
  className,
}: BreadcrumbProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        {showBackButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground mr-1"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại</span>
          </Button>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          title="Trang chủ"
        >
          <Home className="size-4 text-muted-foreground/80" />
          <span className="sr-only">Trang chủ</span>
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-[220px] font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[180px] sm:max-w-[300px]",
                    isLast ? "font-semibold text-foreground" : "font-medium"
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
