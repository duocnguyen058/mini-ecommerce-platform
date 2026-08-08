package com.miniecommerce.cart.shared.config;

import java.security.interfaces.RSAPublicKey;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtConfig(RSAPublicKey publicKey, String issuer) {
}
