"use client";

import { useEffect, useState } from "react";
import { categoryApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Check, DollarSign, RotateCcw, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Điện thoại", slug: "dien-thoai" },
  { id: "2", name: "Máy tính xách tay", slug: "may-tinh-xach-tay" },
  { id: "3", name: "Máy tính bảng", slug: "may-tinh-bang" },
  { id: "4", name: "Đồng hồ thông minh", slug: "dong-ho-thong-minh" },
  { id: "5", name: "Tai nghe", slug: "tai-nghe" },
  { id: "6", name: "Phụ kiện công nghệ", slug: "phu-kien-cong-nghe" },
  { id: "7", name: "Màn hình", slug: "man-hinh" },
  { id: "8", name: "Loa", slug: "loa" },
  { id: "9", name: "Đồ gia dụng", slug: "do-gia-dung" },
];

export interface PriceRangePreset {
  label: string;
  min?: number;
  max?: number;
}

export const PRICE_PRESETS: PriceRangePreset[] = [
  { label: "Tất cả mức giá" },
  { label: "Dưới 5 triệu", max: 5000000 },
  { label: "5 - 15 triệu", min: 5000000, max: 15000000 },
  { label: "15 - 30 triệu", min: 15000000, max: 30000000 },
  { label: "Trên 30 triệu", min: 30000000 },
];

interface CategoryFilterProps {
  selectedSlug?: string;
  onSelectCategory: (slug?: string) => void;
  showWishlistOnly?: boolean;
  onSelectWishlist?: () => void;
  wishlistCount?: number;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min?: number, max?: number) => void;
  className?: string;
}

export function CategoryFilter({
  selectedSlug,
  onSelectCategory,
  showWishlistOnly = false,
  onSelectWishlist,
  wishlistCount = 0,
  minPrice,
  maxPrice,
  onPriceChange,
  className,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom price input state
  const [customMin, setCustomMin] = useState<string>(minPrice != null ? String(minPrice) : "");
  const [customMax, setCustomMax] = useState<string>(maxPrice != null ? String(maxPrice) : "");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const list = await categoryApi.list();
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
        } else {
          setCategories(DEFAULT_FALLBACK_CATEGORIES);
        }
      } catch {
        setCategories(DEFAULT_FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    }
    void fetchCategories();
  }, []);

  function handleApplyCustomPrice() {
    if (!onPriceChange) return;
    const minVal = customMin ? parseInt(customMin.replace(/[^0-9]/g, ""), 10) : undefined;
    const maxVal = customMax ? parseInt(customMax.replace(/[^0-9]/g, ""), 10) : undefined;
    onPriceChange(isNaN(minVal!) ? undefined : minVal, isNaN(maxVal!) ? undefined : maxVal);
  }

  function handlePresetClick(preset: PriceRangePreset) {
    if (!onPriceChange) return;
    setCustomMin(preset.min != null ? String(preset.min) : "");
    setCustomMax(preset.max != null ? String(preset.max) : "");
    onPriceChange(preset.min, preset.max);
  }

  const isPriceActive = minPrice != null || maxPrice != null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Category Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <LayoutGrid className="size-4 text-primary" />
            <span>Danh mục sản phẩm</span>
          </h2>
          {selectedSlug && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={() => onSelectCategory(undefined)}
            >
              Bỏ lọc
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full rounded-lg bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-row overflow-x-auto pb-2 md:flex-col md:pb-0 gap-1.5 no-scrollbar scroll-smooth">
            <Button
              type="button"
              variant={!selectedSlug && !showWishlistOnly ? "default" : "ghost"}
              size="sm"
              className={cn(
                "justify-between font-medium text-xs sm:text-sm shrink-0 md:w-full rounded-lg",
                !selectedSlug && !showWishlistOnly
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelectCategory(undefined)}
            >
              <span>Tất cả sản phẩm</span>
              {!selectedSlug && !showWishlistOnly && <Check className="size-4 ml-2" />}
            </Button>

            {/* Wishlist Filter Button */}
            {onSelectWishlist && (
              <Button
                type="button"
                variant={showWishlistOnly ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "justify-between font-medium text-xs sm:text-sm shrink-0 md:w-full rounded-lg",
                  showWishlistOnly
                    ? "bg-red-500 text-white font-semibold shadow-xs hover:bg-red-600"
                    : "hover:bg-red-50 text-muted-foreground hover:text-red-600 dark:hover:bg-red-950/30"
                )}
                onClick={onSelectWishlist}
              >
                <span className="flex items-center gap-1.5">
                  <Heart className={cn("size-3.5", showWishlistOnly ? "fill-current" : "")} />
                  Yêu thích ({wishlistCount})
                </span>
                {showWishlistOnly && <Check className="size-4 ml-2 shrink-0" />}
              </Button>
            )}

            {categories.map((cat) => {
              const isSelected = selectedSlug === cat.slug;
              return (
                <Button
                  key={cat.id}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "justify-between font-medium text-xs sm:text-sm shrink-0 md:w-full rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onSelectCategory(cat.slug)}
                >
                  <span className="truncate max-w-[160px] md:max-w-none text-left">
                    {cat.name}
                  </span>
                  {isSelected && <Check className="size-4 ml-2 shrink-0" />}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Range Filter Section */}
      {onPriceChange && (
        <div className="space-y-3 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <DollarSign className="size-4 text-primary" />
              <span>Lọc theo khoảng giá</span>
            </h2>
            {isPriceActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary gap-1"
                onClick={() => {
                  setCustomMin("");
                  setCustomMax("");
                  onPriceChange(undefined, undefined);
                }}
              >
                <RotateCcw className="size-3" /> Đặt lại
              </Button>
            )}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset, idx) => {
              const isSelected =
                preset.min === minPrice && preset.max === maxPrice;
              return (
                <Button
                  key={idx}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs px-2.5 rounded-full",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          {/* Custom Min / Max Inputs */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Từ (đ)"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="h-8 text-xs px-2.5"
              />
              <Input
                type="number"
                placeholder="Đến (đ)"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="h-8 text-xs px-2.5"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full h-8 text-xs font-semibold"
              onClick={handleApplyCustomPrice}
            >
              Áp dụng khoảng giá
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
