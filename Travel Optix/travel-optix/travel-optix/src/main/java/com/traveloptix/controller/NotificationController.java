package com.traveloptix.controller;

import com.traveloptix.model.Notification;
import com.traveloptix.model.User;
import com.traveloptix.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tourist/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // ─── GET ALL NOTIFICATIONS ────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyNotifications(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            List<Notification> notifications =
                    notificationService.getMyNotifications(
                            user.getUserId());

            response.put("success", true);
            response.put("count", notifications.size());
            response.put("data", notifications);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ─── MARK ONE AS READ ─────────────────────────────────────
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Integer id,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Notification notification =
                    notificationService.markAsRead(id);

            response.put("success", true);
            response.put("message", "Marked as read");
            response.put("data", notification);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ─── MARK ALL AS READ ─────────────────────────────────────
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            String message = notificationService
                    .markAllAsRead(user.getUserId());

            response.put("success", true);
            response.put("message", message);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }
}