package com.traveloptix.controller;

import com.traveloptix.dto.LoginRequest;
import com.traveloptix.dto.LoginResponse;
import com.traveloptix.dto.RegisterRequest;
import com.traveloptix.service.AuthService;
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

    // ==========================================
    // POST /api/auth/register
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String message = authService.register(request);
            response.put("success", true);
            response.put("message", message);
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
    // POST /api/auth/login
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            LoginResponse loginResponse = 
                    authService.login(request);
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
    // (Test endpoint — no token required)
    // ==========================================
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", 
            "Travel Optix API is running!");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
}
