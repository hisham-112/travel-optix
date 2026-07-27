package com.traveloptix.service;

import com.traveloptix.model.Attraction;
import com.traveloptix.repository.AttractionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AttractionService {

    @Autowired
    private AttractionRepository attractionRepository;

    // Get all active attractions
    public List<Attraction> getAllAttractions() {
        return attractionRepository.findByIsActiveTrue();
    }

    // Get one attraction by id
    public Attraction getAttractionById(Integer id) {
        return attractionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Attraction not found"));
    }

    // Get attractions by region
    public List<Attraction> getByRegion(String region) {
        return attractionRepository.findByRegion(region);
    }

    // Get attractions by category
    public List<Attraction> getByCategory(String category) {
        return attractionRepository.findByCategory(category);
    }
}