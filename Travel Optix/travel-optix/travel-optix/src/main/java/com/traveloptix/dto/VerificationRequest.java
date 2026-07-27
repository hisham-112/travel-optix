package com.traveloptix.dto;

import lombok.Data;

@Data
public class VerificationRequest {

    private String idDocumentUrl;
    private String addressProofUrl;
    private String notes;
}
