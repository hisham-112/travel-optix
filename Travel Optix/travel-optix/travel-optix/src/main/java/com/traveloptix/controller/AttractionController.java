package com.traveloptix.controller;

import com.traveloptix.model.Attraction;
import com.traveloptix.service.AttractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attractions")
@CrossOrigin(origins = "*")
public class AttractionController {

    @Autowired
    private AttractionService attractionService;

    // ==========================================
    // GET /api/attractions
    // (Public — view all attractions)
    // ==========================================
    @GetMapping
    public ResponseEntity<Map<String, Object>> 
            getAllAttractions() {

        Map<String, Object> response = new HashMap<>();
        List<Attraction> attractions = 
                attractionService.getAllAttractions();

        response.put("success", true);
        response.put("count", attractions.size());
        response.put("data", attractions);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET /api/attractions/{id}
    // ==========================================
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> 
            getAttraction(@PathVariable Integer id) {

        Map<String, Object> response = new HashMap<>();

        try {
            Attraction attraction = 
                    attractionService.getAttractionById(id);
            response.put("success", true);
            response.put("data", attraction);
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