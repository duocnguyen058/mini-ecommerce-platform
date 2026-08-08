package com.miniecommerce.cart.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cart")
public record CartProperties(int ttlDays) {
}
