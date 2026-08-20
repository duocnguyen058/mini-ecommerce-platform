package com.miniecommerce.inventory.shared.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Cho phép service-to-service call từ order-service thông qua shared secret
 * (header {@code X-Internal-Token}).
 * <p>
 * Khi token hợp lệ, filter gán authentication với role {@code ROLE_SERVICE} —
 * các endpoint internal (reserve/confirm/cancel/adjust) nhận diện qua
 * {@code hasAnyRole('ADMIN','SERVICE')} ở {@code @PreAuthorize} / requestMatcher.
 * <p>
 * Điều này cho phép các side-effect inventory do CUSTOMER khởi tạo (huỷ đơn, trả
 * hàng — order-service gọi giúp, không forward JWT người dùng) hoạt động mà KHÔNG
 * mở quyền trực tiếp cho CUSTOMER gọi các endpoint này.
 * <p>
 * LƯU Ý ngữ nghĩa: filter chạy TRƯỚC bộ lọc JWT resource server của Spring
 * Security, nên token hợp lệ LUÔN thắng JWT (nếu request mang cả hai). Đây là mô
 * hình tin cậy theo secret (ai có token = SERVICE). Đừng forward JWT người dùng
 * kèm token internal trong cùng request nếu không muốn ngữ nghĩa bị đổi.
 */
@Component
public class InternalTokenFilter extends OncePerRequestFilter {

	private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

	private final String internalToken;

	public InternalTokenFilter(@Value("${app.security.internal-token:}") String internalToken) {
		this.internalToken = internalToken;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		if (internalToken != null && !internalToken.isBlank()) {
			String provided = request.getHeader(INTERNAL_TOKEN_HEADER);
			if (provided != null && constantTimeEquals(internalToken, provided)) {
				UsernamePasswordAuthenticationToken serviceAuth = new UsernamePasswordAuthenticationToken(
						"order-service",
						null,
						List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
				SecurityContextHolder.getContext().setAuthentication(serviceAuth);
			}
		}
		chain.doFilter(request, response);
	}

	private static boolean constantTimeEquals(String expected, String actual) {
		return MessageDigest.isEqual(
				expected.getBytes(StandardCharsets.UTF_8),
				actual.getBytes(StandardCharsets.UTF_8));
	}
}
