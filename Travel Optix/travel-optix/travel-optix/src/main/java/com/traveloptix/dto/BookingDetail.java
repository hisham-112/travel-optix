package com.traveloptix.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDetail {

    private Integer bookingId;
    private String bookingType;
    private Integer referenceId;
    private LocalDate scheduledDate;
    private String status;
    private BigDecimal totalAmount;
    private String notes;

    private String referenceName;
    private String referenceLocation;
    private String referenceRegion;
    private String referenceImage;
}