package com.traveloptix.dto;

import lombok.Data;

@Data
public class PassRenewalRequest {
    private String paymentMethod; // "MOBILE_MONEY" or "CARD"

    // Mobile Money fields
    private String mobileNumber;
    private String mobileProvider;

    // Card fields
    private String cardHolderName;
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
}