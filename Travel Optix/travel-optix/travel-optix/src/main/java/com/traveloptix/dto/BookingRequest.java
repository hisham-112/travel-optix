package com.traveloptix.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingRequest {

    // ✅ Removed @NotNull so transport (and others that don't need it) work
    private Integer referenceId;

    @NotBlank(message = "Scheduled date is required")
    private String scheduledDate;

    private String notes;
    private Integer numberOfPeople;
    private String familyName;

    // Transport fields
    private String transportType;
    private String route;
}