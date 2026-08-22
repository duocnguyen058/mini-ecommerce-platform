package com.miniecommerce.identity.auth;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miniecommerce.identity.shared.ResourceNotFoundException;
import com.miniecommerce.identity.user.User;
import com.miniecommerce.identity.user.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private User resolveUser(String principal) {
        try {
            UUID id = UUID.fromString(principal);
            return userRepository.findById(id)
                .or(() -> userRepository.findByUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("User", principal));
        } catch (IllegalArgumentException e) {
            return userRepository.findByUsername(principal)
                .orElseThrow(() -> new ResourceNotFoundException("User", principal));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication.getName());
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        User user = resolveUser(authentication.getName());

        // Only allow updating fullName and phone – email and username are immutable
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone().trim().isEmpty() ? null : request.phone().trim());
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
            .map(UserResponse::from)
            .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Admin: chỉnh sửa thông tin người dùng (họ tên, số điện thoại, trạng thái kích hoạt).
     * Email và username không thể thay đổi.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserByAdmin(
            @PathVariable UUID id,
            @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone().trim().isEmpty() ? null : request.phone().trim());
        }
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }
}


