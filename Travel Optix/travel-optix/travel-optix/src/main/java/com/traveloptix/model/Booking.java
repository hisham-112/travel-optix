package com.traveloptix.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer bookingId;

    @ManyToOne
    @JoinColumn(name = "tourist_id", nullable = false)
    @JsonIgnoreProperties({"user", "createdAt"})
    private Tourist tourist;

    @Column(name = "booking_type",
            nullable = false, length = 20)
    private String bookingType;

    @Column(name = "reference_id", nullable = false)
    private Integer referenceId;

    @Column(name = "booking_date")
    private LocalDateTime bookingDate;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "total_amount",
            precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        bookingDate = LocalDateTime.now();
    }
}