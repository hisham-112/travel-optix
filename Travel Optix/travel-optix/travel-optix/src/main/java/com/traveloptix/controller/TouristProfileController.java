package com.traveloptix.controller;

import com.traveloptix.dto.UpdateProfileRequest;
import com.traveloptix.model.User;
import com.traveloptix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tourist")
@RequiredArgsConstructor
public class TouristProfileController {

    private final UserRepository userRepository;

    // ─── GET /tourist/profile ───────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(
            @AuthenticationPrincipal User currentUser) {

        Map<String, Object> data = new HashMap<>();
        data.put("fullName", currentUser.getFullName());
        data.put("email", currentUser.getEmail());
        data.put("phone", currentUser.getPhone());
        data.put("address", currentUser.getAddress());
        data.put("city", currentUser.getCity());
        data.put("region", currentUser.getRegion());
        data.put("role", currentUser.getRole());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile loaded",
                "data", data
        ));
    }

    // ─── PUT /tourist/profile ───────────────────────────────
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UpdateProfileRequest request) {

        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        // Location fields — allowed to be cleared
        user.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        user.setCity(request.getCity() != null ? request.getCity().trim() : null);
        user.setRegion(request.getRegion() != null ? request.getRegion().trim() : null);

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            // phone column is unique — someone else already has it
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "That phone number is already in use by another account."
            ));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("fullName", user.getFullName());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("address", user.getAddress());
        data.put("city", user.getCity());
        data.put("region", user.getRegion());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile updated successfully",
                "data", data
        ));
    }
}