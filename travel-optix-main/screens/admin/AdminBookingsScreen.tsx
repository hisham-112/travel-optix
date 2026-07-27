import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import api from "../../services/api";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminBookings"
>;

type Booking = {
  bookingId: number;
  bookingType?: string;
  referenceId?: number;
  scheduledDate?: string;
  bookingDate?: string;
  status?: string;
  totalAmount?: number;
  notes?: string;
  tourist?: {
    user?: {
      fullName?: string;
      email?: string;
    };
  };
};

function formatBookingType(type?: string) {
  if (!type) return "Booking";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value?: number) {
  if (value === null || value === undefined) return "—";
  return `GHS ${Number(value).toFixed(2)}`;
}

function getStatusColor(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED": return "#16A34A";
    case "PENDING": return "#D97706";
    case "CANCELLED": return "#DC2626";
    case "COMPLETED": return "#2563EB";
    default: return "#6B7280";
  }
}

export default function AdminBookingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get("/admin/bookings");
      const data = response.data.data || [];
      setBookings(data);
      setFilteredBookings(data);
    } catch (error: any) {
      console.log("Admin bookings error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load bookings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (activeFilter === "ALL") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter(
          (b) => (b.status || "").toUpperCase() === activeFilter
        )
      );
    }
  }, [activeFilter, bookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading all bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#2563EB"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>All Bookings</Text>
          <Text style={styles.headerSubtitle}>
            Platform-wide booking management
          </Text>
        </View>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              No {activeFilter.toLowerCase()} bookings available.
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const status = (booking.status || "PENDING").toUpperCase();
            const touristName = booking.tourist?.user?.fullName || "Unknown";
            const touristEmail = booking.tourist?.user?.email || "No email";

            return (
              <View key={booking.bookingId} style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {formatBookingType(booking.bookingType)}
                    </Text>
                  </View>
                  <Text style={[styles.status, { color: getStatusColor(status) }]}>
                    {status}
                  </Text>
                </View>

                <Text style={styles.bookingTitle}>
                  Booking #{booking.bookingId}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tourist</Text>
                  <Text style={styles.value}>{touristName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{touristEmail}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Scheduled</Text>
                  <Text style={styles.value}>
                    {formatDate(booking.scheduledDate)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Amount</Text>
                  <Text style={styles.value}>{formatMoney(booking.totalAmount)}</Text>
                </View>

                {!!booking.notes && (
                  <Text style={styles.notes}>{booking.notes}</Text>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#1E3A5F",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2D4E6F",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: { color: "#FFF", fontSize: 28, lineHeight: 28 },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold" },
  headerSubtitle: { color: "#94A3B8", fontSize: 13 },

  filters: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  activeFilterButton: { backgroundColor: "#2563EB" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  activeFilterText: { color: "#FFFFFF" },

  list: { padding: 16 },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6 },

  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  bookingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  typeBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: { color: "#2563EB", fontSize: 12, fontWeight: "700" },

  status: { fontSize: 13, fontWeight: "700" },

  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, color: "#6B7280" },
  value: { fontSize: 13, color: "#111827", fontWeight: "600" },

  notes: {
    marginTop: 10,
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },

  bottomSpace: { height: 40 },
});