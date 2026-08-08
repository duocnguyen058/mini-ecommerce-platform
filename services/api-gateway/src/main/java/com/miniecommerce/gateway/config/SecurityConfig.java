package com.miniecommerce.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
public class SecurityConfig {

	@Bean
	@SuppressWarnings("null")
	SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		return http
			.csrf(ServerHttpSecurity.CsrfSpec::disable)
			.formLogin(ServerHttpSecurity.FormLoginSpec::disable)
			.httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
			.authorizeExchange(authorize -> authorize.anyExchange().permitAll())
			.build();
	}
}

