package com.traveloptix.repository;

import com.traveloptix.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Integer> {

    List<Notification> findByUser_UserIdOrderBySentAtDesc(
            Integer userId);

    List<Notification> findByUser_UserIdAndIsReadFalse(
            Integer userId);

    // ✅ NEW - for the unread badge count
    long countByUser_UserIdAndIsReadFalse(Integer userId);

    // ✅ NEW - for "Clear all"
    @Transactional
    void deleteByUser_UserId(Integer userId);
}