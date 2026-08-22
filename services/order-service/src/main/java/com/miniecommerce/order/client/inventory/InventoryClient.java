package com.miniecommerce.order.client.inventory;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.http.ResponseEntity;

import com.miniecommerce.order.shared.exception.InsufficientStockException;
import com.miniecommerce.order.shared.exception.RemoteServiceException;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

/**
 * Client gọi inventory-service — reserve/confirm/cancel/adjust/check tồn kho.
 */
@Component
public class InventoryClient {

    private final RestClient inventoryRestClient;

    public InventoryClient(@Qualifier("inventoryRestClient") RestClient inventoryRestClient) {
        this.inventoryRestClient = inventoryRestClient;
    }

    // ---------- DTOs ----------

    /** Request đặt giữ tồn kho. */
    public record ReserveRequest(UUID productId, int quantity, UUID orderId) {}

    /**
     * Response từ reserve — field names khớp chính xác với inventory-service trả về.
     * inventory-service dùng tên "quantity" (không phải "quantityReserved").
     */
    public record ReservationResponse(
            UUID id,
            UUID productId,
            UUID orderId,
            int quantity,
            String status,
            Instant expiresAt,
            Instant createdAt,
            Instant updatedAt) {}

    /** DTO trả về khi kiểm tra tồn kho (GET /api/inventory/{productId}). */
    public record StockCheckResponse(
            UUID id,
            UUID productId,
            int quantityOnHand,
            int quantityReserved,
            int availableQuantity) {}

    /** Yêu cầu điều chỉnh tồn kho (PATCH /api/inventory/{productId}/stock). */
    public record AdjustStockRequest(int quantityDelta) {}

    // ---------- Reserve ----------

    @CircuitBreaker(name = "inventoryClient")
    @Retry(name = "inventoryClient")
    public ReservationResponse reserve(ReserveRequest request) {
        try {
            return inventoryRestClient.post()
                    .uri("/api/inventory/reserve")
                    .body(request)
                    .retrieve()
                    .onStatus(status -> status.value() == 409, (req, res) -> {
                        throw new InsufficientStockException(
                                "Không đủ tồn kho cho sản phẩm " + request.productId());
                    })
                    .onStatus(status -> status.isError(), (req, res) -> {
                        throw new RemoteServiceException(
                                "inventory-service reserve lỗi " + res.getStatusCode().value(),
                                res.getStatusCode().value());
                    })
                    .body(ReservationResponse.class);
        }
        catch (HttpClientErrorException.Conflict ex) {
            throw new InsufficientStockException(
                    "Không đủ tồn kho cho sản phẩm " + request.productId());
        }
    }

    // ---------- Confirm By Order ID ----------

    @CircuitBreaker(name = "inventoryClient")
    @Retry(name = "inventoryClient")
    public void confirmByOrderId(UUID orderId) {
        try {
            inventoryRestClient.post()
                    .uri("/api/inventory/orders/{orderId}/confirm", orderId)
                    .retrieve()
                    .onStatus(status -> status.isError(), (req, res) -> {
                        throw new RemoteServiceException(
                                "inventory-service confirmByOrderId lỗi " + res.getStatusCode().value(),
                                res.getStatusCode().value());
                    })
                    .toBodilessEntity();
        }
        catch (HttpClientErrorException ex) {
            throw new RemoteServiceException(
                    "inventory-service confirmByOrderId lỗi " + ex.getStatusCode().value(),
                    ex.getStatusCode().value());
        }
    }

    // ---------- Cancel By Order ID ----------

    @CircuitBreaker(name = "inventoryClient")
    @Retry(name = "inventoryClient")
    public void cancelByOrderId(UUID orderId) {
        try {
            inventoryRestClient.post()
                    .uri("/api/inventory/orders/{orderId}/cancel", orderId)
                    .retrieve()
                    .onStatus(status -> status.isError(), (req, res) -> {
                        throw new RemoteServiceException(
                                "inventory-service cancelByOrderId lỗi " + res.getStatusCode().value(),
                                res.getStatusCode().value());
                    })
                    .toBodilessEntity();
        }
        catch (HttpClientErrorException ex) {
            throw new RemoteServiceException(
                    "inventory-service cancelByOrderId lỗi " + ex.getStatusCode().value(),
                    ex.getStatusCode().value());
        }
    }

    // ---------- Check stock ----------

    @CircuitBreaker(name = "inventoryClient")
    @Retry(name = "inventoryClient")
    public StockCheckResponse checkStock(UUID productId) {
        try {
            ResponseEntity<StockCheckResponse> response = inventoryRestClient.get()
                    .uri("/api/inventory/{productId}", productId)
                    .retrieve()
                    .onStatus(status -> status.isError(), (req, res) -> {
                        throw new RemoteServiceException(
                                "inventory-service lỗi " + res.getStatusCode().value(),
                                res.getStatusCode().value());
                    })
                    .toEntity(StockCheckResponse.class);
            return response.getBody();
        }
        catch (HttpClientErrorException.NotFound ex) {
            return null;
        }
    }

    // ---------- Adjust stock ----------

    @CircuitBreaker(name = "inventoryClient")
    @Retry(name = "inventoryClient")
    public void adjustStock(UUID productId, int quantityDelta) {
        try {
            inventoryRestClient.patch()
                    .uri("/api/inventory/{productId}/stock", productId)
                    .body(new AdjustStockRequest(quantityDelta))
                    .retrieve()
                    .onStatus(status -> status.isError(), (req, res) -> {
                        throw new RemoteServiceException(
                                "inventory-service adjustStock lỗi " + res.getStatusCode().value(),
                                res.getStatusCode().value());
                    })
                    .toBodilessEntity();
        }
        catch (HttpClientErrorException ex) {
            throw new RemoteServiceException(
                    "inventory-service adjustStock lỗi " + ex.getStatusCode().value(),
                    ex.getStatusCode().value());
        }
    }
}
