package com.traveloptix.service;

import com.traveloptix.model.Booking;
import com.traveloptix.model.EmergencyContact;
import com.traveloptix.model.Notification;
import com.traveloptix.model.Tourist;
import com.traveloptix.model.User;
import com.traveloptix.repository.EmergencyContactRepository;
import com.traveloptix.repository.NotificationRepository;
import com.traveloptix.repository.TouristRepository;
import com.traveloptix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmergencyContactRepository 
            emergencyContactRepository;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private UserRepository userRepository;

    // ==========================================
    // SEND BOOKING CONFIRMATION NOTIFICATION
    // ==========================================
    @Transactional
    public Notification sendBookingConfirmation(
            User user,
            Booking booking,
            String itemName) {

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setBooking(booking);
        notification.setTitle("Booking Confirmed!");
        notification.setMessage(
            "Your booking for " + itemName +
            " on " + booking.getScheduledDate() +
            " has been confirmed. " +
            "Booking ID: " + booking.getBookingId());
        notification.setType("BOOKING");
        notification.setChannel("PUSH");
        notification.setIsRead(false);

        System.out.println(
            "🔔 BOOKING NOTIFICATION sent to: " +
            user.getEmail() +
            " | Booking ID: " + booking.getBookingId());

        return notificationRepository
                .save(notification);
    }

    // ==========================================
    // ⭐ SEND GUARDIAN ALERT
    // (Key Feature of Travel Optix!)
    // ==========================================
    @Transactional
    public void sendGuardianAlert(
            Integer touristId,
            Booking booking,
            String eventName) {

        // Find primary emergency contact
        Optional<EmergencyContact> primaryContact =
                emergencyContactRepository
                    .findByTourist_TouristIdAndIsPrimaryTrue(
                        touristId);

        if (primaryContact.isEmpty()) {
            System.out.println(
                "⚠️ No primary emergency contact " +
                "found for tourist ID: " + touristId);
            return;
        }

        EmergencyContact guardian =
                primaryContact.get();

        // Find the tourist user
        Tourist tourist = touristRepository
                .findById(touristId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist not found"));

        // Log guardian alert
        // In production send SMS/Email to guardian
        System.out.println(
            "🚨 GUARDIAN ALERT SENT!" +
            "\n   Guardian: " + guardian.getFullName() +
            "\n   Phone: " + guardian.getPhone() +
            "\n   Email: " + guardian.getEmail() +
            "\n   Tourist: " + 
                tourist.getUser().getFullName() +
            "\n   Event: " + eventName +
            "\n   Date: " + booking.getScheduledDate() +
            "\n   Booking ID: " + booking.getBookingId()
        );

        // Save guardian alert notification
        // for admin to track
        User adminUser = userRepository
                .findById(1)
                .orElse(tourist.getUser());

        Notification guardianAlert = new Notification();
        guardianAlert.setUser(adminUser);
        guardianAlert.setBooking(booking);
        guardianAlert.setTitle("Guardian Alert Sent");
        guardianAlert.setMessage(
            "Guardian alert sent to " +
            guardian.getFullName() +
            " (" + guardian.getPhone() + ")" +
            " for tourist " +
            tourist.getUser().getFullName() +
            " who booked " + eventName +
            " on " + booking.getScheduledDate());
        guardianAlert.setType("GUARDIAN_ALERT");
        guardianAlert.setChannel("SMS");
        guardianAlert.setIsRead(false);

        notificationRepository.save(guardianAlert);

        // Also notify the tourist
        Notification touristNotification = 
                new Notification();
        touristNotification.setUser(tourist.getUser());
        touristNotification.setBooking(booking);
        touristNotification.setTitle(
            "Event Booking Pending");
        touristNotification.setMessage(
            "Your booking for " + eventName +
            " is PENDING. " +
            "Your guardian " + 
            guardian.getFullName() +
            " has been notified. " +
            "Booking will be confirmed once " +
            "guardian acknowledges.");
        touristNotification.setType("BOOKING");
        touristNotification.setChannel("PUSH");
        touristNotification.setIsRead(false);

        notificationRepository
                .save(touristNotification);
    }

    // ==========================================
    // GET MY NOTIFICATIONS
    // ==========================================
    public List<Notification> getMyNotifications(
            Integer userId) {
        return notificationRepository
                .findByUser_UserIdOrderBySentAtDesc(
                    userId);
    }

    // ==========================================
    // GET MY UNREAD NOTIFICATIONS
    // ==========================================
    public List<Notification> getUnreadNotifications(
            Integer userId) {
        return notificationRepository
                .findByUser_UserIdAndIsReadFalse(userId);
    }

    // ==========================================
    // MARK NOTIFICATION AS READ
    // ==========================================
    @Transactional
    public Notification markAsRead(
            Integer notificationId) {

        Notification notification =
                notificationRepository
                    .findById(notificationId)
                    .orElseThrow(() -> 
                        new RuntimeException(
                            "Notification not found"));

        notification.setIsRead(true);
        return notificationRepository
                .save(notification);
    }

    // ==========================================
    // MARK ALL AS READ
    // ==========================================
    @Transactional
    public String markAllAsRead(Integer userId) {

        List<Notification> unread =
                notificationRepository
                    .findByUser_UserIdAndIsReadFalse(
                        userId);

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);

        return "All " + unread.size() +
               " notifications marked as read";
    }

    // ==========================================
    // ADD EMERGENCY CONTACT
    // ==========================================
    @Transactional
    public EmergencyContact addEmergencyContact(
            Integer userId,
            String fullName,
            String relationship,
            String phone,
            String email,
            Boolean isPrimary) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist profile not found"));

        // If setting as primary reset others
        if (isPrimary) {
            List<EmergencyContact> existing =
                    emergencyContactRepository
                        .findByTourist_TouristId(
                            tourist.getTouristId());

            existing.forEach(c -> c.setIsPrimary(false));
            emergencyContactRepository.saveAll(existing);
        }

        EmergencyContact contact = new EmergencyContact();
        contact.setTourist(tourist);
        contact.setFullName(fullName);
        contact.setRelationship(relationship);
        contact.setPhone(phone);
        contact.setEmail(email);
        contact.setIsPrimary(isPrimary);

        return emergencyContactRepository.save(contact);
    }

    // ==========================================
    // GET MY EMERGENCY CONTACTS
    // ==========================================
    public List<EmergencyContact> getMyEmergencyContacts(
            Integer userId) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tourist profile not found"));

        return emergencyContactRepository
                .findByTourist_TouristId(
                    tourist.getTouristId());
    }
}