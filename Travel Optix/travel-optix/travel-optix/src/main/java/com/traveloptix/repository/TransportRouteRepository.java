package com.traveloptix.repository;

import com.traveloptix.model.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransportRouteRepository
        extends JpaRepository<TransportRoute, Integer> {

    List<TransportRoute> findByIsActiveTrueOrderByModeAscDepartureTimeAsc();
}