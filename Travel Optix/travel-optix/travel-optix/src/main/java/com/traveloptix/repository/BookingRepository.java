package com.traveloptix.repository;

import com.traveloptix.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository
    extends JpaRepository<Booking, Integer> {

    List<Booking> findByTourist_TouristId(Integer touristId);

    List<Booking> findByBookingType(String bookingType);

    List<Booking> findByStatus(String status);

    @Modifying
    @Query("UPDATE Booking b SET b.status = 'CANCELLED' WHERE b.bookingId = :bookingId AND b.tourist.touristId = :touristId AND b.status NOT IN ('CANCELLED', 'COMPLETED')")
    int cancelBooking(@Param("bookingId") Integer bookingId, @Param("touristId") Integer touristId);
}