package com.traveloptix.controller;

import com.traveloptix.dto.PassRenewalRequest;
import com.traveloptix.model.Tourist;
import com.traveloptix.model.User;
import com.traveloptix.repository.TouristRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tourist/pass")
@CrossOrigin(origins = "*")
public class TouristPassController {

    private static final BigDecimal RENEWAL_FEE = new BigDecimal("25.00");

    @Autowired
    private TouristRepository touristRepository;

    // ─── GET PASS INFO ────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPassInfo(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        User user = (User) authentication.getPrincipal();

        Tourist tourist = touristRepository
                .findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        boolean isExpired = tourist.getPassExpiryDate() != null
                && tourist.getPassExpiryDate().isBefore(LocalDate.now());

        response.put("success", true);
        response.put("data", Map.of(
                "passExpiryDate", tourist.getPassExpiryDate(),
                "isExpired", isExpired,
                "renewalFee", RENEWAL_FEE
        ));

        return ResponseEntity.ok(response);
    }

    // ─── RENEW PASS ───────────────────────────────────────────────
    @PostMapping("/renew")
    public ResponseEntity<Map<String, Object>> renewPass(
            @Valid @RequestBody PassRenewalRequest request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Tourist tourist = touristRepository
                    .findByUser_UserId(user.getUserId())
                    .orElseThrow(() -> new RuntimeException(
                            "Tourist profile not found"));

            // Basic validation
            if ("MOBILE_MONEY".equals(request.getPaymentMethod())
                    && (request.getMobileNumber() == null
                        || request.getMobileNumber().isBlank())) {
                throw new RuntimeException("Mobile number is required");
            }

            if ("CARD".equals(request.getPaymentMethod())
                    && (request.getCardNumber() == null
                        || request.getCardNumber().isBlank())) {
                throw new RuntimeException("Card details are required");
            }

            // ✅ Extend from current expiry if still valid,
            //    otherwise extend from today
            LocalDate currentExpiry = tourist.getPassExpiryDate();
            LocalDate baseDate = (currentExpiry != null
                    && currentExpiry.isAfter(LocalDate.now()))
                    ? currentExpiry
                    : LocalDate.now();

            LocalDate newExpiry = baseDate.plusYears(1);
            tourist.setPassExpiryDate(newExpiry);

            touristRepository.save(tourist);

            String transactionRef = "PASS-" + UUID.randomUUID()
                    .toString().substring(0, 8).toUpperCase();

            response.put("success", true);
            response.put("message", "Travel pass renewed successfully!");
            response.put("data", Map.of(
                    "newExpiryDate", newExpiry,
                    "amountPaid", RENEWAL_FEE,
                    "transactionRef", transactionRef
            ));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}