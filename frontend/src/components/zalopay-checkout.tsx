"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";

interface ZaloPayCheckoutProps {
  orderId: string;
  orderAmount: number;
  userId: string;
  onSuccess?: () => void;
  onFailed?: () => void;
}

export function ZaloPayCheckout({
  orderId,
  orderAmount,
  userId,
  onSuccess,
  onFailed,
}: ZaloPayCheckoutProps) {
  const [paymentState, setPaymentState] = useState<'idle' | 'creating' | 'waiting' | 'success' | 'failed'>('idle');
  const [orderUrl, setOrderUrl] = useState<string | null>(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentState === 'waiting') {
      isPollingRef.current = true;
      interval = setInterval(async () => {
        if (!isPollingRef.current) return;
        try {
          const res = await paymentApi.getByOrderId(orderId);
          if (res && res.status === 'SUCCESS') {
            setPaymentState('success');
            isPollingRef.current = false;
            clearInterval(interval);
            toast.success({ title: "Thanh toán thành công!", description: "Đơn hàng đã được thanh toán qua ZaloPay." });
            setTimeout(() => onSuccess?.(), 1500);
          } else if (res && res.status === 'FAILED') {
            setPaymentState('failed');
            isPollingRef.current = false;
            clearInterval(interval);
            onFailed?.();
          }
        } catch {
          // Bỏ qua lỗi tạm thời trong lúc chờ webhook cập nhật trạng thái
        }
      }, 3000);
    }
    return () => {
      isPollingRef.current = false;
      clearInterval(interval);
    };
  }, [paymentState, orderId, onSuccess, onFailed]);

  const handlePay = async () => {
    try {
      setPaymentState('creating');
      const res = await paymentApi.createZaloPay({
        orderId,
        userId: userId || "anonymous",
        amount: orderAmount,
        description: `Thanh toán đơn hàng #${orderId.slice(0, 8)}`,
      });
      if (res && res.orderUrl) {
        setOrderUrl(res.orderUrl);
        window.open(res.orderUrl, '_blank');
        setPaymentState('waiting');
      } else {
        toast.error({ title: "Lỗi tạo thanh toán", description: "Không nhận được URL thanh toán từ ZaloPay." });
        setPaymentState('idle');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể khởi tạo cổng thanh toán ZaloPay.";
      toast.error({ title: "Lỗi thanh toán", description: msg });
      setPaymentState('idle');
    }
  };

  if (paymentState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
        <CheckCircle2 className="size-12 text-emerald-600 animate-in zoom-in" />
        <p className="text-emerald-900 font-bold text-base">Thanh toán ZaloPay thành công! 🎉</p>
        <p className="text-emerald-700 text-xs">Đang chuyển hướng tới chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (paymentState === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <XCircle className="size-12 text-red-600" />
        <p className="text-red-900 font-bold text-base">Thanh toán thất bại hoặc đã hết hạn.</p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => setPaymentState('idle')} className="rounded-xl">
            Thử lại
          </Button>
          <Button onClick={onFailed} className="rounded-xl bg-gray-800 text-white">
            Xem đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  if (paymentState === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-blue-50/70 border border-blue-200 rounded-xl space-y-4 text-center">
        <Loader2 className="size-8 text-[#0068FF] animate-spin" />
        <div>
          <p className="text-blue-950 font-bold text-base">Đang chờ xác nhận thanh toán...</p>
          <p className="text-blue-700 text-xs mt-1">Vui lòng quét mã QR hoặc hoàn tất thanh toán trên ứng dụng ZaloPay</p>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {orderUrl && (
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0068FF] text-white text-xs font-semibold rounded-lg hover:bg-[#0052cc] transition-colors"
            >
              <ExternalLink className="size-3.5" /> Mở lại trang ZaloPay
            </a>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              isPollingRef.current = false;
              setPaymentState('idle');
            }} 
            className="rounded-lg border-blue-200 text-blue-800 hover:bg-blue-100 text-xs"
          >
            Hủy chờ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePay}
      disabled={paymentState === 'creating'}
      className="w-full h-12 bg-[#0068FF] hover:bg-[#0052cc] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
    >
      {paymentState === 'creating' ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <div className="flex items-center justify-center w-6 h-6 bg-white text-[#0068FF] rounded-md font-extrabold text-xs mr-1 shadow-xs">
          Z
        </div>
      )}
      {paymentState === 'creating' ? 'Đang kết nối ZaloPay...' : 'Thanh toán ngay qua ZaloPay'}
    </Button>
  );
}
