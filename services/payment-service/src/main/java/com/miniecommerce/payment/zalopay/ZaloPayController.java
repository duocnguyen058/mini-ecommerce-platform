package com.miniecommerce.payment.zalopay;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.miniecommerce.payment.payment.Payment;
import com.miniecommerce.payment.payment.PaymentRepository;
import com.miniecommerce.payment.payment.PaymentResponse;
import com.miniecommerce.payment.payment.PaymentStatus;
import com.miniecommerce.payment.payment.PaymentTransaction;
import com.miniecommerce.payment.payment.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment/zalopay")
public class ZaloPayController {

    private static final Logger log = LoggerFactory.getLogger(ZaloPayController.class);

    private final ZaloPayService zaloPayService;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    public ZaloPayController(
            ZaloPayService zaloPayService,
            PaymentRepository paymentRepository,
            PaymentTransactionRepository transactionRepository,
            ObjectMapper objectMapper) {
        this.zaloPayService = zaloPayService;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/create")
    public ResponseEntity<PaymentResponse> create(@RequestBody CreatePaymentRequest request) {
        PaymentResponse response = zaloPayService.createZaloPayOrder(
                request.orderId(),
                request.userId(),
                request.amount(),
                request.description()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    @Transactional
    public ResponseEntity<Map<String, Object>> callback(@RequestBody ZaloPayCallbackRequest request) {
        Map<String, Object> result = new HashMap<>();
        
        if (!zaloPayService.validateCallback(request.getData(), request.getMac())) {
            log.warn("Invalid ZaloPay callback MAC signature!");
            result.put("return_code", -1);
            result.put("return_message", "mac not equal");
            return ResponseEntity.ok(result);
        }

        try {
            JsonNode dataNode = objectMapper.readTree(request.getData());
            String appTransId = dataNode.has("app_trans_id") ? dataNode.get("app_trans_id").asText() : "";
            
            String zpTransId = null;
            if (dataNode.has("zp_trans_id")) {
                zpTransId = dataNode.get("zp_trans_id").asText();
            }

            // Status from callback (typically 1 = success, 2 = fail)
            int status = dataNode.has("status") ? dataNode.get("status").asInt() : 1;
            PaymentStatus paymentStatus = (status == 1) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

            Optional<Payment> optionalPayment = paymentRepository.findByAppTransId(appTransId);
            if (optionalPayment.isPresent()) {
                Payment payment = optionalPayment.get();
                payment.setStatus(paymentStatus);
                if (zpTransId != null) {
                    payment.setZpTransId(zpTransId);
                }
                payment.setUpdatedAt(Instant.now());
                paymentRepository.save(payment);

                // Save Callback Transaction
                PaymentTransaction tx = new PaymentTransaction();
                tx.setId(UUID.randomUUID());
                tx.setPaymentId(payment.getId());
                tx.setOrderId(payment.getOrderId());
                tx.setTransactionType("CALLBACK");
                tx.setStatus(paymentStatus);
                tx.setAmount(payment.getAmount());
                tx.setAppTransId(appTransId);
                tx.setZpTransId(zpTransId);
                tx.setRawRequest(request.getData());
                tx.setRawResponse("return_code: 1, return_message: ok");
                tx.setResponseCode(1);
                tx.setResponseMessage("Callback processed successfully");
                tx.setCreatedAt(Instant.now());
                transactionRepository.save(tx);
                
                log.info("ZaloPay payment successfully confirmed for orderId: {}, status: {}", payment.getOrderId(), paymentStatus);
            } else {
                log.warn("ZaloPay callback received for unknown appTransId: {}", appTransId);
            }
            
            result.put("return_code", 1);
            result.put("return_message", "ok");
            
        } catch (Exception e) {
            log.error("Exception processing ZaloPay callback", e);
            result.put("return_code", 0);
            result.put("return_message", "exception: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(PaymentResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/transactions")
    public ResponseEntity<List<PaymentTransaction>> getTransactions(@PathVariable UUID orderId) {
        List<PaymentTransaction> list = transactionRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{orderId}/simulate-success")
    @Transactional
    public ResponseEntity<PaymentResponse> simulateSuccess(@PathVariable UUID orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order " + orderId));
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setZpTransId("ZP_SIM_" + System.currentTimeMillis());
        payment.setUpdatedAt(Instant.now());
        paymentRepository.save(payment);

        PaymentTransaction tx = new PaymentTransaction();
        tx.setId(UUID.randomUUID());
        tx.setPaymentId(payment.getId());
        tx.setOrderId(orderId);
        tx.setTransactionType("SANDBOX_SIMULATE");
        tx.setStatus(PaymentStatus.SUCCESS);
        tx.setAmount(payment.getAmount());
        tx.setAppTransId(payment.getAppTransId());
        tx.setZpTransId(payment.getZpTransId());
        tx.setResponseMessage("Simulated sandbox payment success");
        tx.setResponseCode(1);
        tx.setCreatedAt(Instant.now());
        transactionRepository.save(tx);

        return ResponseEntity.ok(PaymentResponse.from(payment));
    }
}
