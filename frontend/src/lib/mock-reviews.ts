export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: Review[];
}

const SAMPLE_NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Mai",
  "Lê Hoàng Nam",
  "Phạm Đức Minh",
  "Vũ Thị Lan",
  "Hoàng Anh Tuấn",
  "Đỗ Quỳnh Trang",
  "Bùi Quốc Khánh",
];

const SAMPLE_COMMENTS = [
  "Sản phẩm rất tuyệt vời, đóng gói cẩn thận, giao hàng nhanh chóng. Sẽ ủng hộ shop dài dài!",
  "Chất lượng vượt mong đợi trong tầm giá. Dùng mượt mà, thiết kế đẹp mắt.",
  "Giao hàng nhanh, sản phẩm nguyên tem niêm phong. Đúng như mô tả của shop.",
  "Dùng được 1 tuần thấy rất hài lòng. Độ hoàn thiện tốt, pin trâu, máy mát.",
  "Shop tư vấn nhiệt tình. Hàng chính hãng 100%. Cho shop 5 sao chất lượng!",
  "Đã nhận hàng đầy đủ phụ kiện. Đóng gói 2 lớp bọt khí rất chắc chắn.",
  "Sản phẩm dùng tốt, xứng đáng với số tiền bỏ ra.",
  "Điểm 10 cho chất lượng phục vụ và sản phẩm!",
];

/**
 * Returns deterministic mock reviews for any productId.
 */
export function getMockReviews(productId: string): ReviewSummary {
  // Deterministic seed based on productId char codes
  let seed = 0;
  for (let i = 0; i < productId.length; i++) {
    seed += productId.charCodeAt(i);
  }

  const reviewCount = 4 + (seed % 5); // 4 to 8 reviews
  const reviews: Review[] = [];

  const now = new Date();

  for (let i = 0; i < reviewCount; i++) {
    const nameIndex = (seed + i) % SAMPLE_NAMES.length;
    const commentIndex = (seed * 3 + i * 2) % SAMPLE_COMMENTS.length;
    const rating = i === reviewCount - 1 && seed % 2 === 0 ? 4 : 5;

    const daysAgo = (i + 1) * 2 + (seed % 3);
    const reviewDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = reviewDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    reviews.push({
      id: `rev-${productId}-${i}`,
      reviewerName: SAMPLE_NAMES[nameIndex],
      rating,
      date: dateStr,
      comment: SAMPLE_COMMENTS[commentIndex],
      verifiedPurchase: true,
    });
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    distribution[r.rating as keyof typeof distribution]++;
    sum += r.rating;
  });

  const averageRating = Math.round((sum / reviews.length) * 10) / 10;

  return {
    averageRating,
    totalReviews: reviews.length + 18,
    distribution: {
      5: distribution[5] + 15,
      4: distribution[4] + 3,
      3: distribution[3],
      2: distribution[2],
      1: distribution[1],
    },
    reviews,
  };
}
