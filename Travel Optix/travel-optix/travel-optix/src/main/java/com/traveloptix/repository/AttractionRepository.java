package com.traveloptix.repository;

import com.traveloptix.model.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttractionRepository 
    extends JpaRepository<Attraction, Integer> {

    List<Attraction> findByIsActiveTrue();

    List<Attraction> findByRegion(String region);

    List<Attraction> findByCategory(String category);
}