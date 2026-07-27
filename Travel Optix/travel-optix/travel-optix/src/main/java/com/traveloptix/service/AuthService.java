package com.traveloptix.service;

import com.traveloptix.dto.LoginRequest;
import com.traveloptix.dto.LoginResponse;
import com.traveloptix.dto.RegisterRequest;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.TourGuide;
import com.traveloptix.model.Tourist;
import com.traveloptix.model.User;
import com.traveloptix.repository.HostFamilyRepository;
import com.traveloptix.repository.TourGuideRepository;
import com.traveloptix.repository.TouristRepository;
import com.traveloptix.repository.UserRepository;
import com.traveloptix.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private TourGuideRepository tourGuideRepository;

    @Autowired
    private HostFamilyRepository hostFamilyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // ==========================================
    // REGISTER
    // ==========================================
    @Transactional
    public String register(RegisterRequest request) {

        // Check if email already exists
        if (userRepository.existsByEmail(
                request.getEmail())) {
            throw new RuntimeException(
                "Email already registered");
        }

        // Check if phone already exists
        if (userRepository.existsByPhone(
                request.getPhone())) {
            throw new RuntimeException(
                "Phone number already registered");
        }

        // Create base User
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(
            passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsVerified(false);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Create role specific profile
        switch (request.getRole()) {

            case "TOURIST" -> {
                Tourist tourist = new Tourist();
                tourist.setUser(savedUser);
                tourist.setNationality(
                    request.getNationality());
                tourist.setPassportNumber(
                    request.getPassportNumber());

                // Generate unique travel pass code
                tourist.setTravelPassCode(
                    "TOPT-" + 
                    LocalDate.now().getYear() + 
                    "-" + 
                    UUID.randomUUID()
                        .toString()
                        .substring(0, 5)
                        .toUpperCase());

                if (request.getDateOfBirth() != null) {
                    tourist.setDateOfBirth(
                        LocalDate.parse(
                            request.getDateOfBirth()));
                }

                touristRepository.save(tourist);
            }

            case "TOUR_GUIDE" -> {
                TourGuide guide = new TourGuide();
                guide.setUser(savedUser);
                guide.setLanguages(request.getLanguages());
                guide.setExpertiseAreas(
                    request.getExpertiseAreas());
                guide.setYearsExperience(
                    request.getYearsExperience() != null 
                    ? request.getYearsExperience() : 0);
                guide.setBio(request.getBio());

                if (request.getHourlyRate() != null) {
                    guide.setHourlyRate(
                        BigDecimal.valueOf(
                            request.getHourlyRate()));
                }

                guide.setVerificationStatus("PENDING");
                tourGuideRepository.save(guide);
            }

            case "HOST_FAMILY" -> {
                HostFamily family = new HostFamily();
                family.setUser(savedUser);
                family.setFamilyName(request.getFamilyName());
                family.setAddress(request.getAddress());
                family.setRegion(request.getRegion());
                family.setMaxGuests(
                    request.getMaxGuests() != null 
                    ? request.getMaxGuests() : 1);
                family.setDescription(
                    request.getDescription());
                family.setVerificationStatus("PENDING");
                hostFamilyRepository.save(family);
            }
        }

        return "Registration successful! " +
               "Welcome to Travel Optix.";
    }

    // ==========================================
    // LOGIN
    // ==========================================
    public LoginResponse login(LoginRequest request) {

        // Find user by email
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException(
                    "Invalid email or password"));

        // Check if account is active
        if (!user.getIsActive()) {
            throw new RuntimeException(
                "Account is deactivated. " +
                "Please contact support.");
        }

        // Verify password
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {
            throw new RuntimeException(
                "Invalid email or password");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getUserId());

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getIsVerified());
    }
}