package com.traveloptix.controller;

import com.traveloptix.model.TourGuide;
import com.traveloptix.service.TourGuideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guides")
@CrossOrigin(origins = "*")
public class TourGuideController {

    @Autowired
    private TourGuideService tourGuideService;

    // ==========================================
    // GET /api/guides
    // (Public — view all approved guides)
    // ==========================================
    @GetMapping
    public ResponseEntity<Map<String, Object>>
            getAllGuides() {

        Map<String, Object> response = new HashMap<>();
        List<TourGuide> guides =
                tourGuideService.getAllApprovedGuides();

        response.put("success", true);
        response.put("count", guides.size());
        response.put("data", guides);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET /api/guides/{id}
    // (Public — view one guide)
    // ==========================================
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>>
            getGuide(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            TourGuide guide =
                    tourGuideService.getGuideById(id);
            response.put("success", true);
            response.put("data", guide);
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