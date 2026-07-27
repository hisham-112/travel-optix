package com.traveloptix.controller;

import com.traveloptix.model.Booking;
import com.traveloptix.model.User;
import com.traveloptix.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    // GET /api/admin/users
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>>
            getAllUsers() {

        Map<String, Object> response = new HashMap<>();
        List<User> users = adminService.getAllUsers();

        response.put("success", true);
        response.put("count", users.size());
        response.put("data", users);
        return ResponseEntity.ok(response);
    }

    // GET /api/admin/users/{id}
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>>
            getUser(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = adminService.getUserById(id);
            response.put("success", true);
            response.put("data", user);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(response);
        }
    }

    // PUT /api/admin/users/{id}/deactivate
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, Object>>
            deactivateUser(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = adminService
                    .deactivateUser(id);
            response.put("success", true);
            response.put("message",
                "User deactivated successfully");
            response.put("data", user);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // PUT /api/admin/users/{id}/activate
    @PutMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, Object>>
            activateUser(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            User user = adminService.activateUser(id);
            response.put("success", true);
            response.put("message",
                "User activated successfully");
            response.put("data", user);
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
    // BOOKING MANAGEMENT
    // ==========================================

    // GET /api/admin/bookings
    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>>
            getAllBookings() {

        Map<String, Object> response = new HashMap<>();
        List<Booking> bookings =
                adminService.getAllBookings();

        response.put("success", true);
        response.put("count", bookings.size());
        response.put("data", bookings);
        return ResponseEntity.ok(response);
    }

    // GET /api/admin/bookings/{id}
    @GetMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>>
            getBooking(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Booking booking =
                    adminService.getBookingById(id);
            response.put("success", true);
            response.put("data", booking);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(response);
        }
    }

    // PUT /api/admin/bookings/{id}/cancel
    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<Map<String, Object>>
            cancelBooking(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Booking booking =
                    adminService.cancelBooking(id);
            response.put("success", true);
            response.put("message",
                "Booking cancelled successfully");
            response.put("data", booking);
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
    // REPORTS
    // ==========================================

    // GET /api/admin/reports/bookings
    @GetMapping("/reports/bookings")
    public ResponseEntity<Map<String, Object>>
            getBookingsReport() {

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("report",
            adminService.getBookingsReport());
        return ResponseEntity.ok(response);
    }

    // GET /api/admin/reports/payments
    @GetMapping("/reports/payments")
    public ResponseEntity<Map<String, Object>>
            getPaymentsReport() {

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("report",
            adminService.getPaymentsReport());
        return ResponseEntity.ok(response);
    }

    // GET /api/admin/reports/users
    @GetMapping("/reports/users")
    public ResponseEntity<Map<String, Object>>
            getUsersReport() {

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("report",
            adminService.getUsersReport());
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ANALYTICS
    // ==========================================

    // GET /api/admin/analytics/overview
    @GetMapping("/analytics/overview")
    public ResponseEntity<Map<String, Object>>
            getOverviewAnalytics() {

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("analytics",
            adminService.getOverviewAnalytics());
        return ResponseEntity.ok(response);
    }

    // GET /api/admin/analytics/revenue
    @GetMapping("/analytics/revenue")
    public ResponseEntity<Map<String, Object>>
            getRevenueAnalytics() {

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("analytics",
            adminService.getRevenueAnalytics());
        return ResponseEntity.ok(response);
    }
}
