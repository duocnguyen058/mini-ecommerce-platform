package com.miniecommerce.notification.messaging;

import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.miniecommerce.notification.config.RabbitMQConfig;
import com.miniecommerce.notification.notification.NotificationService;

@Component
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final NumberFormat VND_FORMAT = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));

    private final NotificationService notificationService;

    public OrderEventConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.ORDER_EVENTS_QUEUE)
    public void handleOrderEvent(Map<String, Object> payload) {
        String eventType = (String) payload.get("eventType");
        String orderIdStr = (String) payload.get("orderId");
        String userIdStr = (String) payload.get("userId");
        
        if (eventType == null || orderIdStr == null || userIdStr == null) {
            return;
        }

        UUID orderId = UUID.fromString(orderIdStr);
        UUID userId = UUID.fromString(userIdStr);
        String shortOrderId = orderIdStr.length() >= 8 ? orderIdStr.substring(0, 8).toUpperCase() : orderIdStr;
        
        String customerName = payload.get("customerName") != null ? (String) payload.get("customerName") : "Khách hàng";
        int totalQty = payload.get("totalQuantity") != null ? ((Number) payload.get("totalQuantity")).intValue() : 1;
        
        String totalAmountStr = "";
        if (payload.get("totalAmount") != null) {
            double amt = ((Number) payload.get("totalAmount")).doubleValue();
            totalAmountStr = VND_FORMAT.format(amt) + " VNĐ";
        }

        String formattedTime = TIME_FORMATTER.format(Instant.now());
        
        String title = "";
        String message = "";
        String notificationType = "ORDER_STATUS";
        String referenceUrl = "/orders/" + orderId;

        switch (eventType) {
            case "order.created":
                title = "Đặt hàng thành công! 🎉";
                message = "Đơn hàng #" + shortOrderId + " gồm " + totalQty + " sản phẩm (" + totalAmountStr + ") đã được đặt thành công.";
                
                // Admin notification: Nguyễn Văn A vừa đặt đơn hàng #DH001 gồm 5 sản phẩm.
                String adminTitle = "Đơn hàng mới từ " + customerName;
                String adminMessage = customerName + " vừa đặt đơn hàng #" + shortOrderId + " gồm " + totalQty + " sản phẩm. Tổng tiền: " + totalAmountStr + ". Thời gian đặt: " + formattedTime;
                notificationService.create(UUID.fromString("00000000-0000-0000-0000-000000000001"), adminTitle, adminMessage, "ADMIN_ORDER", "/admin/orders");
                break;

            case "order.confirmed":
                title = "Đơn hàng đã được xác nhận ✅";
                message = "Đơn hàng #" + shortOrderId + " của bạn đã được xác nhận và đang được chuẩn bị đóng gói.";
                break;

            case "order.shipping":
                title = "Đơn hàng đang giao 🚚";
                message = "Đơn hàng #" + shortOrderId + " đang trên đường giao tới bạn.";
                break;

            case "order.delivered":
                title = "Đơn hàng đã giao thành công 📦";
                message = "Đơn hàng #" + shortOrderId + " đã được giao thành công. Cảm ơn bạn đã mua sắm tại ShopNow!";
                break;

            case "order.cancelled":
                title = "Đơn hàng đã bị hủy ❌";
                message = "Đơn hàng #" + shortOrderId + " của bạn đã bị hủy.";
                break;

            case "order.returned":
                title = "Yêu cầu trả hàng đã được chấp nhận 🔄";
                message = "Yêu cầu hoàn trả hàng cho đơn #" + shortOrderId + " của bạn đã được chấp nhận thành công.";
                break;

            default:
                return;
        }

        // Gửi thông báo đến chính khách hàng của đơn hàng
        notificationService.create(userId, title, message, notificationType, referenceUrl);
        log.info("Notification created for user={}, event={}", userId, eventType);
    }
}
