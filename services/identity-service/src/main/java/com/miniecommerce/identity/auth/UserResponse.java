package com.miniecommerce.identity.auth;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.miniecommerce.identity.user.User;

public record UserResponse(
    UUID id,
    String username,
    String email,
    String fullName,
    String phone,
    boolean enabled,
    Set<String> roles,
    Instant createdAt,
    Instant updatedAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.isEnabled(),
            user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet()),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
