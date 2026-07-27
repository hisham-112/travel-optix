package com.traveloptix.service;

import com.traveloptix.model.Booking;
import com.traveloptix.model.Payment;
import com.traveloptix.model.User;
import com.traveloptix.repository.BookingRepository;
import com.traveloptix.repository.PaymentRepository;
import com.traveloptix.repository.UserRepository;
import com.traveloptix.repository.AttractionRepository;
import com.traveloptix.repository.EventRepository;
import com.traveloptix.repository.TourGuideRepository;
import com.traveloptix.repository.HostFamilyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TourGuideRepository tourGuideRepository;

    @Autowired
    private HostFamilyRepository hostFamilyRepository;

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get one user
    public User getUserById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "User not found"));
    }

    // Deactivate user
    @Transactional
    public User deactivateUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "User not found"));
        user.setIsActive(false);
        return userRepository.save(user);
    }

    // Activate user
    @Transactional
    public User activateUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "User not found"));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    // ==========================================
    // BOOKING MANAGEMENT
    // ==========================================

    // Get all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Get one booking
    public Booking getBookingById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Booking not found"));
    }

    // Cancel booking
    @Transactional
    public Booking cancelBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Booking not found"));
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    // ==========================================
    // REPORTS
    // ==========================================

    // Bookings report
    public Map<String, Object> getBookingsReport() {
        Map<String, Object> report = new HashMap<>();

        List<Booking> all = bookingRepository.findAll();

        long confirmed = all.stream()
                .filter(b -> b.getStatus()
                    .equals("CONFIRMED"))
                .count();
        long pending = all.stream()
                .filter(b -> b.getStatus()
                    .equals("PENDING"))
                .count();
        long cancelled = all.stream()
                .filter(b -> b.getStatus()
                    .equals("CANCELLED"))
                .count();
        long completed = all.stream()
                .filter(b -> b.getStatus()
                    .equals("COMPLETED"))
                .count();

        long attractions = all.stream()
                .filter(b -> b.getBookingType()
                    .equals("ATTRACTION"))
                .count();
        long guides = all.stream()
                .filter(b -> b.getBookingType()
                    .equals("TOUR_GUIDE"))
                .count();
        long events = all.stream()
                .filter(b -> b.getBookingType()
                    .equals("EVENT"))
                .count();
        long transport = all.stream()
                .filter(b -> b.getBookingType()
                    .equals("TRANSPORT"))
                .count();

        report.put("totalBookings", all.size());
        report.put("confirmed", confirmed);
        report.put("pending", pending);
        report.put("cancelled", cancelled);
        report.put("completed", completed);
        report.put("attractionBookings", attractions);
        report.put("guideBookings", guides);
        report.put("eventBookings", events);
        report.put("transportBookings", transport);

        return report;
    }

    // Payments report
    public Map<String, Object> getPaymentsReport() {
        Map<String, Object> report = new HashMap<>();

        List<Payment> all = paymentRepository.findAll();

        long success = all.stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("SUCCESS"))
                .count();
        long pending = all.stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("PENDING"))
                .count();
        long failed = all.stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("FAILED"))
                .count();
        long refunded = all.stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("REFUNDED"))
                .count();

        long mobileMoney = all.stream()
                .filter(p -> p.getPaymentMethod()
                    .equals("MOBILE_MONEY"))
                .count();
        long card = all.stream()
                .filter(p -> p.getPaymentMethod()
                    .equals("CARD"))
                .count();

        // Total revenue from successful payments
        BigDecimal totalRevenue = all.stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("SUCCESS"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        report.put("totalPayments", all.size());
        report.put("successful", success);
        report.put("pending", pending);
        report.put("failed", failed);
        report.put("refunded", refunded);
        report.put("mobileMoneyPayments", mobileMoney);
        report.put("cardPayments", card);
        report.put("totalRevenue", totalRevenue);

        return report;
    }

    // Users report
    public Map<String, Object> getUsersReport() {
        Map<String, Object> report = new HashMap<>();

        List<User> all = userRepository.findAll();

        long tourists = all.stream()
                .filter(u -> u.getRole()
                    .equals("TOURIST"))
                .count();
        long guides = all.stream()
                .filter(u -> u.getRole()
                    .equals("TOUR_GUIDE"))
                .count();
        long families = all.stream()
                .filter(u -> u.getRole()
                    .equals("HOST_FAMILY"))
                .count();
        long admins = all.stream()
                .filter(u -> u.getRole()
                    .equals("ADMIN"))
                .count();

        long active = all.stream()
                .filter(User::getIsActive)
                .count();
        long verified = all.stream()
                .filter(User::getIsVerified)
                .count();

        report.put("totalUsers", all.size());
        report.put("tourists", tourists);
        report.put("tourGuides", guides);
        report.put("hostFamilies", families);
        report.put("admins", admins);
        report.put("activeUsers", active);
        report.put("verifiedUsers", verified);

        return report;
    }

    // ==========================================
    // ANALYTICS
    // ==========================================

    // Overview analytics
    public Map<String, Object> getOverviewAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Total counts
        analytics.put("totalUsers",
            userRepository.count());
        analytics.put("totalBookings",
            bookingRepository.count());
        analytics.put("totalPayments",
            paymentRepository.count());
        analytics.put("totalAttractions",
            attractionRepository.count());
        analytics.put("totalEvents",
            eventRepository.count());
        analytics.put("totalGuides",
            tourGuideRepository.count());
        analytics.put("totalHostFamilies",
            hostFamilyRepository.count());

        // Pending verifications
        long pendingGuides = tourGuideRepository
                .findByVerificationStatus("PENDING")
                .size();
        long pendingFamilies = hostFamilyRepository
                .findByVerificationStatus("PENDING")
                .size();

        analytics.put("pendingVerifications",
            pendingGuides + pendingFamilies);

        // Total revenue
        BigDecimal totalRevenue = paymentRepository
                .findAll()
                .stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("SUCCESS"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO,
                    BigDecimal::add);

        analytics.put("totalRevenue", totalRevenue);

        return analytics;
    }

    // Revenue analytics
    public Map<String, Object> getRevenueAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        List<Payment> payments = paymentRepository
                .findAll()
                .stream()
                .filter(p -> p.getPaymentStatus()
                    .equals("SUCCESS"))
                .toList();

        // Revenue by payment method
        BigDecimal mobileMoneyRevenue = payments.stream()
                .filter(p -> p.getPaymentMethod()
                    .equals("MOBILE_MONEY"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO,
                    BigDecimal::add);

        BigDecimal cardRevenue = payments.stream()
                .filter(p -> p.getPaymentMethod()
                    .equals("CARD"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO,
                    BigDecimal::add);

        BigDecimal totalRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO,
                    BigDecimal::add);

        analytics.put("totalRevenue", totalRevenue);
        analytics.put("mobileMoneyRevenue",
            mobileMoneyRevenue);
        analytics.put("cardRevenue", cardRevenue);
        analytics.put("totalTransactions",
            payments.size());

        return analytics;
    }
}