package com.traveloptix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, 
          message = "Full name cannot exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    private String email;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, 
          message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "TOURIST|TOUR_GUIDE|HOST_FAMILY|ADMIN",
             message = "Role must be TOURIST, TOUR_GUIDE, HOST_FAMILY or ADMIN")
    private String role;

    // Tourist specific fields
    private String nationality;
    private String passportNumber;
    private String dateOfBirth;

    // Tour Guide specific fields
    private String languages;
    private String expertiseAreas;
    private Integer yearsExperience;
    private String bio;
    private Double hourlyRate;

    // Host Family specific fields
    private String familyName;
    private String address;
    private String region;
    private Integer maxGuests;
    private String description;
}
