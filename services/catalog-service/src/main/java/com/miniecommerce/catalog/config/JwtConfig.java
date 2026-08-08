package com.miniecommerce.catalog.config;

import java.security.interfaces.RSAPublicKey;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình JWT resource server cho catalog-service — mirror từ order-service.
 * <p>
 * {@code publicKey}: PEM-encoded RSA public key dùng để verify JWT signature.
 * Phát hành bởi identity-service.
 * <p>
 * {@code issuer}: kiểm tra {@code iss} claim để chống token từ issuer khác.
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtConfig(RSAPublicKey publicKey, String issuer) {
}
