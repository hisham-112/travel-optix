package com.traveloptix.repository;

import com.traveloptix.model.HostFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HostFamilyRepository
    extends JpaRepository<HostFamily, Integer> {

    Optional<HostFamily> findByUser_UserId(Integer userId);

    // NEW
    List<HostFamily> findByVerificationStatus(
            String verificationStatus);
}