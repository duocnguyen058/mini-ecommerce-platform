"use client";

import { Zap, Truck, RefreshCw, ShieldCheck } from "lucide-react";

const MESSAGES = [
  { icon: <Truck className="w-3.5 h-3.5" />, text: "Miễn phí vận chuyển đơn từ 500.000₫" },
  { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Cam kết 100% hàng chính hãng" },
  { icon: <RefreshCw className="w-3.5 h-3.5" />, text: "Đổi trả miễn phí trong 7 ngày" },
  { icon: <Zap className="w-3.5 h-3.5" />, text: "Giao hàng nhanh 2 giờ nội thành" },
  { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Bảo hành chính hãng 12 tháng" },
];

export function AnnouncementBar() {
  // Nhân đôi messages để marquee chạy vô tận không gián đoạn
  const doubled = [...MESSAGES, ...MESSAGES];

  return (
    <aside className="announcement-bar select-none" aria-label="Thông báo khuyến mãi">
      <div className="announcement-marquee">
        {doubled.map((msg, i) => (
          <span key={i} className="announcement-item">
            {msg.icon}
            <span>{msg.text}</span>
            {i < doubled.length - 1 && <span className="announcement-divider">✦</span>}
          </span>
        ))}
      </div>
    </aside>
  );
}
