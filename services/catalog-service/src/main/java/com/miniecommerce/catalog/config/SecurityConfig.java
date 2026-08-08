package com.miniecommerce.catalog.config;

import java.security.interfaces.RSAPublicKey;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security config cho catalog-service — JWT resource server, stateless.
 * <p>
 * Public read endpoints (GET /api/products, /api/products/&#42;&#42;, GET /api/categories,
 * /api/categories/&#42;&#42;) mở cho khách vãng lai (không cần JWT) — đúng practice
 * E-commerce (khách browse catalog trước khi đăng ký). Tất cả method khác
 * (POST/PUT/PATCH/DELETE trên /api/admin/&#42;) yêu cầu JWT + ADMIN.
 * <p>
 * Phân quyền cụ thể dùng {@code @PreAuthorize("hasRole('ADMIN')")} trên controller
 * method — {@link EnableMethodSecurity} bật tính năng này.
 * <p>
 * Riêng {@code /actuator/health} public để docker healthcheck.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final RSAPublicKey publicKey;
	private final String issuer;

	public SecurityConfig(JwtConfig jwtConfig) {
		this.publicKey = jwtConfig.publicKey();
		this.issuer = jwtConfig.issuer();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.formLogin(form -> form.disable())
			.httpBasic(basic -> basic.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/health").permitAll()
				// Public read cho catalog — khách vãng lai browse được.
				.requestMatchers(org.springframework.http.HttpMethod.GET,
					"/api/products", "/api/products/**",
					"/api/categories", "/api/categories/**").permitAll()
				.anyRequest().authenticated()
			)
			.oauth2ResourceServer(oauth2 -> oauth2
				.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
			);
		return http.build();
	}

	@Bean
	JwtDecoder jwtDecoder() {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();
		decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
		return decoder;
	}

	@Bean
	JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
		grantedAuthoritiesConverter.setAuthorityPrefix("");
		grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");

		JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
		jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
		return jwtAuthenticationConverter;
	}
}
