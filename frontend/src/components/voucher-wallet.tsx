"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { couponApi, formatVND } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Coupon } from "@/lib/types";
import { Ticket, X, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

interface VoucherWalletProps {
  orderAmount: number;
  onApply: (code: string, discountAmount: number) => void;
  appliedCode?: string | null;
}

export function VoucherWallet({ orderAmount, onApply, appliedCode }: VoucherWalletProps) {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleApplyCode = async (code: string) => {
    const finalCode = code.trim().toUpperCase();
    if (!finalCode) return;
    
    setLoading(true);
    try {
      const res = await couponApi.validate(finalCode, orderAmount);
      if (res.valid) {
        toast.success({ title: "Áp dụng thành công", description: `Giảm ${formatVND(res.discountAmount)}` });
        onApply(finalCode, res.discountAmount);
        setOpen(false);
      } else {
        toast.error({ title: "Không hợp lệ", description: res.message });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mã voucher không hợp lệ.";
      toast.error({ title: "Lỗi", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    if (coupons !== null) return;
    setLoadingCoupons(true);
    try {
      const data = await couponApi.listAvailable();
      setCoupons(data);
    } catch (err) {
      toast.error({ title: "Lỗi", description: "Không thể tải danh sách voucher." });
    } finally {
      setLoadingCoupons(false);
    }
  };

  const toggleDropdown = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      loadCoupons();
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 border border-brand-200 bg-brand-50 rounded-xl">
        <div className="flex items-center gap-2 text-brand-700">
          <CheckCircle2 className="size-5 text-green-500 shrink-0" />
          <span className="text-sm font-medium">Đã áp dụng:</span>
          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-brand-800 border border-brand-100">{appliedCode}</span>
        </div>
        <button 
          onClick={() => onApply('', 0)} 
          className="text-brand-500 hover:text-brand-700 p-1.5 rounded-full hover:bg-brand-100 transition-colors"
          title="Gỡ mã giảm giá"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <Input 
          placeholder="Nhập mã giảm giá..." 
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          className="rounded-full border-gray-300 focus-visible:ring-brand-500 font-mono text-sm px-4"
        />
        <Button 
          disabled={loading || !inputCode.trim()} 
          onClick={() => handleApplyCode(inputCode)}
          className="rounded-full px-5 font-bold btn-brand h-10 shrink-0"
        >
          Áp dụng
        </Button>
      </div>
      
      <div>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={toggleDropdown}
          className="w-full text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg justify-between border border-transparent hover:border-brand-100 font-medium h-9"
        >
          <span className="flex items-center gap-2"><Ticket className="size-4" /> Xem voucher có sẵn</span>
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </Button>

        {open && (
          <div className="mt-2 w-full bg-white rounded-xl overflow-hidden shadow-xl border border-brand-100 z-50 transition-all">
            <div className="bg-brand-50 border-b border-brand-100 px-4 py-2.5 font-semibold text-brand-900 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5"><Ticket className="size-3.5 text-brand-500" /> Danh sách Voucher</span>
              <span className="text-[11px] text-brand-600 font-normal">Click để áp dụng</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-2.5 space-y-2.5 bg-gray-50/50">
              {loadingCoupons ? (
                <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Đang tải voucher...</div>
              ) : coupons?.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Hiện chưa có voucher nào.</div>
              ) : (
                coupons?.map((c) => {
                  const isEligible = orderAmount >= c.minOrderAmount;
                  return (
                    <div 
                      key={c.id} 
                      className={`relative bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col transition-all ${
                        isEligible ? "border-gray-200 hover:border-brand-300" : "border-gray-100 opacity-80"
                      }`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isEligible ? "bg-brand" : "bg-gray-300"}`}></div>
                      <div className="p-2.5 pl-3.5 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 truncate">
                              {c.code}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-800">
                            Giảm {c.discountType === 'PERCENT' ? `${c.discountValue}%` : formatVND(c.discountValue)}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Đơn tối thiểu {formatVND(c.minOrderAmount)}</p>
                        </div>
                        <div className="shrink-0">
                          <Button 
                            type="button"
                            size="sm" 
                            disabled={loading || !isEligible}
                            onClick={() => {
                              setInputCode(c.code);
                              handleApplyCode(c.code);
                            }}
                            className={`rounded-full h-7 px-3 text-[11px] font-semibold ${
                              isEligible ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-gray-100 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            Dùng ngay
                          </Button>
                        </div>
                      </div>
                      {!isEligible && (
                        <div className="px-3 py-1 bg-amber-50/70 text-[10px] text-amber-700 border-t border-gray-100 flex items-center gap-1">
                          <AlertCircle className="size-3 shrink-0" /> Chưa đủ điều kiện áp dụng
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
