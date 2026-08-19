package com.miniecommerce.catalog.category;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    private UUID id;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 140)
    private String slug;

    @Column(length = 100)
    private String icon;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "meta_title", length = 200)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "meta_keywords", length = 300)
    private String metaKeywords;

    @Column(name = "canonical_url", length = 500)
    private String canonicalUrl;

    @Column(name = "og_image", length = 500)
    private String ogImage;

    @Column(name = "structured_data", columnDefinition = "TEXT")
    private String structuredData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Category() {
    }

    public Category(String name, String slug) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.slug = slug;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Category(UUID parentId, String name, String slug, String icon) {
        this.id = UUID.randomUUID();
        this.parentId = parentId;
        this.name = name;
        this.slug = slug;
        this.icon = icon;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getParentId() {
        return parentId;
    }

    public void setParentId(UUID parentId) {
        this.parentId = parentId;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getBannerUrl() {
        return bannerUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getMetaTitle() {
        return metaTitle;
    }

    public String getMetaDescription() {
        return metaDescription;
    }

    public String getMetaKeywords() {
        return metaKeywords;
    }

    public String getCanonicalUrl() {
        return canonicalUrl;
    }

    public String getOgImage() {
        return ogImage;
    }

    public String getStructuredData() {
        return structuredData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
