package com.miniecommerce.catalog.audit;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    private UUID id;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;

    @Column(nullable = false, length = 50)
    private String action; // CREATE, UPDATE, DELETE, PRICE_CHANGE, INVENTORY_CHANGE, STATUS_CHANGE

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "previous_value_json", columnDefinition = "TEXT")
    private String previousValueJson;

    @Column(name = "new_value_json", columnDefinition = "TEXT")
    private String newValueJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {}

    public AuditLog(UUID actorId, String actorName, String action, String entityName, UUID entityId,
                    String previousValueJson, String newValueJson) {
        this.id = UUID.randomUUID();
        this.actorId = actorId;
        this.actorName = actorName;
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.previousValueJson = previousValueJson;
        this.newValueJson = newValueJson;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getActorId() { return actorId; }
    public String getActorName() { return actorName; }
    public String getAction() { return action; }
    public String getEntityName() { return entityName; }
    public UUID getEntityId() { return entityId; }
    public String getPreviousValueJson() { return previousValueJson; }
    public String getNewValueJson() { return newValueJson; }
    public Instant getCreatedAt() { return createdAt; }
}
