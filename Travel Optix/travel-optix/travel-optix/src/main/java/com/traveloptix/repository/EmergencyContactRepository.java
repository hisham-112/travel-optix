package com.traveloptix.repository;

import com.traveloptix.model.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyContactRepository
    extends JpaRepository<EmergencyContact, Integer> {

    // Get all contacts for a tourist
    List<EmergencyContact> findByTourist_TouristId(
            Integer touristId);

    // Get primary guardian for a tourist
    Optional<EmergencyContact> 
        findByTourist_TouristIdAndIsPrimaryTrue(
            Integer touristId);

    // Get all contacts by tourist user id
    List<EmergencyContact> findByTourist_User_UserId(
            Integer userId);
}