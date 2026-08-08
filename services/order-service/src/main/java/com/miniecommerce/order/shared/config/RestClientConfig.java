package com.miniecommerce.order.shared.config;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.miniecommerce.order.shared.config.OrderProperties.ClientConfig;

@Configuration
public class RestClientConfig {

  private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
  private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

  private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
    .connectTimeout(CONNECT_TIMEOUT)
    .build();

  private static final JdkClientHttpRequestFactory REQUEST_FACTORY =
    new JdkClientHttpRequestFactory(HTTP_CLIENT);

  static {
    REQUEST_FACTORY.setReadTimeout(READ_TIMEOUT);
  }

  @Bean
  RestClient catalogRestClient(OrderProperties properties) {
    return buildClient(properties.catalog());
  }

  @Bean
  RestClient inventoryRestClient(OrderProperties properties) {
    return buildClient(properties.inventory());
  }

  @Bean
  RestClient cartRestClient(OrderProperties properties) {
    return buildClient(properties.cart());
  }

  /**
   * Mỗi RestClient forward Authorization header của request hiện tại xuống service phụ
   * thuộc để giữ nguyên thông tin định danh JWT, đảm bảo các lượt gọi inventory/cart/
   * catalog thực hiện đúng quyền của người dùng gọi checkout.
   * <p>
   * Timeout được set cố định (connect 2s, read 5s) để tránh treo vô hạn nếu downstream
   * service không phản hồi — Resilience4j circuit-breaker sẽ nhảy vào sau đó.
   */
  private RestClient buildClient(ClientConfig config) {
    return RestClient.builder()
      .baseUrl(config.baseUrl())
      .requestInterceptor((request, body, execution) -> {
        String authorization = currentAuthorizationHeader();
        if (authorization != null) {
          request.getHeaders().set("Authorization", authorization);
        }
        return execution.execute(request, body);
      })
      .requestFactory(REQUEST_FACTORY)
      .build();
  }

  private String currentAuthorizationHeader() {
    ServletRequestAttributes attributes =
      (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attributes == null) {
      return null;
    }
    return attributes.getRequest().getHeader("Authorization");
  }
}
