import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

type TransportMode = "BUS" | "FLIGHT" | "TRAIN";

type TransportOption = {
  id: string;
  mode: TransportMode;
  label: string;
  icon: string; // emoji/icon identifier
  priceNote: string;
  destinations: string[];
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: "bus",
    mode: "BUS",
    label: "Bus Travel",
    icon: "🚌",
    priceNote: "From GHS 45.00",
    destinations: ["Accra → Kumasi", "Accra → Tamale", "Kumasi → Takoradi"],
  },
  {
    id: "flight",
    mode: "FLIGHT",
    label: "Domestic Flight",
    icon: "✈️",
    priceNote: "From GHS 280.00",
    destinations: ["Accra → Tamale", "Kumasi → Takoradi"],
  },
  {
    id: "train",
    mode: "TRAIN",
    label: "Rail Journey",
    icon: "🚆",
    priceNote: "From GHS 60.00",
    destinations: ["Accra → Kumasi", "Tema → Kumasi"],
  },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function TransportScreen() {
  const [selectedMode, setSelectedMode] = useState<TransportOption | null>(null);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const openBooking = (option: TransportOption) => {
    setSelectedMode(option);
    setSelectedRoute(option.destinations[0]);
    setNotes("");
    setShowBooking(true);
  };

  const closeBooking = () => {
    setShowBooking(false);
    setSelectedMode(null);
  };

  const handleBook = async () => {
    if (!selectedMode || !selectedRoute) {
      Alert.alert("Select a route", "Please choose a destination.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/tourist/bookings/transport", {
        transportType: selectedMode.mode,
        route: selectedRoute,
        scheduledDate: getTodayDate(),
        notes: `Transport booking: ${selectedMode.label} — ${selectedRoute}`,
      });

      Alert.alert(
        "Transport Booked",
        response.data.message || "Your transport booking is confirmed.",
        [
          {
            text: "Done",
            onPress: () => {
              closeBooking();
              setNotes("");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("Transport booking error:", error.response?.data || error.message);
      Alert.alert(
        "Booking Failed",
        error.response?.data?.message || "Could not book transport. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transport</Text>
        <Text style={styles.headerSubtitle}>Bus • Flight • Train bookings</Text>
      </View>

      <View style={styles.list}>
        {TRANSPORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.transportCard}
            onPress={() => openBooking(option)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.icon}>{option.icon}</Text>
              <Text style={styles.priceNote}>{option.priceNote}</Text>
            </View>

            <Text style={styles.modeLabel}>{option.label}</Text>
            <Text style={styles.modeDesc}>Domestic routes available</Text>

            <View style={styles.routesPreview}>
              {option.destinations.slice(0, 2).map((route, i) => (
                <Text key={i} style={styles.routeTag}>
                  {route}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => openBooking(option)}
            >
              <Text style={styles.selectButtonText}>Book {option.mode}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Booking Modal */}
      {showBooking && selectedMode && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedMode.icon} Book {selectedMode.label}
            </Text>

            <Text style={styles.label}>Select Route</Text>
            <View style={styles.routesList}>
              {selectedMode.destinations.map((route) => (
                <TouchableOpacity
                  key={route}
                  style={[
                    styles.routeOption,
                    selectedRoute === route && styles.selectedRoute,
                  ]}
                  onPress={() => setSelectedRoute(route)}
                >
                  <Text
                    style={[
                      styles.routeText,
                      selectedRoute === route && styles.selectedRouteText,
                    ]}
                  >
                    {route}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes (Optional)</Text>
            <Text style={styles.noteHint}>Special requests or luggage info</Text>

            <Text style={styles.priceInfo}>
              Estimated: {selectedMode.priceNote} • {getTodayDate()}
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
              disabled={submitting}
              onPress={handleBook}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeBooking}>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },

  list: { padding: 24 },

  transportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  icon: { fontSize: 28 },
  priceNote: { color: "#16A34A", fontWeight: "700", fontSize: 14 },

  modeLabel: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  modeDesc: { fontSize: 13, color: "#6B7280", marginBottom: 12 },

  routesPreview: { flexDirection: "row", gap: 8, marginBottom: 16 },
  routeTag: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  selectButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  selectButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 16 },

  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  noteHint: { fontSize: 12, color: "#9CA3AF", marginBottom: 12 },

  routesList: { gap: 8, marginBottom: 16 },
  routeOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedRoute: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  routeText: { fontSize: 14, color: "#374151" },
  selectedRouteText: { color: "#2563EB", fontWeight: "600" },

  priceInfo: {
    textAlign: "center",
    color: "#1E3A5F",
    fontWeight: "600",
    marginBottom: 16,
  },

  confirmButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: { color: "#DC2626", fontWeight: "600" },
});