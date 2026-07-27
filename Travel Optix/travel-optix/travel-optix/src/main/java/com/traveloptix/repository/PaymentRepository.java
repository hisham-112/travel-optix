package com.traveloptix.repository;

import com.traveloptix.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository
    extends JpaRepository<Payment, Integer> {

    // Find payment by booking
    Optional<Payment> findByBooking_BookingId(
            Integer bookingId);

    // Find all payments for a tourist
    List<Payment> findByTourist_TouristId(
            Integer touristId);

    // Find by payment status
    List<Payment> findByPaymentStatus(
            String paymentStatus);

    // Find by transaction reference
    Optional<Payment> findByTransactionRef(
            String transactionRef);
}