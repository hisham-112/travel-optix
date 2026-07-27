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
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../../types";
import api from "../../services/api";

type NavigationProp = BottomTabNavigationProp<MainTabParamList, "Bookings">;

type Booking = {
  bookingId: number;
  bookingType?: string;
  scheduledDate?: string;
  status?: string;
  totalAmount?: number | string | null;
  notes?: string;
};

const statusColors: Record<string, string> = {
  CONFIRMED: "#16A34A",
  PENDING: "#D97706",
  CANCELLED: "#DC2626",
  COMPLETED: "#2563EB",
};

function formatDate(dateValue?: string) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function formatType(type?: string) {
  if (!type) return "Booking";
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

// ✅ FIX: Handle BigDecimal from Spring Boot properly
function formatMoney(amount?: number | string | null) {
  if (amount == null || amount === "") return "—";
  const parsed = parseFloat(String(amount));
  if (isNaN(parsed)) return "—";
  return `GHS ${parsed.toFixed(2)}`;
}

export default function BookingScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const bRes = await api.get("/tourist/bookings");
      console.log("Bookings response:", JSON.stringify(bRes.data));
      setBookings(bRes.data?.data || []);
    } catch (error: any) {
      Alert.alert("Error", "Could not load bookings.");
      console.log("Fetch error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const canCancel = (booking: Booking) => {
    const status = (booking.status || "").toUpperCase();
    return status !== "CANCELLED" && status !== "COMPLETED";
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert("Cancel Booking", `Cancel this ${formatType(booking.bookingType)} booking?`, [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", style: "destructive", onPress: () => processCancel(booking.bookingId) },
    ]);
  };

  const processCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      const response = await api.patch(`/tourist/bookings/${bookingId}/cancel`);
      Alert.alert("Success", response.data?.message || "Booking cancelled.");
      await fetchBookings();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Could not cancel.";
      Alert.alert("Could not cancel", msg);
    } finally {
      setCancellingId(null);
    }
  };

  // ✅ Navigate to Payments screen
  const handlePay = (booking: Booking) => {
    // @ts-ignore
    navigation.navigate("Payments", { selectedBooking: booking });
  };

  const filteredBookings = bookings.filter(
    (b) => activeFilter === "ALL" || (b.status || "").toUpperCase() === activeFilter
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>{bookings.length} booking{bookings.length === 1 ? "" : "s"}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((f) => (
          <TouchableOpacity key={f} style={[styles.filterButton, activeFilter === f && styles.activeFilterButton]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>{activeFilter === "ALL" ? "You haven't made any bookings yet." : `No ${activeFilter.toLowerCase()} bookings.`}</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const status = (booking.status || "PENDING").toUpperCase();
            const showCancel = canCancel(booking);
            const isPending = status === "PENDING";
            const isCancelling = cancellingId === booking.bookingId;

            return (
              <View key={booking.bookingId} style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <Text style={styles.bookingTitle}>{formatType(booking.bookingType)} Booking</Text>
                  <Text style={[styles.status, { color: statusColors[status] || "#6B7280" }]}>{status}</Text>
                </View>

                <Text style={styles.date}>Scheduled: {formatDate(booking.scheduledDate)}</Text>
                <Text style={styles.amount}>{formatMoney(booking.totalAmount)}</Text>

                {booking.notes ? <Text style={styles.notes} numberOfLines={2}>{booking.notes}</Text> : null}

                <View style={styles.buttonRow}>
                  {isPending && booking.totalAmount && Number(booking.totalAmount) > 0 && (
                    <TouchableOpacity style={[styles.payButton]} onPress={() => handlePay(booking)}>
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}

                  {showCancel && (
                    <TouchableOpacity style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]} disabled={isCancelling} onPress={() => handleCancel(booking)}>
                      {isCancelling ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.cancelButtonText}>Cancel Booking</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#FFFFFF" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  filters: { paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#E5E7EB" },
  activeFilterButton: { backgroundColor: "#2563EB" },
  filterText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  list: { padding: 16 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  bookingCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  bookingTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  status: { fontSize: 13, fontWeight: "700" },
  date: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  amount: { fontSize: 16, fontWeight: "700", color: "#2563EB", marginBottom: 4 },
  notes: { fontSize: 12, color: "#9CA3AF", marginBottom: 8 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  payButton: { flex: 1, backgroundColor: "#16A34A", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  payButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  cancelButton: { flex: 1, backgroundColor: "#DC2626", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  cancelButtonDisabled: { opacity: 0.6 },
  cancelButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});