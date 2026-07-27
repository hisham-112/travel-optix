package com.traveloptix.controller;

import com.traveloptix.dto.PaymentRequest;
import com.traveloptix.model.Payment;
import com.traveloptix.model.User;
import com.traveloptix.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // ==========================================
    // POST /api/tourist/payments/mobile-money
    // ==========================================
    @PostMapping("/api/tourist/payments/mobile-money")
    public ResponseEntity<Map<String, Object>>
            mobileMoneyPayment(
                @Valid @RequestBody PaymentRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            Payment payment = paymentService
                    .processMobileMoneyPayment(
                        user.getUserId(), request);

            response.put("success", true);
            response.put("message",
                "Mobile Money payment successful!");
            response.put("data", payment);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ==========================================
    // POST /api/tourist/payments/card
    // ==========================================
    @PostMapping("/api/tourist/payments/card")
    public ResponseEntity<Map<String, Object>>
            cardPayment(
                @Valid @RequestBody PaymentRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            Payment payment = paymentService
                    .processCardPayment(
                        user.getUserId(), request);

            response.put("success", true);
            response.put("message",
                "Card payment successful!");
            response.put("data", payment);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ==========================================
    // GET /api/tourist/payments
    // (Tourist — view payment history)
    // ==========================================
    @GetMapping("/api/tourist/payments")
    public ResponseEntity<Map<String, Object>>
            getMyPayments(
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            List<Payment> payments = paymentService
                    .getMyPayments(user.getUserId());

            response.put("success", true);
            response.put("count", payments.size());
            response.put("data", payments);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ==========================================
    // GET /api/tourist/payments/{bookingId}
    // (Tourist — check payment for booking)
    // ==========================================
    @GetMapping("/api/tourist/payments/{bookingId}")
    public ResponseEntity<Map<String, Object>>
            getPaymentByBooking(
                @PathVariable Integer bookingId) {

        Map<String, Object> response = new HashMap<>();

        try {
            Payment payment = paymentService
                    .getPaymentByBookingId(bookingId);

            response.put("success", true);
            response.put("data", payment);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(response);
        }
    }

    // ==========================================
    // PUT /api/admin/payments/{id}/refund
    // (Admin — refund a payment)
    // ==========================================
    @PutMapping("/api/admin/payments/{id}/refund")
    public ResponseEntity<Map<String, Object>>
            refundPayment(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Payment payment = paymentService
                    .refundPayment(id);

            response.put("success", true);
            response.put("message",
                "Payment refunded successfully!");
            response.put("data", payment);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }
}
