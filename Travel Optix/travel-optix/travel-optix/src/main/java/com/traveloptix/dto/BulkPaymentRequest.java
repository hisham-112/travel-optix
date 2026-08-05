package com.traveloptix.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkPaymentRequest {

    @NotEmpty(message = "Select at least one booking")
    private List<Integer> bookingIds;
}