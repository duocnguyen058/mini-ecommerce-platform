package com.miniecommerce.catalog.review;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public ResponseEntity<Page<ProductReview>> getReviews(
            @PathVariable UUID productId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(reviewRepository.findByProductId(productId, pageable));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getReviewSummary(@PathVariable UUID productId) {
        Map<String, Object> summary = new HashMap<>();
        long star5 = reviewRepository.countByProductIdAndRating(productId, 5);
        long star4 = reviewRepository.countByProductIdAndRating(productId, 4);
        long star3 = reviewRepository.countByProductIdAndRating(productId, 3);
        long star2 = reviewRepository.countByProductIdAndRating(productId, 2);
        long star1 = reviewRepository.countByProductIdAndRating(productId, 1);
        long total = star5 + star4 + star3 + star2 + star1;

        double avg = total > 0 ? (double) (star5 * 5 + star4 * 4 + star3 * 3 + star2 * 2 + star1 * 1) / total : 5.0;

        summary.put("totalReviews", total);
        summary.put("averageRating", Math.round(avg * 100.0) / 100.0);
        summary.put("starBreakdown", Map.of("5", star5, "4", star4, "3", star3, "2", star2, "1", star1));
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<ProductReview> addReview(
            @PathVariable UUID productId,
            @RequestBody ProductReview reviewReq
    ) {
        ProductReview review = new ProductReview(
                productId,
                reviewReq.getUserId() != null ? reviewReq.getUserId() : UUID.randomUUID(),
                reviewReq.getUserName() != null ? reviewReq.getUserName() : "Khách hàng",
                reviewReq.getUserAvatar(),
                reviewReq.getRating() > 0 ? reviewReq.getRating() : 5,
                reviewReq.getContent(),
                true
        );
        return ResponseEntity.ok(reviewRepository.save(review));
    }
}
