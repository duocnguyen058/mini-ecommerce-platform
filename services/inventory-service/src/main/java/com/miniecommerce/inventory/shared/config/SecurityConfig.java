package com.miniecommerce.inventory.shared.config;

import java.security.interfaces.RSAPublicKey;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final RSAPublicKey publicKey;
	private final String issuer;
	private final InternalTokenFilter internalTokenFilter;

	public SecurityConfig(JwtConfig jwtConfig, InternalTokenFilter internalTokenFilter) {
		this.publicKey = jwtConfig.publicKey();
		this.issuer = jwtConfig.issuer();
		this.internalTokenFilter = internalTokenFilter;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			// Internal token filter chạy sớm — gán ROLE_SERVICE cho service-to-service
			// call hợp lệ (order-service). Không xung đột với JWT: các internal call
			// KHÔNG kèm Authorization header.
			.addFilterBefore(internalTokenFilter, UsernamePasswordAuthenticationFilter.class)
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/health").permitAll()
				.requestMatchers(HttpMethod.GET, "/inventory", "/inventory/**", "/api/inventory", "/api/inventory/**").permitAll()
				.requestMatchers("/admin/inventory/**", "/api/admin/inventory/**").hasAnyRole("ADMIN", "SERVICE")
				.requestMatchers(HttpMethod.PATCH, "/inventory/**", "/api/inventory/**").hasAnyRole("ADMIN", "SERVICE")
				.requestMatchers("/inventory/orders/**", "/inventory/reserve/**", "/inventory/reservations/**", "/api/inventory/orders/**", "/api/inventory/reserve/**", "/api/inventory/reservations/**").hasAnyRole("ADMIN", "SERVICE")
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

	/**
	 * Vô hiệu auto-registration servlet của InternalTokenFilter — filter chỉ được
	 * đăng ký trong security chain (addFilterBefore). Nếu để Spring Boot tự đăng ký
	 * sẽ chạy 2 lần/request (hoặc mất auth nếu chạy ngoài chain).
	 */
	@Bean
	FilterRegistrationBean<InternalTokenFilter> internalTokenFilterRegistration(InternalTokenFilter filter) {
		FilterRegistrationBean<InternalTokenFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setEnabled(false);
		return registration;
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
