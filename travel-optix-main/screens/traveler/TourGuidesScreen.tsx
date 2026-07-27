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
import api from "../../services/api";

type Guide = {
  guideId: number;
  languages?: string;
  expertiseAreas?: string;
  yearsExperience?: number;
  bio?: string;
  hourlyRate?: number;
  verificationStatus?: string;
  user?: {
    fullName?: string;
    email?: string;
  };
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatMoney(amount?: number) {
  if (amount === undefined || amount === null || Number(amount) === 0) {
    return "Rate not available";
  }

  return `$${Number(amount).toFixed(2)} / hour`;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TG"
  );
}

export default function TourGuidesScreen() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingGuideId, setBookingGuideId] = useState<number | null>(null);

  const fetchGuides = useCallback(async () => {
    try {
      const response = await api.get("/guides");
      setGuides(response.data.data || []);
    } catch (error: any) {
      console.log(
        "Guides error:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );

      Alert.alert(
        "Could not load guides",
        error.response?.data?.message ||
          "Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const confirmBooking = (guide: Guide) => {
    const name = guide.user?.fullName || "this guide";

    Alert.alert(
      "Book Tour Guide",
      `Book ${name} for today (${getTodayDate()})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Book Guide",
          onPress: () => bookGuide(guide),
        },
      ]
    );
  };

  const bookGuide = async (guide: Guide) => {
    setBookingGuideId(guide.guideId);

    try {
      const response = await api.post("/tourist/bookings/guide", {
        referenceId: guide.guideId,
        scheduledDate: getTodayDate(),
        notes: `Tour guide booking: ${guide.user?.fullName || "Guide"}`,
      });

      Alert.alert(
        "Booking Submitted",
        response.data.message || "Tour guide booked successfully."
      );
    } catch (error: any) {
      console.log(
        "Guide booking error:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );

      Alert.alert(
        "Booking Failed",
        error.response?.data?.message ||
          "Could not book this guide. Please try again."
      );
    } finally {
      setBookingGuideId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading tour guides...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchGuides();
          }}
          tintColor="#2563EB"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tour Guides</Text>
        <Text style={styles.headerSubtitle}>
          Explore with verified local experts
        </Text>
      </View>

      <View style={styles.list}>
        {guides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No guides available</Text>
            <Text style={styles.emptyText}>
              Approved tour guides will appear here.
            </Text>
          </View>
        ) : (
          guides.map((guide) => {
            const fullName = guide.user?.fullName || "Travel Optix Guide";
            const isBooking = bookingGuideId === guide.guideId;

            return (
              <View key={guide.guideId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                  </View>

                  <View style={styles.nameArea}>
                    <Text style={styles.name}>{fullName}</Text>
                    <Text style={styles.verified}>● Verified Guide</Text>
                  </View>

                  <Text style={styles.rate}>{formatMoney(guide.hourlyRate)}</Text>
                </View>

                {!!guide.expertiseAreas && (
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Expertise: </Text>
                    {guide.expertiseAreas}
                  </Text>
                )}

                {!!guide.languages && (
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Languages: </Text>
                    {guide.languages}
                  </Text>
                )}

                {guide.yearsExperience !== undefined && (
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Experience: </Text>
                    {guide.yearsExperience} year(s)
                  </Text>
                )}

                {!!guide.bio && (
                  <Text style={styles.bio} numberOfLines={3}>
                    {guide.bio}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, isBooking && styles.buttonDisabled]}
                  disabled={isBooking}
                  onPress={() => confirmBooking(guide)}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Book Guide</Text>
                  )}
                </TouchableOpacity>
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
  loadingText: { marginTop: 10, color: "#6B7280" },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#FFFFFF" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },
  list: { padding: 24 },
  emptyCard: { backgroundColor: "#FFFFFF", padding: 24, borderRadius: 12, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptyText: { color: "#6B7280", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  nameArea: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  verified: { color: "#16A34A", fontSize: 12, marginTop: 3 },
  rate: { color: "#2563EB", fontSize: 12, fontWeight: "700", maxWidth: 95, textAlign: "right" },
  detail: { color: "#6B7280", fontSize: 13, marginBottom: 5 },
  detailLabel: { color: "#374151", fontWeight: "600" },
  bio: { color: "#6B7280", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 14 },
  button: { backgroundColor: "#2563EB", borderRadius: 8, minHeight: 44, justifyContent: "center", alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});