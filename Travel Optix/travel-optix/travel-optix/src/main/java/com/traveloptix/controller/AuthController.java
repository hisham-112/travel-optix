package com.traveloptix.controller;

import com.traveloptix.dto.LoginRequest;
import com.traveloptix.dto.LoginResponse;
import com.traveloptix.dto.RegisterRequest;
import com.traveloptix.service.AuthService;
import com.traveloptix.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    // ==========================================
    // POST /api/auth/send-otp
    // ==========================================
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(
            @RequestBody Map<String, String> body) {

        System.out.println("\n\n==============================");
        System.out.println("SEND OTP endpoint HIT");
        System.out.println("Body = " + body);
        System.out.println("==============================\n\n");

        Map<String, Object> response = new HashMap<>();

        try {
            String email = body.get("email");

            System.out.println("Parsed email = " + email);

            if (email == null || email.isBlank()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(response);
            }

            String normalizedEmail = email.trim().toLowerCase();

            // If you only want OTP for new users:
            if (authService.emailExists(normalizedEmail)) {
                response.put("success", false);
                response.put("message",
                        "This email is already registered. Please log in.");
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(response);
            }

            System.out.println("Calling otpService.generateOtp for: " + normalizedEmail);

            // IMPORTANT: generateOtp must NEVER throw (OtpService will enforce this)
            String otp = otpService.generateOtp(normalizedEmail);

            System.out.println("otpService.generateOtp returned OTP (debug) = " + otp);

            response.put("success", true);
            response.put("message",
                    "A 6-digit code has been sent to " + normalizedEmail +
                    ". Check your email.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("SEND OTP FAILED (exception): " + e);
            e.printStackTrace(); // ✅ IMPORTANT so we see the real cause

            response.put("success", false);
            response.put("message",
                    e.getMessage() == null ? "Could not generate OTP" : e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    // ==========================================
    // POST /api/auth/register
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
            String otp = request.getOtp();

            if (otp == null || otp.isBlank()) {
                response.put("success", false);
                response.put("message", "Verification code is required.");
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(response);
            }

            boolean otpValid = otpService.verifyOtp(email, otp.trim());

            if (!otpValid) {
                response.put("success", false);
                response.put("message",
                        "Invalid or expired verification code. Please request a new one.");
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(response);
            }

            String message = authService.register(request);

            response.put("success", true);
            response.put("message", message);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (Exception e) {
            System.out.println("REGISTER FAILED:");
            e.printStackTrace();

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ==========================================
    // POST /api/auth/login
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            LoginResponse loginResponse = authService.login(request);
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("data", loginResponse);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }

    // ==========================================
    // GET /api/auth/health
    // ==========================================
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Travel Optix API is running!");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
}