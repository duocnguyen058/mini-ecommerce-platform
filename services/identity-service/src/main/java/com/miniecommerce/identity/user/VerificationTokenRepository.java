package com.miniecommerce.identity.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
