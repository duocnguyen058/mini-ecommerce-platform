"use client";

import React, { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
  className,
}: QuantityInputProps) {
  const [inputValue, setInputValue] = useState<string>(String(value));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(String(value));
  }, [value]);

  function handleMinus() {
    if (disabled || value <= min) return;
    const next = Math.max(min, value - 1);
    setInputValue(String(next));
    onChange(next);
  }

  function handlePlus() {
    if (disabled || value >= max) return;
    const next = Math.min(max, value + 1);
    setInputValue(String(next));
    onChange(next);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only accept numeric digits
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9]/g, "");
    setInputValue(cleaned);
  }

  function handleBlur() {
    if (!inputValue || inputValue === "") {
      setInputValue(String(min));
      onChange(min);
      return;
    }
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < min) {
      setInputValue(String(min));
      onChange(min);
    } else if (num > max) {
      setInputValue(String(max));
      onChange(max);
    } else {
      setInputValue(String(num));
      onChange(num);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleBlur();
    }
  }

  const buttonSizes = {
    sm: "size-7 text-xs",
    md: "size-8 text-sm",
    lg: "size-10 text-base",
  };

  const inputSizes = {
    sm: "h-7 w-10 text-xs",
    md: "h-8 w-12 text-sm",
    lg: "h-10 w-16 text-base font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-background shadow-xs",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-r-none border-r px-0 shrink-0", buttonSizes[size])}
        disabled={disabled || value <= min}
        onClick={handleMinus}
        aria-label="Giảm số lượng"
      >
        <Minus className="size-3.5" />
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "rounded-none border-none text-center font-medium tabular-nums shadow-none focus-visible:ring-0 p-0 focus:bg-accent/40 transition-colors",
          inputSizes[size]
        )}
        aria-label="Số lượng"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-l-none border-l px-0 shrink-0", buttonSizes[size])}
        disabled={disabled || value >= max}
        onClick={handlePlus}
        aria-label="Tăng số lượng"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
