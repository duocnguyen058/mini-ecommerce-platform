package com.miniecommerce.catalog.notification;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId.toString() == authentication.name or hasRole('ADMIN')")
    public ResponseEntity<Page<Notification>> getUserNotifications(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable));
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("#userId.toString() == authentication.name or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable UUID userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Notification> createNotification(@RequestBody Notification req) {
        Notification notification = new Notification(
                req.getUserId(),
                req.getTitle(),
                req.getMessage(),
                req.getNotificationType(),
                req.getReferenceUrl()
        );
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, org.springframework.security.core.Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        if (!notificationRepository.existsByIdAndUserId(id, userId)) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật thông báo này.");
        }
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/user/{userId}/read-all")
    @Transactional
    @PreAuthorize("#userId.toString() == authentication.name or hasRole('ADMIN')")
    public ResponseEntity<Void> markAllAsRead(@PathVariable UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
