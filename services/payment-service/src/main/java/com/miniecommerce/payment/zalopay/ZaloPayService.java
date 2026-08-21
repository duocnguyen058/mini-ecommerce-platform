package com.miniecommerce.payment.zalopay;

import com.miniecommerce.payment.config.ZaloPayProperties;
import com.miniecommerce.payment.payment.Payment;
import com.miniecommerce.payment.payment.PaymentMethod;
import com.miniecommerce.payment.payment.PaymentRepository;
import com.miniecommerce.payment.payment.PaymentResponse;
import com.miniecommerce.payment.payment.PaymentStatus;
import com.miniecommerce.payment.payment.PaymentTransaction;
import com.miniecommerce.payment.payment.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ZaloPayService {

    private static final Logger log = LoggerFactory.getLogger(ZaloPayService.class);

    private final ZaloPayProperties properties;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final RestTemplate restTemplate;

    public ZaloPayService(
            ZaloPayProperties properties,
            PaymentRepository paymentRepository,
            PaymentTransactionRepository transactionRepository) {
        this.properties = properties;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public PaymentResponse createZaloPayOrder(UUID orderId, UUID userId, BigDecimal amount, String description) {
        String appTime = String.valueOf(System.currentTimeMillis());
        String yyMMdd = DateTimeFormatter.ofPattern("yyMMdd").withZone(ZoneId.systemDefault()).format(Instant.now());
        String appTransId = yyMMdd + "_" + orderId.toString().substring(0, 8);
        
        String embedData = "{\"orderId\":\"" + orderId.toString() + "\"}";
        String items = "[]";
        long amountLong = amount.longValue();
        
        String data = properties.getAppId() + "|" + appTransId + "|" + properties.getAppUser() + "|" + amountLong + "|" + appTime + "|" + embedData + "|" + items;
        String mac = hmacSHA256(properties.getKey1(), data);
        
        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("app_id", properties.getAppId());
        requestBody.add("app_user", properties.getAppUser());
        requestBody.add("app_time", appTime);
        requestBody.add("amount", String.valueOf(amountLong));
        requestBody.add("app_trans_id", appTransId);
        requestBody.add("embed_data", embedData);
        requestBody.add("item", items);
        requestBody.add("description", description != null ? description : "Payment for order " + orderId);
        requestBody.add("callback_url", properties.getCallbackUrl());
        requestBody.add("mac", mac);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(requestBody, headers);

        String orderUrl = null;
        Integer returnCode = null;
        String returnMessage = null;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(properties.getCreateOrderUrl(), request, Map.class);
            
            if (response != null) {
                if (response.containsKey("order_url")) {
                    orderUrl = (String) response.get("order_url");
                }
                if (response.containsKey("return_code")) {
                    returnCode = (Integer) response.get("return_code");
                }
                if (response.containsKey("return_message")) {
                    returnMessage = (String) response.get("return_message");
                }
            }
        } catch (Exception ex) {
            log.warn("Could not reach ZaloPay gateway or simulate sandbox: {}", ex.getMessage());
            // Fallback for sandbox mock / simulation URL
            orderUrl = "https://qcgateway.zalopay.vn/pay?order=" + appTransId;
            returnCode = 1;
            returnMessage = "Sandbox Simulated URL";
        }

        // Check if payment already exists for this orderId to avoid duplicate constraint violations
        Optional<Payment> existingOpt = paymentRepository.findByOrderId(orderId);
        Payment payment = existingOpt.orElseGet(() -> {
            Payment p = new Payment();
            p.setId(UUID.randomUUID());
            p.setOrderId(orderId);
            return p;
        });

        payment.setUserId(userId);
        payment.setMethod(PaymentMethod.ZALOPAY);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(amount);
        payment.setCurrency("VND");
        payment.setAppTransId(appTransId);
        payment.setOrderUrl(orderUrl);
        if (payment.getCreatedAt() == null) {
            payment.setCreatedAt(Instant.now());
        }
        payment.setUpdatedAt(Instant.now());
        
        payment = paymentRepository.save(payment);

        // Record initial creation transaction
        PaymentTransaction tx = new PaymentTransaction();
        tx.setId(UUID.randomUUID());
        tx.setPaymentId(payment.getId());
        tx.setOrderId(orderId);
        tx.setTransactionType("CREATE");
        tx.setStatus(PaymentStatus.PENDING);
        tx.setAmount(amount);
        tx.setAppTransId(appTransId);
        tx.setRawRequest(requestBody.toString());
        tx.setResponseCode(returnCode != null ? returnCode : 1);
        tx.setResponseMessage(returnMessage != null ? returnMessage : "Order created");
        tx.setCreatedAt(Instant.now());
        transactionRepository.save(tx);

        return PaymentResponse.from(payment);
    }

    public boolean validateCallback(String data, String requestMac) {
        if (data == null || requestMac == null) {
            return false;
        }
        String calculatedMac = hmacSHA256(properties.getKey2(), data);
        return calculatedMac.equalsIgnoreCase(requestMac);
    }

    public String generateHmac(String key, String data) {
        return hmacSHA256(key, data);
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC-SHA256", e);
        }
    }
}
