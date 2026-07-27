package com.traveloptix.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhoneVerifyRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String verificationCode;
}