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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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

    // ==========================================
    // PROCESS MOBILE MONEY PAYMENT
    // ==========================================
    @Transactional
    public Payment processMobileMoneyPayment(
            Integer userId,
            PaymentRequest request) {

        // Find tourist
        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist profile not found"));

        // Find booking
        Booking booking = bookingRepository
                .findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException(
                    "Booking not found"));

        // Check booking belongs to tourist
        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException(
                "This booking does not belong to you");
        }

        // Check if already paid
        if (paymentRepository
                .findByBooking_BookingId(
                    request.getBookingId())
                .isPresent()) {
            throw new RuntimeException(
                "This booking has already been paid");
        }

        // Validate mobile number
        if (request.getMobileNumber() == null
                || request.getMobileNumber().isEmpty()) {
            throw new RuntimeException(
                "Mobile number is required " +
                "for Mobile Money payment");
        }

        // Simulate Mobile Money payment processing
        // In production integrate with:
        // MTN Mobile Money, Vodafone Cash,
        // AirtelTigo Money APIs
        System.out.println(
            "📱 MOBILE MONEY PAYMENT PROCESSING..." +
            "\n   Provider: " + request.getMobileProvider() +
            "\n   Number: " + request.getMobileNumber() +
            "\n   Amount: GHS " + booking.getTotalAmount() +
            "\n   Booking ID: " + booking.getBookingId()
        );

        // Generate transaction reference
        String transactionRef = "MM-" +
                UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();

        // Create payment record
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setTourist(tourist);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency(request.getCurrency());
        payment.setPaymentMethod("MOBILE_MONEY");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());

        Payment savedPayment =
                paymentRepository.save(payment);

        // Update booking status to CONFIRMED
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        // Send payment success notification
        sendPaymentNotification(
            tourist,
            booking,
            savedPayment,
            "Mobile Money");

        System.out.println(
            "✅ MOBILE MONEY PAYMENT SUCCESS!" +
            "\n   Transaction Ref: " + transactionRef +
            "\n   Amount: GHS " + booking.getTotalAmount()
        );

        return savedPayment;
    }

    // ==========================================
    // PROCESS CARD PAYMENT
    // ==========================================
    @Transactional
    public Payment processCardPayment(
            Integer userId,
            PaymentRequest request) {

        // Find tourist
        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist profile not found"));

        // Find booking
        Booking booking = bookingRepository
                .findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException(
                    "Booking not found"));

        // Check booking belongs to tourist
        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException(
                "This booking does not belong to you");
        }

        // Check if already paid
        if (paymentRepository
                .findByBooking_BookingId(
                    request.getBookingId())
                .isPresent()) {
            throw new RuntimeException(
                "This booking has already been paid");
        }

        // Validate card details
        if (request.getCardNumber() == null
                || request.getCardNumber().isEmpty()) {
            throw new RuntimeException(
                "Card number is required");
        }

        // Simulate Card payment processing
        // In production integrate with:
        // Stripe, Paystack, Flutterwave APIs
        System.out.println(
            "💳 CARD PAYMENT PROCESSING..." +
            "\n   Card Holder: " + 
                request.getCardHolderName() +
            "\n   Card: **** **** **** " +
                request.getCardNumber()
                    .substring(
                        request.getCardNumber()
                            .length() - 4) +
            "\n   Amount: GHS " + 
                booking.getTotalAmount() +
            "\n   Booking ID: " + booking.getBookingId()
        );

        // Generate transaction reference
        String transactionRef = "CD-" +
                UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();

        // Create payment record
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setTourist(tourist);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency(request.getCurrency());
        payment.setPaymentMethod("CARD");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());

        Payment savedPayment =
                paymentRepository.save(payment);

        // Update booking status to CONFIRMED
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        // Send payment success notification
        sendPaymentNotification(
            tourist,
            booking,
            savedPayment,
            "Card");

        System.out.println(
            "✅ CARD PAYMENT SUCCESS!" +
            "\n   Transaction Ref: " + transactionRef +
            "\n   Amount: GHS " + booking.getTotalAmount()
        );

        return savedPayment;
    }

    // ==========================================
    // GET PAYMENT BY BOOKING ID
    // ==========================================
    public Payment getPaymentByBookingId(
            Integer bookingId) {
        return paymentRepository
                .findByBooking_BookingId(bookingId)
                .orElseThrow(() -> new RuntimeException(
                    "No payment found for this booking"));
    }

    // ==========================================
    // GET MY PAYMENT HISTORY
    // ==========================================
    public List<Payment> getMyPayments(Integer userId) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist profile not found"));

        return paymentRepository
                .findByTourist_TouristId(
                    tourist.getTouristId());
    }

    // ==========================================
    // REFUND PAYMENT (Admin)
    // ==========================================
    @Transactional
    public Payment refundPayment(Integer paymentId) {

        Payment payment = paymentRepository
                .findById(paymentId)
                .orElseThrow(() -> new RuntimeException(
                    "Payment not found"));

        if (!payment.getPaymentStatus()
                .equals("SUCCESS")) {
            throw new RuntimeException(
                "Only successful payments " +
                "can be refunded");
        }

        payment.setPaymentStatus("REFUNDED");
        paymentRepository.save(payment);

        // Update booking to cancelled
        Booking booking = payment.getBooking();
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        System.out.println(
            "💰 REFUND PROCESSED!" +
            "\n   Payment ID: " + paymentId +
            "\n   Amount: GHS " + payment.getAmount() +
            "\n   Transaction: " + 
                payment.getTransactionRef()
        );

        return payment;
    }

    // ==========================================
    // PRIVATE: Send Payment Notification
    // ==========================================
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
            " was successful! " +
            "Transaction Ref: " +
            payment.getTransactionRef() +
            ". Booking ID: " +
            booking.getBookingId() +
            " is now CONFIRMED.");
        notification.setType("PAYMENT");
        notification.setChannel("PUSH");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
}