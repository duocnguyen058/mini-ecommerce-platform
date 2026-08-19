package com.miniecommerce.catalog.comment;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "comments")
public class Comment {

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

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin;

    @Column(name = "likes_count", nullable = false)
    private int likesCount;

    @Column(name = "report_count", nullable = false)
    private int reportCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Comment() {
    }

    public Comment(UUID productId, UUID userId, String userName, String userAvatar, String content, boolean isAdmin) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.content = content;
        this.isAdmin = isAdmin;
        this.likesCount = 0;
        this.reportCount = 0;
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

    public String getContent() {
        return content;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public int getLikesCount() {
        return likesCount;
    }

    public int getReportCount() {
        return reportCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
