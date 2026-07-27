package com.traveloptix.service;

import com.traveloptix.dto.BookingRequest;
import com.traveloptix.model.Attraction;
import com.traveloptix.model.Booking;
import com.traveloptix.model.Event;
import com.traveloptix.model.HostFamily;
import com.traveloptix.model.Tourist;
import com.traveloptix.model.TourGuide;
import com.traveloptix.repository.AttractionRepository;
import com.traveloptix.repository.BookingRepository;
import com.traveloptix.repository.EventRepository;
import com.traveloptix.repository.HostFamilyRepository;
import com.traveloptix.repository.TouristRepository;
import com.traveloptix.repository.TourGuideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    // ✅ BOOK AN ATTRACTION
    @Transactional
    public Booking bookAttraction(Integer userId, BookingRequest request) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        Attraction attraction = attractionRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException("Attraction not found"));

        if (!attraction.getIsActive()) {
            throw new RuntimeException("This attraction is not available");
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("ATTRACTION");
        booking.setReferenceId(attraction.getAttractionId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus("CONFIRMED");
        booking.setTotalAmount(attraction.getEntryFee());
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.sendBookingConfirmation(
                tourist.getUser(), savedBooking, attraction.getName());
        return savedBooking;
    }

    // ✅ BOOK A TOUR GUIDE
    @Transactional
    public Booking bookTourGuide(Integer userId, BookingRequest request) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        TourGuide guide = tourGuideRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException("Tour guide not found"));

        if (!"APPROVED".equals(guide.getVerificationStatus())) {
            throw new RuntimeException("This tour guide is not yet approved");
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("TOUR_GUIDE");
        booking.setReferenceId(guide.getGuideId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus("CONFIRMED");
        booking.setTotalAmount(guide.getHourlyRate());
        booking.setNotes(request.getNotes());

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.sendBookingConfirmation(
                tourist.getUser(), savedBooking, guide.getUser().getFullName());
        return savedBooking;
    }

    // ✅ BOOK A CULTURAL EVENT
    @Transactional
    public Booking bookEvent(Integer userId, BookingRequest request) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        Event event = eventRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getIsActive()) {
            throw new RuntimeException("This event is not available");
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("EVENT");
        booking.setReferenceId(event.getEventId());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus("PENDING");
        booking.setTotalAmount(event.getPricePerPerson());

        // ✅ Handle family/group booking calculation
        int people = (request.getNumberOfPeople() != null && request.getNumberOfPeople() > 0)
                ? request.getNumberOfPeople() : 1;

        if (people > 1) {
            booking.setTotalAmount(event.getPricePerPerson().multiply(
                    new BigDecimal(people)));
        }

        String notes = request.getNotes() != null ? request.getNotes() : "";
        if ("family".equalsIgnoreCase(request.getFamilyName()) || request.getFamilyName() != null) {
            notes = "Family Booking - Family: " + request.getFamilyName() +
                    ", People: " + people + "\n" + notes;
        }
        booking.setNotes(notes.trim());

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.sendGuardianAlert(
                tourist.getTouristId(), savedBooking, event.getName());
        return savedBooking;
    }

    // ✅ BOOK A HOST FAMILY
    @Transactional
    public Booking bookHostFamily(Integer userId, BookingRequest request) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        HostFamily family = hostFamilyRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new RuntimeException("Host family not found"));

        if (!"APPROVED".equals(family.getVerificationStatus())) {
            throw new RuntimeException("This host family is not yet approved");
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
        if (familyName == null || familyName.isBlank()) {
            familyName = family.getUser().getFullName();
        }

        notificationService.sendBookingConfirmation(
                tourist.getUser(), savedBooking, familyName);
        return savedBooking;
    }

    // ✅ BOOK TRANSPORT (NEW)
    @Transactional
    public Booking bookTransport(
            Integer userId,
            String transportType,
            String route,
            String scheduledDate,
            String notes) {

        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        BigDecimal price;
        switch (transportType != null ? transportType.toUpperCase() : "") {
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
                price = new BigDecimal("0.00");
        }

        Booking booking = new Booking();
        booking.setTourist(tourist);
        booking.setBookingType("TRANSPORT");
        booking.setReferenceId(0); // No external reference needed
        booking.setScheduledDate(LocalDate.parse(scheduledDate));
        booking.setStatus("CONFIRMED");
        booking.setTotalAmount(price);
        booking.setNotes("Transport: " + transportType +
                " | Route: " + route +
                " | " +
                (notes != null ? notes : ""));

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.sendBookingConfirmation(
                tourist.getUser(),
                savedBooking,
                transportType + " — " + route);

        return savedBooking;
    }

    // ✅ GET MY BOOKINGS
    public List<Booking> getMyBookings(Integer userId) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));
        return bookingRepository.findByTourist_TouristId(tourist.getTouristId());
    }

    // ✅ GET ONE BOOKING
    public Booking getBookingById(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // ✅ CANCEL A BOOKING
    @Transactional
    public Booking cancelBooking(Integer bookingId, Integer userId) {
        Tourist tourist = touristRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getTourist().getTouristId().equals(tourist.getTouristId())) {
            throw new RuntimeException("You are not allowed to cancel this booking");
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Booking already cancelled");
        }

        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }
}