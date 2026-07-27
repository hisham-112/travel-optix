package com.traveloptix.controller;

import com.traveloptix.dto.BookingRequest;
import com.traveloptix.model.Booking;
import com.traveloptix.model.User;
import com.traveloptix.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tourist/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ✅ BOOK AN ATTRACTION
    @PostMapping("/attraction")
    public ResponseEntity<Map<String, Object>> bookAttraction(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.bookAttraction(
                    user.getUserId(), bookingRequest);
            response.put("success", true);
            response.put("message", "Attraction booked successfully");
            response.put("data", booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ BOOK A TOUR GUIDE
    @PostMapping("/guide")
    public ResponseEntity<Map<String, Object>> bookTourGuide(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.bookTourGuide(
                    user.getUserId(), bookingRequest);
            response.put("success", true);
            response.put("message", "Tour guide booked successfully");
            response.put("data", booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ BOOK A CULTURAL EVENT
    @PostMapping("/event")
    public ResponseEntity<Map<String, Object>> bookEvent(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.bookEvent(
                    user.getUserId(), bookingRequest);
            response.put("success", true);
            response.put("message", "Event booked successfully");
            response.put("data", booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ BOOK A HOST FAMILY
    @PostMapping("/family")
    public ResponseEntity<Map<String, Object>> bookHostFamily(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.bookHostFamily(
                    user.getUserId(), bookingRequest);
            response.put("success", true);
            response.put("message", "Host family booked successfully");
            response.put("data", booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ BOOK TRANSPORT (NEW)
    @PostMapping("/transport")
    public ResponseEntity<Map<String, Object>> bookTransport(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.bookTransport(
                    user.getUserId(),
                    bookingRequest.getTransportType(),
                    bookingRequest.getRoute(),
                    bookingRequest.getScheduledDate(),
                    bookingRequest.getNotes()
            );
            response.put("success", true);
            response.put("message", "Transport booking confirmed");
            response.put("data", booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ GET MY BOOKINGS
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyBookings(
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            List<Booking> bookings = bookingService.getMyBookings(user.getUserId());
            response.put("success", true);
            response.put("count", bookings.size());
            response.put("data", bookings);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ✅ GET ONE BOOKING
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBookingById(
            @PathVariable Integer id,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Booking booking = bookingService.getBookingById(id);
            response.put("success", true);
            response.put("data", booking);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // ✅ CANCEL BOOKING
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable Integer id,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) authentication.getPrincipal();
            Booking booking = bookingService.cancelBooking(id, user.getUserId());
            response.put("success", true);
            response.put("message", "Booking cancelled successfully");
            response.put("data", booking);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}