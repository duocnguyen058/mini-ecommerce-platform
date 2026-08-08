package com.miniecommerce.identity.config;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtConfig jwtConfig;

    public JwtService(JwtEncoder jwtEncoder, JwtConfig jwtConfig) {
        this.jwtEncoder = jwtEncoder;
        this.jwtConfig = jwtConfig;
    }

    public String generateToken(Authentication authentication) {
        // Mặc định fallback: sub = authentication.getName() (thường là username).
        // Các service khác (cart/order/inventory) parse sub như UUID nên sẽ fail.
        // Ưu tiên dùng generateToken(Authentication, UUID) để đặt sub = userId UUID.
        return generateToken(authentication, null);
    }

    /**
     * Sinh JWT với subject = userId UUID. Các microservice downstream
     * (cart/order/inventory) gọi {@code UUID.fromString(jwt.getSubject())}
     * để lấy userId — bắt buộc subject phải là UUID string.
     */
    public String generateToken(Authentication authentication, UUID userId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtConfig.expirationMs());

        Set<String> roles = authentication.getAuthorities().stream()
            .map(authority -> authority == null ? null : authority.getAuthority())
            .collect(Collectors.toSet());

        String subject = userId != null ? userId.toString() : authentication.getName();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("mini-ecommerce")
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(subject)
            .claim("roles", roles)
            .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
