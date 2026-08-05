package com.traveloptix.controller;

import com.traveloptix.dto.BulkPaymentRequest;
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
    // POST /api/tourist/payments/paystack/initialize
    // Single booking Paystack payment
    // ==========================================
    @PostMapping("/api/tourist/payments/paystack/initialize")
    public ResponseEntity<Map<String, Object>> initializePaystack(
            @RequestBody Map<String, Integer> body,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Integer bookingId = body.get("bookingId");

            if (bookingId == null) {
                throw new RuntimeException("Booking ID is required");
            }

            Map<String, Object> data = paymentService.initializePaystack(
                    user.getUserId(),
                    bookingId
            );

            response.put("success", true);
            response.put("data", data);

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
    // GET /api/tourist/payments/paystack/verify/{reference}
    // Single booking Paystack verification
    // ==========================================
    @GetMapping("/api/tourist/payments/paystack/verify/{reference}")
    public ResponseEntity<Map<String, Object>> verifyPaystack(
            @PathVariable String reference,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Payment payment = paymentService.verifyPaystack(
                    user.getUserId(),
                    reference
            );

            response.put("success", true);
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

    // ==========================================
    // POST /api/tourist/payments/paystack/bulk/initialize
    // Multiple selected bookings Paystack payment
    // ==========================================
    @PostMapping("/api/tourist/payments/paystack/bulk/initialize")
    public ResponseEntity<Map<String, Object>> initializeBulkPaystack(
            @Valid @RequestBody BulkPaymentRequest request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Map<String, Object> data = paymentService.initializeBulkPaystack(
                    user.getUserId(),
                    request.getBookingIds()
            );

            response.put("success", true);
            response.put("data", data);

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
    // GET /api/tourist/payments/paystack/bulk/verify/{reference}
    // Multiple selected bookings Paystack verification
    // ==========================================
    @GetMapping("/api/tourist/payments/paystack/bulk/verify/{reference}")
    public ResponseEntity<Map<String, Object>> verifyBulkPaystack(
            @PathVariable String reference,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            List<Payment> payments = paymentService.verifyBulkPaystack(
                    user.getUserId(),
                    reference
            );

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
    // POST /api/tourist/payments/paystack/initialize-travel-pass
    // Travel pass renewal via Paystack
    // ==========================================
    @PostMapping("/api/tourist/payments/paystack/initialize-travel-pass")
    public ResponseEntity<Map<String, Object>> initializeTravelPassRenewal(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Map<String, Object> data =
                    paymentService.initializeTravelPassRenewal(
                            user.getUserId()
                    );

            response.put("success", true);
            response.put("data", data);

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
    // GET /api/tourist/payments/paystack/verify-travel-pass/{reference}
    // Travel pass renewal verification
    // ==========================================
    @GetMapping("/api/tourist/payments/paystack/verify-travel-pass/{reference}")
    public ResponseEntity<Map<String, Object>> verifyTravelPassRenewal(
            @PathVariable String reference,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Map<String, Object> data =
                    paymentService.verifyTravelPassRenewal(
                            user.getUserId(),
                            reference
                    );

            response.put("success", true);
            response.put("data", data);

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
    // POST /api/tourist/payments/mobile-money
    // Legacy demo Mobile Money payment
    // ==========================================
    @PostMapping("/api/tourist/payments/mobile-money")
    public ResponseEntity<Map<String, Object>> mobileMoneyPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Payment payment = paymentService.processMobileMoneyPayment(
                    user.getUserId(),
                    request
            );

            response.put("success", true);
            response.put("message", "Mobile Money payment successful!");
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
    // Legacy demo Card payment
    // ==========================================
    @PostMapping("/api/tourist/payments/card")
    public ResponseEntity<Map<String, Object>> cardPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Payment payment = paymentService.processCardPayment(
                    user.getUserId(),
                    request
            );

            response.put("success", true);
            response.put("message", "Card payment successful!");
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
    // Payment history
    // ==========================================
    @GetMapping("/api/tourist/payments")
    public ResponseEntity<Map<String, Object>> getMyPayments(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            List<Payment> payments = paymentService.getMyPayments(
                    user.getUserId()
            );

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
    // Check payment for one booking
    // ==========================================
    @GetMapping("/api/tourist/payments/{bookingId}")
    public ResponseEntity<Map<String, Object>> getPaymentByBooking(
            @PathVariable Integer bookingId) {

        Map<String, Object> response = new HashMap<>();

        try {
            Payment payment =
                    paymentService.getPaymentByBookingId(bookingId);

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
    // Admin refund
    // ==========================================
    @PutMapping("/api/admin/payments/{id}/refund")
    public ResponseEntity<Map<String, Object>> refundPayment(
            @PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Payment payment = paymentService.refundPayment(id);

            response.put("success", true);
            response.put("message", "Payment refunded successfully!");
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