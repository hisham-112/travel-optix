package com.traveloptix.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String address;
    private String city;
    private String region;
}
