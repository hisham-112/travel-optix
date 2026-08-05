package com.traveloptix.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Integer eventId;

    @ManyToOne
    @JoinColumn(name = "family_id")
    private HostFamily family;

    @Column(name = "name",
            nullable = false, length = 200)
    private String name;

    @Column(name = "description",
            columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_type", length = 20)
    private String eventType;

    @Column(name = "location", length = 255)
    private String location;

    // ✅ NEW - for the region badge + search in the app
    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "max_participants")
    private Integer maxParticipants = 10;

    @Column(name = "price_per_person",
            precision = 10, scale = 2)
    private BigDecimal pricePerPerson;

    // ✅ NEW - main photo for the image carousel
    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ✅ NEW - comma-separated extra photos for slides
    @Column(name = "photo_urls", columnDefinition = "TEXT")
    private String photoUrls;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}