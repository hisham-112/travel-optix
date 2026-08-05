package com.traveloptix.repository;

import com.traveloptix.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByBooking_BookingId(Integer bookingId);

    List<Payment> findByTourist_TouristId(Integer touristId);

    List<Payment> findByPaymentStatus(String paymentStatus);

    Optional<Payment> findByTransactionRef(String transactionRef);

    List<Payment> findAllByTransactionRef(String transactionRef);
}