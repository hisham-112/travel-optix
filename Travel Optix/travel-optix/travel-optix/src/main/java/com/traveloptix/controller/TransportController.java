package com.traveloptix.controller;

import com.traveloptix.model.TransportRoute;
import com.traveloptix.repository.TransportRouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@CrossOrigin(origins = "*")
public class TransportController {

    @Autowired
    private TransportRouteRepository transportRouteRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRoutes() {

        Map<String, Object> response = new HashMap<>();

        List<TransportRoute> routes = transportRouteRepository
                .findByIsActiveTrueOrderByModeAscDepartureTimeAsc();

        response.put("success", true);
        response.put("count", routes.size());
        response.put("data", routes);

        return ResponseEntity.ok(response);
    }
}

