package com.miniecommerce.catalog.notification;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType; // ORDER_STATUS, PROMOTION, SYSTEM, INVENTORY

    @Column(name = "reference_url", length = 500)
    private String referenceUrl;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Notification() {}

    public Notification(UUID userId, String title, String message, String notificationType, String referenceUrl) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType != null ? notificationType : "SYSTEM";
        this.referenceUrl = referenceUrl;
        this.isRead = false;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getNotificationType() { return notificationType; }
    public String getReferenceUrl() { return referenceUrl; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public Instant getCreatedAt() { return createdAt; }
}
