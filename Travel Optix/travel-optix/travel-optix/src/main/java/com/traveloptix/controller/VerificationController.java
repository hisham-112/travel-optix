package com.traveloptix.controller;

import com.traveloptix.dto.PhoneVerifyRequest;
import com.traveloptix.dto.VerificationRequest;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.TourGuide;
import com.traveloptix.model.User;
import com.traveloptix.service.VerificationService;
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
public class VerificationController {

    @Autowired
    private VerificationService verificationService;

    // ==========================================
    // POST /api/guide/upload-id
    // (Tour Guide submits documents)
    // ==========================================
    @PostMapping("/api/guide/upload-id")
    public ResponseEntity<Map<String, Object>>
            submitGuideDocuments(
                @RequestBody VerificationRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            TourGuide guide = verificationService
                    .submitGuideDocuments(
                        user.getUserId(), request);

            response.put("success", true);
            response.put("message",
                "Documents submitted successfully! " +
                "Awaiting admin approval.");
            response.put("data", guide);
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
    // POST /api/family/upload-id
    // (Host Family submits documents)
    // ==========================================
    @PostMapping("/api/family/upload-id")
    public ResponseEntity<Map<String, Object>>
            submitFamilyDocuments(
                @RequestBody VerificationRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            HostFamily family = verificationService
                    .submitFamilyDocuments(
                        user.getUserId(), request);

            response.put("success", true);
            response.put("message",
                "Documents submitted successfully! " +
                "Awaiting admin approval.");
            response.put("data", family);
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
    // POST /api/auth/verify-phone
    // (Send verification code)
    // ==========================================
    @PostMapping("/api/auth/verify-phone")
    public ResponseEntity<Map<String, Object>>
            sendVerificationCode(
                @Valid @RequestBody 
                PhoneVerifyRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String message = verificationService
                    .sendPhoneVerificationCode(
                        request.getPhone());

            response.put("success", true);
            response.put("message", message);
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
    // POST /api/auth/confirm-phone
    // (Confirm verification code)
    // ==========================================
    @PostMapping("/api/auth/confirm-phone")
    public ResponseEntity<Map<String, Object>>
            confirmPhoneCode(
                @RequestBody PhoneVerifyRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            String message = verificationService
                    .confirmPhoneCode(
                        user.getUserId(),
                        request.getPhone(),
                        request.getVerificationCode());

            response.put("success", true);
            response.put("message", message);
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
    // GET /api/admin/verifications/pending
    // (Admin — view all pending verifications)
    // ==========================================
    @GetMapping("/api/admin/verifications/pending")
    public ResponseEntity<Map<String, Object>>
            getPendingVerifications() {

        Map<String, Object> response = new HashMap<>();

        List<TourGuide> pendingGuides =
                verificationService.getPendingGuides();

        List<HostFamily> pendingFamilies =
                verificationService.getPendingFamilies();

        response.put("success", true);
        response.put("pendingGuides", pendingGuides);
        response.put("pendingFamilies", pendingFamilies);
        response.put("totalPending",
            pendingGuides.size() + 
            pendingFamilies.size());
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // PUT /api/admin/verifications/guide/{id}/approve
    // (Admin — approve a tour guide)
    // ==========================================
    @PutMapping(
        "/api/admin/verifications/guide/{id}/approve")
    public ResponseEntity<Map<String, Object>>
            approveGuide(
                @PathVariable Integer id,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User admin = (User) authentication
                    .getPrincipal();

            TourGuide guide = verificationService
                    .approveGuide(id, admin.getUserId());

            response.put("success", true);
            response.put("message",
                "Tour guide approved successfully!");
            response.put("data", guide);
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
    // PUT /api/admin/verifications/guide/{id}/reject
    // (Admin — reject a tour guide)
    // ==========================================
    @PutMapping(
        "/api/admin/verifications/guide/{id}/reject")
    public ResponseEntity<Map<String, Object>>
            rejectGuide(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            TourGuide guide =
                    verificationService.rejectGuide(id);

            response.put("success", true);
            response.put("message",
                "Tour guide rejected.");
            response.put("data", guide);
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
    // PUT /api/admin/verifications/family/{id}/approve
    // (Admin — approve a host family)
    // ==========================================
    @PutMapping(
        "/api/admin/verifications/family/{id}/approve")
    public ResponseEntity<Map<String, Object>>
            approveFamily(
                @PathVariable Integer id,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User admin = (User) authentication
                    .getPrincipal();

            HostFamily family = verificationService
                    .approveFamily(
                        id, admin.getUserId());

            response.put("success", true);
            response.put("message",
                "Host family approved successfully!");
            response.put("data", family);
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
    // PUT /api/admin/verifications/family/{id}/reject
    // (Admin — reject a host family)
    // ==========================================
    @PutMapping(
        "/api/admin/verifications/family/{id}/reject")
    public ResponseEntity<Map<String, Object>>
            rejectFamily(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            HostFamily family =
                    verificationService.rejectFamily(id);

            response.put("success", true);
            response.put("message",
                "Host family rejected.");
            response.put("data", family);
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