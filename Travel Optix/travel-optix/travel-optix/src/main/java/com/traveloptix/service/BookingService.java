package com.traveloptix.service;

import com.traveloptix.dto.BookingDetail;
import com.traveloptix.dto.BookingRequest;
import com.traveloptix.model.Attraction;
import com.traveloptix.model.Booking;
import com.traveloptix.model.Event;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.TourGuide;
import com.traveloptix.model.Tourist;
import com.traveloptix.repository.AttractionRepository;
import com.traveloptix.repository.BookingRepository;
import com.traveloptix.repository.EventRepository;
import com.traveloptix.repository.HostFamilyRepository;
import com.traveloptix.repository.TourGuideRepository;
import com.traveloptix.repository.TouristRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private TourGuideRepository tourGuideRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private HostFamilyRepository hostFamilyRepository;

    @Autowired
    private NotificationService notificationService;

    private BigDecimal toBigDecimal(Number value) {
        return value == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(value.doubleValue());
    }

    private String statusForAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return "CONFIRMED";
        }

        return "PENDING";
    }

    // ==========================================
    // BOOK AN ATTRACTION
    // ==========================================
    @Transactional
    public Booking bookAttraction(
            Integer userId,
            BookingRequest request) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        Attraction attraction = attractionRepository
                .findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException(
                        "Attraction not found"));

        if (!Boolean.TRUE.equals(attraction.getIsActive())) {
            throw new RuntimeException("This attraction is not available");
        }

        BigDecimal amount = toBigDecimal(attraction.getEntryFee());

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("ATTRACTION");
        booking.setReferenceId(attraction.getAttractionId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus(statusForAmount(amount));
        booking.setTotalAmount(amount);
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.sendBookingConfirmation(
                tourist.getUser(),
                savedBooking,
                attraction.getName()
        );

        return savedBooking;
    }

    // ==========================================
    // BOOK A TOUR GUIDE
    // ==========================================
    @Transactional
    public Booking bookTourGuide(
            Integer userId,
            BookingRequest request) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        TourGuide guide = tourGuideRepository
                .findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException(
                        "Tour guide not found"));

        if (!"APPROVED".equalsIgnoreCase(guide.getVerificationStatus())) {
            throw new RuntimeException("This tour guide is not yet approved");
        }

        BigDecimal amount = toBigDecimal(guide.getHourlyRate());

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("TOUR_GUIDE");
        booking.setReferenceId(guide.getGuideId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus(statusForAmount(amount));
        booking.setTotalAmount(amount);
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.sendBookingConfirmation(
                tourist.getUser(),
                savedBooking,
                guide.getUser().getFullName()
        );

        return savedBooking;
    }

    // ==========================================
    // BOOK A CULTURAL EVENT
    // ==========================================
    @Transactional
    public Booking bookEvent(
            Integer userId,
            BookingRequest request) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        Event event = eventRepository
                .findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException(
                        "Event not found"));

        if (!Boolean.TRUE.equals(event.getIsActive())) {
            throw new RuntimeException("This event is not available");
        }

        BigDecimal pricePerPerson = event.getPricePerPerson() != null
                ? event.getPricePerPerson()
                : BigDecimal.ZERO;

        int people = request.getNumberOfPeople() != null &&
                request.getNumberOfPeople() > 0
                ? request.getNumberOfPeople()
                : 1;

        BigDecimal totalAmount = pricePerPerson.multiply(
                BigDecimal.valueOf(people)
        );

        String notes = request.getNotes() != null
                ? request.getNotes()
                : "";

        if (request.getFamilyName() != null &&
                !request.getFamilyName().isBlank()) {
            notes = "Family Booking - Family: " +
                    request.getFamilyName() +
                    ", People: " +
                    people +
                    "\n" +
                    notes;
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("EVENT");
        booking.setReferenceId(event.getEventId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus(statusForAmount(totalAmount));
        booking.setTotalAmount(totalAmount);
        booking.setNotes(notes.trim());

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.sendGuardianAlert(
                tourist.getTouristId(),
                savedBooking,
                event.getName()
        );

        return savedBooking;
    }

    // ==========================================
    // BOOK A HOST FAMILY
    // ==========================================
    @Transactional
    public Booking bookHostFamily(
            Integer userId,
            BookingRequest request) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        HostFamily family = hostFamilyRepository
                .findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException(
                        "Host family not found"));

        if (!"APPROVED".equalsIgnoreCase(family.getVerificationStatus())) {
            throw new RuntimeException(
                    "This host family is not yet approved");
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("HOST_FAMILY");
        booking.setReferenceId(family.getFamilyId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus("CONFIRMED");
        booking.setTotalAmount(null);
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);

        String familyName = family.getFamilyName();

        if ((familyName == null || familyName.isBlank()) &&
                family.getUser() != null) {
            familyName = family.getUser().getFullName();
        }

        notificationService.sendBookingConfirmation(
                tourist.getUser(),
                savedBooking,
                familyName
        );

        return savedBooking;
    }

    // ==========================================
    // BOOK TRANSPORT
    // ==========================================
    @Transactional
    public Booking bookTransport(
            Integer userId,
            String transportType,
            String route,
            String scheduledDate,
            String notes) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        BigDecimal price;

        switch (transportType != null
                ? transportType.toUpperCase()
                : "") {
            case "BUS":
                price = new BigDecimal("45.00");
                break;

            case "TRAIN":
                price = new BigDecimal("60.00");
                break;

            case "FLIGHT":
                price = new BigDecimal("280.00");
                break;

            default:
                price = BigDecimal.ZERO;
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("TRANSPORT");
        booking.setReferenceId(0);
        booking.setScheduledDate(LocalDate.parse(scheduledDate));
        booking.setStatus(statusForAmount(price));
        booking.setTotalAmount(price);
        booking.setNotes(
                "Transport: " +
                        transportType +
                        " | Route: " +
                        route +
                        " | " +
                        (notes != null ? notes : "")
        );

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.sendBookingConfirmation(
                tourist.getUser(),
                savedBooking,
                transportType + " — " + route
        );

        return savedBooking;
    }

    // ==========================================
    // GET MY BOOKINGS RAW
    // ==========================================
    public List<Booking> getMyBookings(Integer userId) {
        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        return bookingRepository.findByTourist_TouristId(
                tourist.getTouristId()
        );
    }

    // ==========================================
    // GET MY BOOKINGS DETAILED
    // ==========================================
    public List<BookingDetail> getMyBookingsDetailed(Integer userId) {
        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        List<Booking> bookings = bookingRepository
                .findByTourist_TouristIdOrderByBookingDateDesc(
                        tourist.getTouristId()
                );

        List<BookingDetail> result = new ArrayList<>();

        for (Booking booking : bookings) {
            BookingDetail detail = new BookingDetail();

            detail.setBookingId(booking.getBookingId());
            detail.setBookingType(booking.getBookingType());
            detail.setReferenceId(booking.getReferenceId());
            detail.setScheduledDate(booking.getScheduledDate());
            detail.setStatus(booking.getStatus());
            detail.setTotalAmount(booking.getTotalAmount());
            detail.setNotes(booking.getNotes());

            enrichBookingDetail(booking, detail);

            result.add(detail);
        }

        return result;
    }

    private void enrichBookingDetail(
            Booking booking,
            BookingDetail detail) {

        try {
            String type = booking.getBookingType() != null
                    ? booking.getBookingType().toUpperCase()
                    : "";

            switch (type) {
                case "ATTRACTION":
                    attractionRepository.findById(booking.getReferenceId())
                            .ifPresent(attraction -> {
                                detail.setReferenceName(attraction.getName());
                                detail.setReferenceLocation(attraction.getLocation());
                                detail.setReferenceRegion(attraction.getRegion());
                                detail.setReferenceImage(attraction.getPhotoUrl());
                            });
                    break;

                case "EVENT":
                    eventRepository.findById(booking.getReferenceId())
                            .ifPresent(event -> {
                                detail.setReferenceName(event.getName());
                                detail.setReferenceLocation(event.getLocation());
                                detail.setReferenceRegion(event.getRegion());
                                detail.setReferenceImage(event.getPhotoUrl());
                            });
                    break;

                case "TOUR_GUIDE":
                    tourGuideRepository.findById(booking.getReferenceId())
                            .ifPresent(guide -> {
                                if (guide.getUser() != null) {
                                    detail.setReferenceName(
                                            guide.getUser().getFullName()
                                    );
                                }
                            });
                    break;

                case "HOST_FAMILY":
                    hostFamilyRepository.findById(booking.getReferenceId())
                            .ifPresent(family -> {
                                String name = family.getFamilyName();

                                if ((name == null || name.isBlank()) &&
                                        family.getUser() != null) {
                                    name = family.getUser().getFullName();
                                }

                                detail.setReferenceName(name);
                            });
                    break;

                case "TRANSPORT":
                    if (booking.getNotes() != null &&
                            booking.getNotes().contains("Transport:")) {

                        String[] parts = booking.getNotes().split("\\|");

                        String transportType = parts[0]
                                .replace("Transport:", "")
                                .trim();

                        String route = parts.length > 1
                                ? parts[1]
                                .replace("Route:", "")
                                .trim()
                                : "";

                        detail.setReferenceName(
                                route.isEmpty()
                                        ? transportType
                                        : transportType + " — " + route
                        );
                    }
                    break;

                default:
                    detail.setReferenceName(
                            detail.getReferenceName() != null
                                    ? detail.getReferenceName()
                                    : "Booking"
                    );
            }

        } catch (Exception ignored) {
        }
    }

    // ==========================================
    // GET ONE BOOKING
    // ==========================================
    public Booking getBookingById(Integer bookingId) {
        return bookingRepository
                .findById(bookingId)
                .orElseThrow(() -> new RuntimeException(
                        "Booking not found"));
    }

    // ==========================================
    // CANCEL BOOKING
    // ==========================================
    @Transactional
    public Booking cancelBooking(
            Integer bookingId,
            Integer userId) {

        Tourist tourist = touristRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Tourist profile not found"));

        Booking booking = bookingRepository
                .findById(bookingId)
                .orElseThrow(() -> new RuntimeException(
                        "Booking not found"));

        if (!booking.getTourist().getTouristId()
                .equals(tourist.getTouristId())) {
            throw new RuntimeException(
                    "You are not allowed to cancel this booking");
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Booking already cancelled");
        }

        if ("COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Completed bookings cannot be cancelled");
        }

        booking.setStatus("CANCELLED");

        return bookingRepository.save(booking);
    }
}