package com.traveloptix.service;

import com.traveloptix.model.Event;
import com.traveloptix.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    // Get all active events
    public List<Event> getAllEvents() {
        return eventRepository.findByIsActiveTrue();
    }

    // Get one event by id
    public Event getEventById(Integer id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Event not found"));
    }

    // Get events by type
    public List<Event> getEventsByType(String type) {
        return eventRepository.findByEventType(type);
    }
}