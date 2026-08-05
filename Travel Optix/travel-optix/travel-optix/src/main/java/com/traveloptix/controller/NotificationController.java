package com.traveloptix.controller;

import com.traveloptix.model.Notification;
import com.traveloptix.model.User;
import com.traveloptix.repository.NotificationRepository;
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

    @Autowired
    private NotificationRepository notificationRepository;

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

    // ─── ✅ NEW: GET UNREAD COUNT (for the badge) ─────────────
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            long count = notificationRepository
                    .countByUser_UserIdAndIsReadFalse(user.getUserId());

            response.put("success", true);
            response.put("count", count);

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

    // ─── ✅ NEW: DELETE ONE NOTIFICATION ──────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Integer id,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            Notification notification = notificationRepository
                    .findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            // Security: users can only delete their own notifications
            if (!notification.getUser().getUserId().equals(user.getUserId())) {
                response.put("success", false);
                response.put("message", "Not your notification");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            notificationRepository.delete(notification);

            response.put("success", true);
            response.put("message", "Notification deleted");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // ─── ✅ NEW: CLEAR ALL NOTIFICATIONS ──────────────────────
    @DeleteMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllNotifications(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = (User) authentication.getPrincipal();

            notificationRepository.deleteByUser_UserId(user.getUserId());

            response.put("success", true);
            response.put("message", "All notifications cleared");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }
}