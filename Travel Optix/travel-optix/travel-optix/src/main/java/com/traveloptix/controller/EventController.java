package com.traveloptix.controller;

import com.traveloptix.model.Event;
import com.traveloptix.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventService eventService;

    // ==========================================
    // GET /api/events
    // (Public — view all events)
    // ==========================================
    @GetMapping
    public ResponseEntity<Map<String, Object>>
            getAllEvents() {

        Map<String, Object> response = new HashMap<>();
        List<Event> events =
                eventService.getAllEvents();

        response.put("success", true);
        response.put("count", events.size());
        response.put("data", events);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET /api/events/{id}
    // (Public — view one event)
    // ==========================================
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>>
            getEvent(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Event event = eventService.getEventById(id);
            response.put("success", true);
            response.put("data", event);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(response);
        }
    }
}