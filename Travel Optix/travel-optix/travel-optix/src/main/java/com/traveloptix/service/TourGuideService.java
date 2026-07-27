package com.traveloptix.service;

import com.traveloptix.model.TourGuide;
import com.traveloptix.repository.TourGuideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TourGuideService {

    @Autowired
    private TourGuideRepository tourGuideRepository;

    // Get all approved tour guides
    public List<TourGuide> getAllApprovedGuides() {
        return tourGuideRepository
                .findByVerificationStatus("APPROVED");
    }

    // Get one tour guide by id
    public TourGuide getGuideById(Integer id) {
        return tourGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Tour guide not found"));
    }
}