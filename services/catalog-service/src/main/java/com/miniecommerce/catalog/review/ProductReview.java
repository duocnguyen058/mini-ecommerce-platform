package com.miniecommerce.catalog.review;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_reviews")
public class ProductReview {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(name = "user_avatar", length = 500)
    private String userAvatar;

    @Column(nullable = false)
    private int rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_verified_purchase", nullable = false)
    private boolean isVerifiedPurchase;

    @Column(name = "likes_count", nullable = false)
    private int likesCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProductReview() {
    }

    public ProductReview(UUID productId, UUID userId, String userName, String userAvatar, int rating, String content, boolean isVerifiedPurchase) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.rating = rating;
        this.content = content;
        this.isVerifiedPurchase = isVerifiedPurchase;
        this.likesCount = 0;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserAvatar() {
        return userAvatar;
    }

    public int getRating() {
        return rating;
    }

    public String getContent() {
        return content;
    }

    public boolean isVerifiedPurchase() {
        return isVerifiedPurchase;
    }

    public int getLikesCount() {
        return likesCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
