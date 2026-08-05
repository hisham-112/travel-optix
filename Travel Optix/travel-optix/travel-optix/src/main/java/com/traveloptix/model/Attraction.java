package com.traveloptix.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attractions")
public class Attraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attraction_id")
    private Integer attractionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "entry_fee")
    private Double entryFee;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ✅ NEW - comma-separated extra photos for the image slider
    // Example: "https://img1.jpg, https://img2.jpg, https://img3.jpg"
    @Column(name = "photo_urls", columnDefinition = "TEXT")
    private String photoUrls;

    @Column(name = "is_active")
    private Boolean isActive = true;
}