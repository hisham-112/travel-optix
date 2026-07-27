package com.traveloptix.repository;

import com.traveloptix.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Integer> {

    // ✅ Matches getMyNotifications() in your service
    List<Notification> findByUser_UserIdOrderBySentAtDesc(
            Integer userId);

    // ✅ Matches getUnreadNotifications() and markAllAsRead() in your service
    List<Notification> findByUser_UserIdAndIsReadFalse(
            Integer userId);
}