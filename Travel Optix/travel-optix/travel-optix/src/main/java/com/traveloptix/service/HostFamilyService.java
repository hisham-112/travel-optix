package com.traveloptix.service;

import com.traveloptix.dto.EventRequest;
import com.traveloptix.model.Event;
import com.traveloptix.model.HostFamily;
import com.traveloptix.repository.EventRepository;
import com.traveloptix.repository.HostFamilyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class HostFamilyService {

    @Autowired
    private HostFamilyRepository hostFamilyRepository;

    @Autowired
    private EventRepository eventRepository;

    // ==========================================
    // GET ALL APPROVED HOST FAMILIES
    // ==========================================
    public List<HostFamily> getAllApprovedFamilies() {
        return hostFamilyRepository
                .findByVerificationStatus("APPROVED");
    }

    // ==========================================
    // GET ONE HOST FAMILY
    // ==========================================
    public HostFamily getFamilyById(Integer id) {
        return hostFamilyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "Host family not found"));
    }

    // ==========================================
    // GET MY HOST FAMILY PROFILE
    // ==========================================
    public HostFamily getMyProfile(Integer userId) {
        return hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));
    }

    // ==========================================
    // CREATE A NEW EVENT
    // ==========================================
    @Transactional
    public Event createEvent(
            Integer userId,
            EventRequest request) {

        // Find host family profile
        HostFamily family = hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));

        // Check family is approved
        if (!family.getVerificationStatus()
                .equals("APPROVED")) {
            throw new RuntimeException(
                "Your profile must be approved " +
                "before creating events");
        }

        // Create event
        Event event = new Event();
        event.setFamily(family);
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setEventType(request.getEventType());
        event.setLocation(request.getLocation());
        event.setEventDate(
            LocalDate.parse(request.getEventDate()));
        event.setMaxParticipants(
            request.getMaxParticipants());
        event.setPricePerPerson(
            BigDecimal.valueOf(
                request.getPricePerPerson()));
        event.setIsActive(true);

        // Set start time if provided
        if (request.getStartTime() != null) {
            event.setStartTime(
                LocalTime.parse(request.getStartTime()));
        }

        // Set end time if provided
        if (request.getEndTime() != null) {
            event.setEndTime(
                LocalTime.parse(request.getEndTime()));
        }

        return eventRepository.save(event);
    }

    // ==========================================
    // GET MY EVENTS
    // ==========================================
    public List<Event> getMyEvents(Integer userId) {

        HostFamily family = hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));

        return eventRepository
                .findByFamily_FamilyId(
                    family.getFamilyId());
    }

    // ==========================================
    // UPDATE AN EVENT
    // ==========================================
    @Transactional
    public Event updateEvent(
            Integer userId,
            Integer eventId,
            EventRequest request) {

        // Find host family
        HostFamily family = hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));

        // Find the event
        Event event = eventRepository
                .findById(eventId)
                .orElseThrow(() -> new RuntimeException(
                    "Event not found"));

        // Make sure this family owns the event
        if (!event.getFamily().getFamilyId()
                .equals(family.getFamilyId())) {
            throw new RuntimeException(
                "You are not authorized " +
                "to update this event");
        }

        // Update fields
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setEventType(request.getEventType());
        event.setLocation(request.getLocation());
        event.setEventDate(
            LocalDate.parse(request.getEventDate()));
        event.setMaxParticipants(
            request.getMaxParticipants());
        event.setPricePerPerson(
            BigDecimal.valueOf(
                request.getPricePerPerson()));

        if (request.getStartTime() != null) {
            event.setStartTime(
                LocalTime.parse(request.getStartTime()));
        }

        if (request.getEndTime() != null) {
            event.setEndTime(
                LocalTime.parse(request.getEndTime()));
        }

        return eventRepository.save(event);
    }

    // ==========================================
    // DEACTIVATE AN EVENT
    // ==========================================
    @Transactional
    public String deactivateEvent(
            Integer userId,
            Integer eventId) {

        HostFamily family = hostFamilyRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                    "Host family profile not found"));

        Event event = eventRepository
                .findById(eventId)
                .orElseThrow(() -> new RuntimeException(
                    "Event not found"));

        if (!event.getFamily().getFamilyId()
                .equals(family.getFamilyId())) {
            throw new RuntimeException(
                "You are not authorized " +
                "to deactivate this event");
        }

        event.setIsActive(false);
        eventRepository.save(event);

        return "Event deactivated successfully";
    }
}