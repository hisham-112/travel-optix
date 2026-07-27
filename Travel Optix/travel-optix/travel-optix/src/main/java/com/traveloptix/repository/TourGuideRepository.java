package com.traveloptix.repository;

import com.traveloptix.model.TourGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TourGuideRepository
    extends JpaRepository<TourGuide, Integer> {

    Optional<TourGuide> findByUser_UserId(Integer userId);

    // NEW — find all approved guides
    List<TourGuide> findByVerificationStatus(
            String verificationStatus);
}