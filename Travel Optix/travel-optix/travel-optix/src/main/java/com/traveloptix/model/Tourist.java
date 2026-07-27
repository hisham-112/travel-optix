package com.traveloptix.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tourists")
public class Tourist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tourist_id")
    private Integer touristId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"passwordHash", "createdAt", "updatedAt"})
    private User user;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "passport_number", length = 50)
    private String passportNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "travel_pass_code", unique = true, length = 50)
    private String travelPassCode;

    // ✅ NEW - tracks when the pass expires
    @Column(name = "pass_expiry_date")
    private LocalDate passExpiryDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // ✅ New tourists get 1 free year automatically
        if (passExpiryDate == null) {
            passExpiryDate = LocalDate.now().plusYears(1);
        }
    }
}