import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../../types";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";

type NavigationProp = BottomTabNavigationProp<MainTabParamList, "Home">;

type Booking = {
  bookingId: number;
  bookingType?: string;
  scheduledDate?: string;
  bookingDate?: string;
  status?: string;
  notes?: string;
};

const quickActions = [
  {
    id: "1",
    label: "Attractions",
    image:
      "https://images.unsplash.com/photo-1742476126735-cba186771cf2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2hhbmFpYW4lMjBhdHRyYWN0aW9uc3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "2",
    label: "Transport",
    image:
      "https://images.unsplash.com/photo-1783013959449-43a6c958b4ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGdoYW5haWFuJTIwdHJhbnNwb3J0fGVufDB8fDB8fHww",
  },
  {
    id: "3",
    label: "Events",
    image:
      "https://images.unsplash.com/photo-1660675134062-7d3bbb340608?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2hhbmFpYW4lMjBldmVudHN8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "4",
    label: "Guides",
    image:
      "https://images.unsplash.com/photo-1588390801685-1432b35a975b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8dG91ciUyMGd1aWRlfGVufDB8fDB8fHww",
  },
];

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function formatBookingType(type?: string) {
  if (!type) {
    return "Booking";
  }

  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateValue?: string) {
  if (!dateValue) {
    return "Date not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusColor(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED":
      return "#16A34A";
    case "PENDING":
      return "#D97706";
    case "CANCELLED":
      return "#DC2626";
    case "COMPLETED":
      return "#2563EB";
    default:
      return "#6B7280";
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fullName = user?.name || "Traveler";

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get("/tourist/bookings");
      setBookings(response.data.data || []);
    } catch (error: any) {
      console.log(
        "Home bookings error:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );
    } finally {
      setLoadingBookings(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleQuickAction = (label: string) => {
    if (label === "Events") {
      navigation.navigate("Events");
      return;
    }

    if (label === "Attractions") {
      navigation.navigate("Attractions");
      return;
    }

    if (label === "Guides") {
      navigation.navigate("Guides");
      return;
    }

    if (label === "Transport") {
      navigation.navigate("Transport");
      return;
    }
  };

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
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{fullName}</Text>
        </View>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.passCard}
        onPress={() => navigation.navigate("TravelPass")}
      >
        <Text style={styles.passLabel}>My Travel Pass</Text>
        <Text style={styles.passId}>{user?.email || "Traveler Account"}</Text>
        <Text style={styles.passStatus}>● Active</Text>
        <Text style={styles.passHint}>Tap to view your pass</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleQuickAction(action.label)}
          >
            <Image
              source={{ uri: action.image }}
              style={styles.actionImage}
              resizeMode="cover"
            />

            <View style={styles.actionOverlay}>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bookingsHeading}>
        <Text style={styles.sectionTitleNoPadding}>Recent Bookings</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Bookings")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {loadingBookings ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={styles.loadingIndicator}
        />
      ) : bookings.length === 0 ? (
        <TouchableOpacity
          style={styles.bookingCard}
          onPress={() => navigation.navigate("Events")}
        >
          <Text style={styles.bookingTitle}>No bookings yet</Text>
          <Text style={styles.bookingDate}>
            Explore local events to make your first booking.
          </Text>
          <Text style={styles.exploreText}>Explore Events</Text>
        </TouchableOpacity>
      ) : (
        bookings.slice(0, 3).map((booking) => (
          <TouchableOpacity
            key={booking.bookingId}
            style={styles.bookingCard}
            onPress={() => navigation.navigate("Bookings")}
          >
            <View style={styles.bookingTop}>
              <Text style={styles.bookingTitle}>
                {formatBookingType(booking.bookingType)} Booking
              </Text>

              <Text
                style={[
                  styles.bookingStatus,
                  { color: getStatusColor(booking.status) },
                ]}
              >
                {booking.status || "PENDING"}
              </Text>
            </View>

            <Text style={styles.bookingDate}>
              Scheduled:{" "}
              {formatDate(booking.scheduledDate || booking.bookingDate)}
            </Text>

            {!!booking.notes && (
              <Text style={styles.bookingNotes} numberOfLines={1}>
                {booking.notes}
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
  },
  greeting: { fontSize: 14, color: "#6B7280" },
  name: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  avatar: {
    backgroundColor: "#2563EB",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  passCard: {
    margin: 24,
    marginBottom: 20,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 24,
  },
  passLabel: { color: "#DBEAFE", fontSize: 14, marginBottom: 8 },
  passId: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  passStatus: { color: "#4ADE80", fontSize: 14, fontWeight: "600" },
  passHint: { color: "#DBEAFE", fontSize: 12, marginTop: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitleNoPadding: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 12,
    width: "45%",
    margin: "2.5%",
    height: 120,
    overflow: "hidden",
  },
  actionImage: { width: "100%", height: "100%" },
  actionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionLabel: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  bookingsHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  viewAll: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
  loadingIndicator: { marginTop: 20 },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  bookingDate: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  bookingStatus: { fontSize: 12, fontWeight: "700" },
  bookingNotes: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  exploreText: { color: "#2563EB", fontWeight: "600", fontSize: 13, marginTop: 10 },
  bottomSpace: { height: 24 },
});