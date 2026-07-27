import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import api from "../../services/api";

type Event = {
  eventId: number;
  name: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricePerPerson?: number;  // ✅ Fixed field name to match backend
  category?: string;
};

const FAMILY_MULTIPLIER = 3; // ✅ Family bookings cost 3x the base price

function formatEventDate(dateValue?: string) {
  if (!dateValue) return "Date to be confirmed";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateTotal(event: Event | null, bookingType: "individual" | "family") {
  if (!event) return 0;
  const basePrice = Number(event.pricePerPerson) || 0;
  return bookingType === "family" ? basePrice * FAMILY_MULTIPLIER : basePrice;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bookingType, setBookingType] = useState<"individual" | "family">("individual");
  const [familyName, setFamilyName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data.data || []);
    } catch (error: any) {
      console.log("Events error:", error.response?.status, JSON.stringify(error.response?.data));
      Alert.alert("Could not load events", "Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (event: Event) => {
    setSelectedEvent(event);
    setBookingType("individual");
    setFamilyName("");
    setNotes("");
  };

  const closeBookingModal = () => {
    setSelectedEvent(null);
    setSubmitting(false);
  };

  const handleBookEvent = async () => {
    if (!selectedEvent) return;

    if (bookingType === "family" && !familyName.trim()) {
      Alert.alert("Missing Information", "Please enter your family name.");
      return;
    }

    setSubmitting(true);

    try {
      const totalAmount = calculateTotal(selectedEvent, bookingType);

      const payload = {
        bookingType: "EVENT",
        referenceId: selectedEvent.eventId,
        scheduledDate: selectedEvent.eventDate?.split("T")[0] || new Date().toISOString().split("T")[0],
        totalAmount: totalAmount,
        notes: bookingType === "family"
          ? `Family Booking - Family: ${familyName}\n${notes}`
          : `Individual Booking\n${notes}`,
      };

      const response = await api.post("/tourist/bookings/event", payload);

      Alert.alert(
        "Booking Created",
        response.data.message || "Your booking has been submitted successfully. Please proceed to payment.",
        [
          {
            text: "Go to Payments",
            onPress: () => {
              closeBookingModal();
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("Booking Error:", error.response?.data || error.message);
      Alert.alert(
        "Booking Failed",
        error.response?.data?.message || "Could not create booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Festivals</Text>
        <Text style={styles.headerSubtitle}>Discover local experiences</Text>
      </View>

      <View style={styles.list}>
        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No events available</Text>
            <Text style={styles.emptyText}>Please check again later.</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.eventId} style={styles.eventCard}>
              <View style={styles.eventTop}>
                <Text style={styles.eventCategory}>{event.category || "Event"}</Text>
                {/* ✅ Always show the actual price, no "Free" fallback */}
                <Text style={styles.priceTag}>
                  GHS {Number(event.pricePerPerson || 0).toFixed(2)}
                </Text>
              </View>

              <Text style={styles.eventTitle}>{event.name}</Text>

              <Text style={styles.eventMeta}>
                {formatEventDate(event.eventDate)}
                {event.location ? ` • ${event.location}` : ""}
              </Text>

              {!!event.description && (
                <Text style={styles.eventDescription} numberOfLines={3}>
                  {event.description}
                </Text>
              )}

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => openBookingModal(event)}
              >
                <Text style={styles.joinButtonText}>Book Event</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Booking Modal */}
      {selectedEvent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book: {selectedEvent.name}</Text>

            <Text style={styles.label}>Booking For</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, bookingType === "individual" && styles.activeToggle]}
                onPress={() => setBookingType("individual")}
              >
                <Text style={bookingType === "individual" ? styles.activeText : styles.inactiveText}>
                  Individual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, bookingType === "family" && styles.activeToggle]}
                onPress={() => setBookingType("family")}
              >
                <Text style={bookingType === "family" ? styles.activeText : styles.inactiveText}>
                  Family
                </Text>
              </TouchableOpacity>
            </View>

            {bookingType === "family" && (
              <>
                <Text style={styles.label}>Family Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. The Mensah Family"
                  value={familyName}
                  onChangeText={setFamilyName}
                />

                {/* ✅ Info text explaining the multiplier */}
                <Text style={styles.familyNote}>
                  Family bookings are charged at {FAMILY_MULTIPLIER}x the individual price.
                </Text>
              </>
            )}

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requests..."
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalPrice}>
                GHS {calculateTotal(selectedEvent, bookingType).toFixed(2)}
              </Text>
              {bookingType === "family" && (
                <Text style={styles.multiplierNote}>
                  (GHS {Number(selectedEvent.pricePerPerson || 0).toFixed(2)} × {FAMILY_MULTIPLIER})
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.bookButton} onPress={handleBookEvent} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bookButtonText}>Proceed to Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeBookingModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },

  list: { padding: 24 },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  eventTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  eventCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  priceTag: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },

  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  eventMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },

  eventDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 12,
  },

  joinButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#111827",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeText: { color: "#2563EB", fontWeight: "700" },
  inactiveText: { color: "#64748B" },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  familyNote: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: -8,
    marginBottom: 8,
  },

  totalBox: {
    backgroundColor: "#F0F9FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  totalLabel: { color: "#0369A1", fontSize: 14 },
  totalPrice: { fontSize: 26, fontWeight: "bold", color: "#1E40AF", marginVertical: 4 },
  multiplierNote: { fontSize: 12, color: "#64748B" },

  bookButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  bookButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: { color: "#DC2626", fontSize: 15, fontWeight: "600" },
});