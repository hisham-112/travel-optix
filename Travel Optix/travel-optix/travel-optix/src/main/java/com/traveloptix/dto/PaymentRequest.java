package com.traveloptix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {

    @NotNull(message = "Booking ID is required")
    private Integer bookingId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    // For Mobile Money
    private String mobileNumber;
    private String mobileProvider;

    // For Card Payment
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
    private String cardHolderName;

    private String currency = "GHS";
}