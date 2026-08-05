package com.traveloptix.service;

import com.traveloptix.dto.PaymentRequest;
import com.traveloptix.model.Booking;
import com.traveloptix.model.Notification;
import com.traveloptix.model.Payment;
import com.traveloptix.model.Tourist;
import com.traveloptix.repository.BookingRepository;
import com.traveloptix.repository.NotificationRepository;
import com.traveloptix.repository.PaymentRepository;
import com.traveloptix.repository.TouristRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${paystack.secret-key:}")
    private String paystackSecretKey;

    @Value("${paystack.callback-url:https://traveloptix.app/paystack/callback}")
    private String paystackCallbackUrl;

    @Value("${travel-pass.renewal-fee:25}")
    private BigDecimal travelPassRenewalFee;

    private static final String PAYSTACK_INIT_URL =
            "https://api.paystack.co/transaction/initialize";

    private static final String PAYSTACK_VERIFY_URL =
            "https://api.paystack.co/transaction/verify/";

    // ==========================================
    // PAYSTACK SINGLE: INITIALIZE
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> initializePaystack(
            Integer userId,
            Integer bookingId) {

        validatePaystackConfig();

        Tourist tourist = getTouristByUserId(userId);

        Booking booking = bookingRepository
                .findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateBookingCanBePaidByTourist(booking, tourist);

        Payment payment = paymentRepository
                .findByBooking_BookingId(bookingId)
                .orElse(null);

        if (payment != null &&
                "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException("This booking has already been paid");
        }

        BigDecimal amount = booking.getTotalAmount();

        String reference = "TO-" + bookingId + "-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();

        Map<String, Object> paystackData = callPaystackInitialize(
                tourist.getUser().getEmail(),
                amount,
                reference
        );

        String authorizationUrl =
                String.valueOf(paystackData.get("authorization_url"));

        if (payment == null) {
            payment = new Payment();
            payment.setBooking(booking);
            payment.setTourist(tourist);
        }

        payment.setAmount(amount);
        payment.setCurrency("GHS");
        payment.setPaymentMethod("PAYSTACK");
        payment.setPaymentStatus("PENDING");
        payment.setTransactionRef(reference);
        payment.setPaidAt(null);

        paymentRepository.save(payment);

        System.out.println("💳 PAYSTACK INITIALIZED" +
                "\n   Booking: " + bookingId +
                "\n   Amount: GHS " + amount +
                "\n   Ref: " + reference);

        Map<String, Object> result = new HashMap<>();
        result.put("authorizationUrl", authorizationUrl);
        result.put("reference", reference);
        result.put("amount", amount);
        result.put("bookingCount", 1);

        return result;
    }

    // ==========================================
    // PAYSTACK SINGLE: VERIFY
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Payment verifyPaystack(
            Integer userId,
            String reference) {

        Payment payment = paymentRepository
                .findByTransactionRef(reference)
                .orElseThrow(() -> new RuntimeException(
                        "Payment not found for this reference"));

        Tourist tourist = getTouristByUserId(userId);

        if (!payment.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException("This payment does not belong to you");
        }

        if ("SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            return payment;
        }

        Map<String, Object> data = callPaystackVerify(reference);

        String gatewayStatus = data != null
                ? String.valueOf(data.get("status"))
                : null;

        if ("success".equalsIgnoreCase(gatewayStatus)) {
            String finalMethod = resolvePaystackMethod(data);

            payment.setPaymentStatus("SUCCESS");
            payment.setPaymentMethod(finalMethod);
            payment.setPaidAt(LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(payment);

            Booking booking = payment.getBooking();
            booking.setStatus("CONFIRMED");
            bookingRepository.save(booking);

            sendPaymentNotification(
                    tourist,
                    booking,
                    savedPayment,
                    "Paystack"
            );

            System.out.println("✅ PAYSTACK PAYMENT SUCCESS!" +
                    "\n   Ref: " + reference +
                    "\n   Amount: GHS " + payment.getAmount());

            return savedPayment;
        }

        System.out.println("⚠️ Paystack verify: status = " + gatewayStatus);

        return payment;
    }

    // ==========================================
    // PAYSTACK BULK: INITIALIZE
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> initializeBulkPaystack(
            Integer userId,
            List<Integer> bookingIds) {

        validatePaystackConfig();

        if (bookingIds == null || bookingIds.isEmpty()) {
            throw new RuntimeException("Select at least one booking");
        }

        Tourist tourist = getTouristByUserId(userId);

        List<Booking> selectedBookings =
                bookingRepository.findAllById(bookingIds);

        if (selectedBookings.size() != bookingIds.size()) {
            throw new RuntimeException("One or more bookings were not found");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Booking booking : selectedBookings) {
            validateBookingCanBePaidByTourist(booking, tourist);

            Payment existingPayment = paymentRepository
                    .findByBooking_BookingId(booking.getBookingId())
                    .orElse(null);

            if (existingPayment != null &&
                    "SUCCESS".equalsIgnoreCase(existingPayment.getPaymentStatus())) {
                throw new RuntimeException(
                        "Booking #" + booking.getBookingId() +
                                " has already been paid");
            }

            totalAmount = totalAmount.add(booking.getTotalAmount());
        }

        String reference = "TO-BULK-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 10)
                        .toUpperCase();

        Map<String, Object> paystackData = callPaystackInitialize(
                tourist.getUser().getEmail(),
                totalAmount,
                reference
        );

        String authorizationUrl =
                String.valueOf(paystackData.get("authorization_url"));

        for (Booking booking : selectedBookings) {
            Payment payment = paymentRepository
                    .findByBooking_BookingId(booking.getBookingId())
                    .orElse(null);

            if (payment == null) {
                payment = new Payment();
                payment.setBooking(booking);
                payment.setTourist(tourist);
            }

            payment.setAmount(booking.getTotalAmount());
            payment.setCurrency("GHS");
            payment.setPaymentMethod("PAYSTACK");
            payment.setPaymentStatus("PENDING");
            payment.setTransactionRef(reference);
            payment.setPaidAt(null);

            paymentRepository.save(payment);
        }

        System.out.println("💳 BULK PAYSTACK INITIALIZED" +
                "\n   Bookings: " + selectedBookings.size() +
                "\n   Amount: GHS " + totalAmount);

        Map<String, Object> result = new HashMap<>();
        result.put("authorizationUrl", authorizationUrl);
        result.put("reference", reference);
        result.put("amount", totalAmount);
        result.put("bookingCount", selectedBookings.size());

        return result;
    }

    // ==========================================
    // PAYSTACK BULK: VERIFY
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public List<Payment> verifyBulkPaystack(
            Integer userId,
            String reference) {

        Tourist tourist = getTouristByUserId(userId);

        List<Payment> payments =
                paymentRepository.findAllByTransactionRef(reference);

        if (payments == null || payments.isEmpty()) {
            throw new RuntimeException("No payments found for this reference");
        }

        for (Payment payment : payments) {
            if (!payment.getTourist().getTouristId()
                    .equals(tourist.getTouristId())) {
                throw new RuntimeException("This payment does not belong to you");
            }
        }

        boolean alreadySuccessful = payments.stream()
                .allMatch(payment ->
                        "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()));

        if (alreadySuccessful) {
            return payments;
        }

        Map<String, Object> data = callPaystackVerify(reference);

        String gatewayStatus = data != null
                ? String.valueOf(data.get("status"))
                : null;

        if (!"success".equalsIgnoreCase(gatewayStatus)) {
            System.out.println("⚠️ Paystack bulk verify: status = " + gatewayStatus);
            return payments;
        }

        String finalMethod = resolvePaystackMethod(data);

        for (Payment payment : payments) {
            payment.setPaymentStatus("SUCCESS");
            payment.setPaymentMethod(finalMethod);
            payment.setPaidAt(LocalDateTime.now());

            paymentRepository.save(payment);

            Booking booking = payment.getBooking();
            booking.setStatus("CONFIRMED");
            bookingRepository.save(booking);

            sendPaymentNotification(
                    tourist,
                    booking,
                    payment,
                    "Paystack"
            );
        }

        System.out.println("✅ BULK PAYSTACK PAYMENT SUCCESS!" +
                "\n   Ref: " + reference +
                "\n   Payment rows: " + payments.size());

        return paymentRepository.findAllByTransactionRef(reference);
    }

    // ==========================================
    // TRAVEL PASS RENEWAL: INITIALIZE
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> initializeTravelPassRenewal(
            Integer userId) {

        validatePaystackConfig();

        Tourist tourist = getTouristByUserId(userId);

        BigDecimal fee = travelPassRenewalFee;

        String reference = "TO-PASS-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();

        Map<String, Object> paystackData = callPaystackInitialize(
                tourist.getUser().getEmail(),
                fee,
                reference
        );

        String authorizationUrl =
                String.valueOf(paystackData.get("authorization_url"));

        System.out.println("💳 TRAVEL PASS RENEWAL INITIALIZED" +
                "\n   User: " + userId +
                "\n   Fee: GHS " + fee +
                "\n   Ref: " + reference);

        Map<String, Object> result = new HashMap<>();
        result.put("authorizationUrl", authorizationUrl);
        result.put("reference", reference);
        result.put("amount", fee);

        return result;
    }

    // ==========================================
    // TRAVEL PASS RENEWAL: VERIFY
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyTravelPassRenewal(
            Integer userId,
            String reference) {

        Tourist tourist = getTouristByUserId(userId);

        Map<String, Object> data = callPaystackVerify(reference);

        String gatewayStatus = data != null
                ? String.valueOf(data.get("status"))
                : null;

        Map<String, Object> result = new HashMap<>();

        if ("success".equalsIgnoreCase(gatewayStatus)) {

            LocalDate currentExpiry =
                    tourist.getPassExpiryDate() != null
                            ? tourist.getPassExpiryDate()
                            : LocalDate.now();

            LocalDate newExpiry;

            if (currentExpiry.isAfter(LocalDate.now())) {
                newExpiry = currentExpiry.plusYears(1);
            } else {
                newExpiry = LocalDate.now().plusYears(1);
            }

            tourist.setPassExpiryDate(newExpiry);
            touristRepository.save(tourist);

            Notification notification = new Notification();
            notification.setUser(tourist.getUser());
            notification.setTitle("Travel Pass Renewed!");
            notification.setMessage(
                    "Your Travel Pass has been renewed successfully! " +
                            "New expiry: " + newExpiry
            );
            notification.setType("PAYMENT");
            notification.setChannel("PUSH");
            notification.setIsRead(false);
            notificationRepository.save(notification);

            System.out.println("✅ TRAVEL PASS RENEWED!" +
                    "\n   User: " + userId +
                    "\n   New Expiry: " + newExpiry +
                    "\n   Ref: " + reference);

            result.put("paymentStatus", "SUCCESS");
            result.put("newExpiryDate", newExpiry.toString());
            result.put("reference", reference);
        } else {
            result.put("paymentStatus", gatewayStatus);
            result.put("message", "Payment was not successful");
        }

        return result;
    }

    // ==========================================
    // LEGACY MOBILE MONEY PAYMENT
    // ==========================================
    @Transactional
    public Payment processMobileMoneyPayment(
            Integer userId,
            PaymentRequest request) {

        Tourist tourist = getTouristByUserId(userId);

        Booking booking = bookingRepository
                .findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException("This booking does not belong to you");
        }

        if (paymentRepository
                .findByBooking_BookingId(request.getBookingId())
                .isPresent()) {
            throw new RuntimeException("This booking has already been paid");
        }

        if (request.getMobileNumber() == null ||
                request.getMobileNumber().isBlank()) {
            throw new RuntimeException(
                    "Mobile number is required for Mobile Money payment");
        }

        String transactionRef = "MM-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setTourist(tourist);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency(request.getCurrency());
        payment.setPaymentMethod("MOBILE_MONEY");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        sendPaymentNotification(
                tourist,
                booking,
                savedPayment,
                "Mobile Money"
        );

        return savedPayment;
    }

    // ==========================================
    // LEGACY CARD PAYMENT
    // ==========================================
    @Transactional
    public Payment processCardPayment(
            Integer userId,
            PaymentRequest request) {

        Tourist tourist = getTouristByUserId(userId);

        Booking booking = bookingRepository
                .findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException("This booking does not belong to you");
        }

        if (paymentRepository
                .findByBooking_BookingId(request.getBookingId())
                .isPresent()) {
            throw new RuntimeException("This booking has already been paid");
        }

        if (request.getCardNumber() == null ||
                request.getCardNumber().isBlank()) {
            throw new RuntimeException("Card number is required");
        }

        String transactionRef = "CD-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setTourist(tourist);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency(request.getCurrency());
        payment.setPaymentMethod("CARD");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        sendPaymentNotification(
                tourist,
                booking,
                savedPayment,
                "Card"
        );

        return savedPayment;
    }

    // ==========================================
    // GET PAYMENT BY BOOKING ID
    // ==========================================
    public Payment getPaymentByBookingId(Integer bookingId) {
        return paymentRepository
                .findByBooking_BookingId(bookingId)
                .orElseThrow(() -> new RuntimeException(
                        "No payment found for this booking"));
    }

    // ==========================================
    // GET MY PAYMENT HISTORY
    // ==========================================
    public List<Payment> getMyPayments(Integer userId) {
        Tourist tourist = getTouristByUserId(userId);

        return paymentRepository.findByTourist_TouristId(
                tourist.getTouristId()
        );
    }

    // ==========================================
    // REFUND PAYMENT
    // ==========================================
    @Transactional
    public Payment refundPayment(Integer paymentId) {
        Payment payment = paymentRepository
                .findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!"SUCCESS".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException("Only successful payments can be refunded");
        }

        payment.setPaymentStatus("REFUNDED");
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        return payment;
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private void validatePaystackConfig() {
        if (paystackSecretKey == null || paystackSecretKey.isBlank()) {
            throw new RuntimeException("Paystack is not configured on the server");
        }
    }

    private Tourist getTouristByUserId(Integer userId) {
        return touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));
    }

    private void validateBookingCanBePaidByTourist(
            Booking booking,
            Tourist tourist) {

        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException("One or more bookings do not belong to you");
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Cancelled bookings cannot be paid");
        }

        if ("COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Completed bookings cannot be paid again");
        }

        BigDecimal amount = booking.getTotalAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("One or more bookings have no amount to pay");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPaystackInitialize(
            String email,
            BigDecimal amount,
            String reference) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(paystackSecretKey);

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("amount", amount.multiply(new BigDecimal("100")).intValue());
        body.put("currency", "GHS");
        body.put("reference", reference);
        body.put("callback_url", paystackCallbackUrl);

        Map<String, Object> paystackResponse;

        try {
            paystackResponse = restTemplate.postForObject(
                    PAYSTACK_INIT_URL,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        } catch (Exception e) {
            System.out.println("❌ Paystack init error: " + e.getMessage());
            throw new RuntimeException("Could not reach Paystack. Please try again.");
        }

        if (paystackResponse == null ||
                !Boolean.TRUE.equals(paystackResponse.get("status"))) {
            String msg = paystackResponse != null
                    ? String.valueOf(paystackResponse.get("message"))
                    : "no response";

            throw new RuntimeException("Paystack error: " + msg);
        }

        return (Map<String, Object>) paystackResponse.get("data");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPaystackVerify(String reference) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(paystackSecretKey);

        Map<String, Object> paystackResponse;

        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    PAYSTACK_VERIFY_URL + reference,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            paystackResponse = resp.getBody();

        } catch (Exception e) {
            System.out.println("❌ Paystack verify error: " + e.getMessage());
            throw new RuntimeException("Could not verify with Paystack. Please try again.");
        }

        boolean ok = paystackResponse != null &&
                Boolean.TRUE.equals(paystackResponse.get("status"));

        if (!ok) {
            throw new RuntimeException("Paystack verification failed");
        }

        return (Map<String, Object>) paystackResponse.get("data");
    }

    private String resolvePaystackMethod(Map<String, Object> data) {
        String channel = data.get("channel") != null
                ? String.valueOf(data.get("channel"))
                : "";

        if ("card".equalsIgnoreCase(channel)) {
            return "CARD";
        }

        if ("mobile_money".equalsIgnoreCase(channel)) {
            return "MOBILE_MONEY";
        }

        return "PAYSTACK";
    }

    private void sendPaymentNotification(
            Tourist tourist,
            Booking booking,
            Payment payment,
            String method) {

        Notification notification = new Notification();
        notification.setUser(tourist.getUser());
        notification.setBooking(booking);
        notification.setTitle("Payment Successful!");
        notification.setMessage(
                "Your " + method + " payment of GHS " +
                        payment.getAmount() +
                        " was successful! Transaction Ref: " +
                        payment.getTransactionRef() +
                        ". Booking ID: " +
                        booking.getBookingId() +
                        " is now CONFIRMED."
        );
        notification.setType("PAYMENT");
        notification.setChannel("PUSH");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
}