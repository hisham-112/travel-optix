package com.traveloptix.repository;

import com.traveloptix.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository
    extends JpaRepository<Event, Integer> {

    List<Event> findByIsActiveTrue();

    List<Event> findByEventType(String eventType);

    List<Event> findByFamily_FamilyId(Integer familyId);
}