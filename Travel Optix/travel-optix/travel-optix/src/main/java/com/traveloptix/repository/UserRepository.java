package com.traveloptix.repository;

import com.traveloptix.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Boolean existsByEmail(String email);

    Boolean existsByPhone(String phone);

    // ✅ Add this to your UserRepository interface
    boolean existsByGhanaCardNumber(String ghanaCardNumber);
}