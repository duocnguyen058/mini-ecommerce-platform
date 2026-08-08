package com.miniecommerce.order;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import com.miniecommerce.order.order.Order;
import com.miniecommerce.order.order.OrderRepository;
import com.miniecommerce.order.order.OrderStatus;

/**
 * Integration tests for the admin PATCH endpoint and customer cancel endpoint
 * using the simplified order state machine (6 statuses).
 *
 * Flow:
 *   PENDING → CONFIRMED → SHIPPING → DELIVERED → RETURNED
 *   └─ Cancel (PENDING, CONFIRMED, SHIPPING) → CANCELLED
 */
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class AdminOrderStatusTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private OrderRepository orderRepository;

    private static JwtRequestPostProcessor adminOf(UUID userId) {
        return jwt().jwt(jwt -> jwt.subject(userId.toString())
                .claim("roles", List.of("ROLE_ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private static JwtRequestPostProcessor customerOf(UUID userId) {
        return jwt().jwt(jwt -> jwt.subject(userId.toString())
                .claim("roles", List.of("ROLE_CUSTOMER")))
                .authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
    }

    /**
     * Helper to create an order in a given status.
     * For statuses that require prior steps, the necessary marks are applied.
     */
    private Order newOrder(OrderStatus status, UUID reservationId) {
        Order order = new Order(UUID.randomUUID(), null, "VND");
        switch (status) {
            case PENDING -> {}
            case CONFIRMED -> order.markConfirmed(reservationId != null ? reservationId : UUID.randomUUID(), "Test setup");
            case SHIPPING -> {
                order.markConfirmed(reservationId != null ? reservationId : UUID.randomUUID(), "Test setup");
                order.markShipping("Test setup");
            }
            case DELIVERED -> {
                order.markConfirmed(reservationId != null ? reservationId : UUID.randomUUID(), "Test setup");
                order.markShipping("Test setup");
                order.markDelivered("Test setup");
            }
            case RETURNED -> {
                order.markConfirmed(reservationId != null ? reservationId : UUID.randomUUID(), "Test setup");
                order.markShipping("Test setup");
                order.markDelivered("Test setup");
                order.markReturned("Test setup");
            }
            case CANCELLED -> order.markCancelled("Test setup");
        }
        return orderRepository.save(order);
    }

    private Order newOrder(OrderStatus status) {
        return newOrder(status, UUID.randomUUID());
    }

    // ----------------- Admin PATCH transitions -----------------

    @Test
    void adminPatchesPendingToConfirmed() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CONFIRMED\",\"note\":\"Duyệt\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void adminPatchesConfirmedToShipping() throws Exception {
        Order order = newOrder(OrderStatus.CONFIRMED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"SHIPPING\",\"note\":\"Giao cho vận chuyển\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPING"));
    }

    @Test
    void adminPatchesShippingToDelivered() throws Exception {
        Order order = newOrder(OrderStatus.SHIPPING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    void adminPatchesDeliveredToReturned() throws Exception {
        Order order = newOrder(OrderStatus.DELIVERED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"RETURNED\",\"note\":\"Nhập lại kho\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));
    }

    @Test
    void adminPatchesPendingToCancelled() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CANCELLED\",\"note\":\"Admin huỷ\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void adminPatchesConfirmedToCancelled() throws Exception {
        Order order = newOrder(OrderStatus.CONFIRMED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CANCELLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void adminPatchesShippingToCancelled() throws Exception {
        Order order = newOrder(OrderStatus.SHIPPING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CANCELLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // ----------------- Invalid transitions -----------------

    @Test
    void adminCannotPatchFromConfirmedToPending() throws Exception {
        Order order = newOrder(OrderStatus.CONFIRMED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"PENDING\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void adminCannotPatchFromCancelled() throws Exception {
        Order order = newOrder(OrderStatus.CANCELLED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CONFIRMED\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void nonAdminCannotUpdateStatus() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(customerOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateStatusReturns404() throws Exception {
        mockMvc.perform(patch("/api/admin/orders/" + UUID.randomUUID() + "/status")
                .with(adminOf(UUID.randomUUID()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newStatus\":\"CONFIRMED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStatusReturns400OnMissingNewStatus() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .with(adminOf(order.getUserId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ----------------- Customer cancel -----------------

    @Test
    void customerCancelsPendingOrder() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                .with(customerOf(order.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void customerCancelsConfirmedOrder() throws Exception {
        Order order = newOrder(OrderStatus.CONFIRMED);
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                .with(customerOf(order.getUserId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void customerCannotCancelShippingOrder() throws Exception {
        Order order = newOrder(OrderStatus.SHIPPING);
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                .with(customerOf(order.getUserId())))
                .andExpect(status().isConflict());
    }

    @Test
    void customerCannotCancelOthersOrder() throws Exception {
        Order order = newOrder(OrderStatus.PENDING);
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                .with(customerOf(UUID.randomUUID())))
                .andExpect(status().isNotFound());
    }
}
