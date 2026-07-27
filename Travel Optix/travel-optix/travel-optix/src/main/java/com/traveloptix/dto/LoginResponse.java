package com.traveloptix.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {

    private String token;
    private String tokenType = "Bearer";
    private Integer userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean isVerified;

    public LoginResponse(
            String token,
            Integer userId,
            String fullName,
            String email,
            String role,
            Boolean isVerified) {
        this.token = token;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.isVerified = isVerified;
    }
}
