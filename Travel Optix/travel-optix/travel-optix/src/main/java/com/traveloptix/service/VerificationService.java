package com.traveloptix.service;

import com.traveloptix.dto.VerificationRequest;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.TourGuide;
import com.traveloptix.model.User;
import com.traveloptix.repository.HostFamilyRepository;
import com.traveloptix.repository.TourGuideRepository;
import com.traveloptix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class VerificationService {

    @Autowired
    private TourGuideRepository tourGuideRepository;

    @Autowired
    private HostFamilyRepository hostFamilyRepository;

    @Autowired
    private UserRepository userRepository;

    // Store phone verification codes
    // In production use Redis or database
    private Map<String, String> phoneCodes 
            = new HashMap<>();

    // ==========================================
    // SUBMIT GUIDE ID DOCUMENT
    // ==========================================
    @Transactional
    public TourGuide submitGuideDocuments(
            Integer userId,
            VerificationRequest request) {

        TourGuide guide = tourGuideRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Tour guide profile not found"));

        // Check not already approved
        if (guide.getVerificationStatus()
                .equals("APPROVED")) {
            throw new RuntimeException(
                "Your profile is already approved");
        }

        // Update document URLs
        guide.setIdDocumentUrl(
            request.getIdDocumentUrl());
        guide.setVerificationStatus("PENDING");

        return tourGuideRepository.save(guide);
    }

    // ==========================================
    // SUBMIT FAMILY ID DOCUMENT
    // ==========================================
    @Transactional
    public HostFamily submitFamilyDocuments(
            Integer userId,
            VerificationRequest request) {

        HostFamily family = hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));

        if (family.getVerificationStatus()
                .equals("APPROVED")) {
            throw new RuntimeException(
                "Your profile is already approved");
        }

        family.setIdDocumentUrl(
            request.getIdDocumentUrl());
        family.setAddressProofUrl(
            request.getAddressProofUrl());
        family.setVerificationStatus("PENDING");

        return hostFamilyRepository.save(family);
    }

    // ==========================================
    // SEND PHONE VERIFICATION CODE
    // ==========================================
    public String sendPhoneVerificationCode(
            String phone) {

        // Generate 6 digit code
        String code = String.format("%06d",
                new Random().nextInt(999999));

        // Store code with phone as key
        phoneCodes.put(phone, code);

        // In production send via SMS gateway
        // For now we return it directly for testing
        System.out.println(
            "📱 Verification code for " 
            + phone + ": " + code);

        return "Verification code sent to " + phone;
    }

    // ==========================================
    // CONFIRM PHONE VERIFICATION CODE
    // ==========================================
    @Transactional
    public String confirmPhoneCode(
            Integer userId,
            String phone,
            String code) {

        // Check code matches
        String storedCode = phoneCodes.get(phone);

        if (storedCode == null) {
            throw new RuntimeException(
                "No verification code found. " +
                "Please request a new code.");
        }

        if (!storedCode.equals(code)) {
            throw new RuntimeException(
                "Invalid verification code");
        }

        // Mark user phone as verified
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                    "User not found"));

        user.setIsVerified(true);
        userRepository.save(user);

        // Remove used code
        phoneCodes.remove(phone);

        return "Phone verified successfully!";
    }

    // ==========================================
    // GET ALL PENDING GUIDES (Admin)
    // ==========================================
    public List<TourGuide> getPendingGuides() {
        return tourGuideRepository
                .findByVerificationStatus("PENDING");
    }

    // ==========================================
    // GET ALL PENDING FAMILIES (Admin)
    // ==========================================
    public List<HostFamily> getPendingFamilies() {
        return hostFamilyRepository
                .findByVerificationStatus("PENDING");
    }

    // ==========================================
    // APPROVE TOUR GUIDE (Admin)
    // ==========================================
    @Transactional
    public TourGuide approveGuide(
            Integer guideId,
            Integer adminUserId) {

        TourGuide guide = tourGuideRepository
                .findById(guideId)
                .orElseThrow(() -> new RuntimeException(
                    "Tour guide not found"));

        User admin = userRepository
                .findById(adminUserId)
                .orElseThrow(() -> new RuntimeException(
                    "Admin not found"));

        guide.setVerificationStatus("APPROVED");
        guide.setVerifiedAt(LocalDateTime.now());
        guide.setVerifiedBy(admin);

        // Also mark user as verified
        User guideUser = guide.getUser();
        guideUser.setIsVerified(true);
        userRepository.save(guideUser);

        return tourGuideRepository.save(guide);
    }

    // ==========================================
    // REJECT TOUR GUIDE (Admin)
    // ==========================================
    @Transactional
    public TourGuide rejectGuide(Integer guideId) {

        TourGuide guide = tourGuideRepository
                .findById(guideId)
                .orElseThrow(() -> new RuntimeException(
                    "Tour guide not found"));

        guide.setVerificationStatus("REJECTED");

        return tourGuideRepository.save(guide);
    }

    // ==========================================
    // APPROVE HOST FAMILY (Admin)
    // ==========================================
    @Transactional
    public HostFamily approveFamily(
            Integer familyId,
            Integer adminUserId) {

        HostFamily family = hostFamilyRepository
                .findById(familyId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family not found"));

        User admin = userRepository
                .findById(adminUserId)
                .orElseThrow(() -> new RuntimeException(
                    "Admin not found"));

        family.setVerificationStatus("APPROVED");
        family.setVerifiedAt(LocalDateTime.now());
        family.setVerifiedBy(admin);

        // Also mark user as verified
        User familyUser = family.getUser();
        familyUser.setIsVerified(true);
        userRepository.save(familyUser);

        return hostFamilyRepository.save(family);
    }

    // ==========================================
    // REJECT HOST FAMILY (Admin)
    // ==========================================
    @Transactional
    public HostFamily rejectFamily(Integer familyId) {

        HostFamily family = hostFamilyRepository
                .findById(familyId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family not found"));

        family.setVerificationStatus("REJECTED");

        return hostFamilyRepository.save(family);
    }
}