package com.traveloptix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventRequest {

    @NotBlank(message = "Event name is required")
    private String name;

    private String description;

    @NotBlank(message = "Event type is required")
    private String eventType;

    private String location;

    @NotBlank(message = "Event date is required")
    private String eventDate;

    private String startTime;
    private String endTime;

    @NotNull(message = "Max participants is required")
    private Integer maxParticipants;

    @NotNull(message = "Price per person is required")
    private Double pricePerPerson;
}