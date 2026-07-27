package com.traveloptix.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Integer notificationId;

    // ✅ Proper relationship - matches setUser() in your service
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({
        "passwordHash", "createdAt", "updatedAt",
        "authorities", "accountNonExpired",
        "accountNonLocked", "credentialsNonExpired",
        "enabled", "username", "password"
    })
    private User user;

    // ✅ Proper relationship - matches setBooking() in your service
    @ManyToOne
    @JoinColumn(name = "booking_id")
    @JsonIgnoreProperties({"tourist", "notes"})
    private Booking booking;

    @Column(name = "title", length = 150)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "channel", length = 20)
    private String channel;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}