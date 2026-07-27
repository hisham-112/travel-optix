package com.traveloptix.controller;

import com.traveloptix.dto.EventRequest;
import com.traveloptix.model.Event;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.User;
import com.traveloptix.service.HostFamilyService;
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
public class HostFamilyController {

    @Autowired
    private HostFamilyService hostFamilyService;

    // ==========================================
    // GET /api/families
    // (Public — view all approved families)
    // ==========================================
    @GetMapping("/api/families")
    public ResponseEntity<Map<String, Object>>
            getAllFamilies() {

        Map<String, Object> response = new HashMap<>();

        List<HostFamily> families =
                hostFamilyService.getAllApprovedFamilies();

        response.put("success", true);
        response.put("count", families.size());
        response.put("data", families);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET /api/families/{id}
    // (Public — view one family)
    // ==========================================
    @GetMapping("/api/families/{id}")
    public ResponseEntity<Map<String, Object>>
            getFamily(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            HostFamily family =
                    hostFamilyService.getFamilyById(id);
            response.put("success", true);
            response.put("data", family);
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
    // GET /api/family/profile
    // (Host Family — view my profile)
    // ==========================================
    @GetMapping("/api/family/profile")
    public ResponseEntity<Map<String, Object>>
            getMyProfile(Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            HostFamily family =
                    hostFamilyService
                        .getMyProfile(user.getUserId());

            response.put("success", true);
            response.put("data", family);
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
    // POST /api/family/events
    // (Host Family — create new event)
    // ==========================================
    @PostMapping("/api/family/events")
    public ResponseEntity<Map<String, Object>>
            createEvent(
                @Valid @RequestBody EventRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            Event event = hostFamilyService
                    .createEvent(
                        user.getUserId(), request);

            response.put("success", true);
            response.put("message",
                "Event created successfully!");
            response.put("data", event);
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
    // GET /api/family/events
    // (Host Family — view my events)
    // ==========================================
    @GetMapping("/api/family/events")
    public ResponseEntity<Map<String, Object>>
            getMyEvents(Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            List<Event> events = hostFamilyService
                    .getMyEvents(user.getUserId());

            response.put("success", true);
            response.put("count", events.size());
            response.put("data", events);
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
    // PUT /api/family/events/{id}
    // (Host Family — update my event)
    // ==========================================
    @PutMapping("/api/family/events/{id}")
    public ResponseEntity<Map<String, Object>>
            updateEvent(
                @PathVariable Integer id,
                @Valid @RequestBody EventRequest request,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            Event event = hostFamilyService
                    .updateEvent(
                        user.getUserId(), id, request);

            response.put("success", true);
            response.put("message",
                "Event updated successfully!");
            response.put("data", event);
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
    // DELETE /api/family/events/{id}
    // (Host Family — deactivate my event)
    // ==========================================
    @DeleteMapping("/api/family/events/{id}")
    public ResponseEntity<Map<String, Object>>
            deactivateEvent(
                @PathVariable Integer id,
                Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication
                    .getPrincipal();

            String message = hostFamilyService
                    .deactivateEvent(
                        user.getUserId(), id);

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
}