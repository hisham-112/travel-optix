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

type Attraction = {
  attractionId: number;
  name: string;
  description?: string;
  location?: string;
  region?: string;
  category?: string;
  entryFee?: number;
  openingTime?: string;
  closingTime?: string;
  photoUrl?: string;
  isActive?: boolean;
};

const USD_TO_GHS = 15.50;

// ✅ Put YOUR actual image URLs here
const IMAGE_MAP: Record<string, string> = {
  "kwame nkrumah memorial park":
    "https://images.unsplash.com/photo-1565117531952-5fab2f560ac4?w=800&q=80",
  "kakum national park":
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
  "cape coast castle":
    "https://images.unsplash.com/photo-1582650949684-a0c1b7aa0798?w=800&q=80",
};

// Fallback if URL missing
function getImageUrl(name: string, dbUrl?: string): string {
  if (dbUrl && dbUrl.trim() !== "") return dbUrl;
  return (
    IMAGE_MAP[name.toLowerCase()] ||
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80"
  );
}

function formatMoney(amount?: number) {
  if (amount === undefined || amount === null || Number(amount) === 0) return "Free";
  return `GHS ${(Number(amount) * USD_TO_GHS).toFixed(2)}`;
}

function formatTime(time?: string) {
  if (!time) return "";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function AttractionsScreen() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  // Track which images failed so we never show white
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const fetchAttractions = useCallback(async () => {
    try {
      const response = await api.get("/attractions");
      setAttractions(response.data.data || []);
      // Reset failed images on refresh
      setFailedImages(new Set());
    } catch (error: any) {
      Alert.alert("Error", "Could not load attractions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttractions();
  };

  const confirmBooking = (attraction: Attraction) => {
    Alert.alert("Book Attraction", `Book "${attraction.name}" for today?\nEntry: ${formatMoney(attraction.entryFee)}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Book Now", onPress: () => bookAttraction(attraction) },
    ]);
  };

  const bookAttraction = async (attraction: Attraction) => {
    setBookingId(attraction.attractionId);
    try {
      await api.post("/tourist/bookings/attraction", {
        referenceId: attraction.attractionId,
        scheduledDate: getTodayDate(),
        notes: `Attraction booking: ${attraction.name}`,
      });
      Alert.alert("Success", "Attraction booked successfully.");
    } catch (error: any) {
      Alert.alert("Failed", error.response?.data?.message || "Booking failed.");
    } finally {
      setBookingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading attractions...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attractions</Text>
        <Text style={styles.headerSubtitle}>Discover amazing places to visit</Text>
      </View>

      <View style={styles.list}>
        {attractions.map((attraction) => {
          const isBooking = bookingId === attraction.attractionId;
          const imageFailed = failedImages.has(attraction.attractionId);
          const imageUrl = getImageUrl(attraction.name, attraction.photoUrl);

          return (
            <View key={attraction.attractionId} style={styles.card}>
              {/* ✅ IMAGE CONTAINER - Always has background, NEVER white */}
              <View style={styles.imageContainer}>
                {/* Dark gradient background always visible */}
                <View style={styles.imageGradient} />

                {/* Try to load image */}
                {!imageFailed && (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => {
                      console.log("Image failed for:", attraction.name);
                      setFailedImages((prev) => {
                        const next = new Set(prev);
                        next.add(attraction.attractionId);
                        return next;
                      });
                    }}
                  />
                )}

                {/* Region badge always visible */}
                {attraction.region ? (
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionBadgeText}>📍 {attraction.region}</Text>
                  </View>
                ) : null}

                {/* Name overlay - visible if image fails or is loading */}
                <View style={styles.imageOverlayText}>
                  <Text style={styles.imageOverlayTitle}>{attraction.name}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.topRow}>
                  <Text style={styles.category}>
                    {attraction.category || "Attraction"}
                  </Text>
                  <Text style={styles.fee}>{formatMoney(attraction.entryFee)}</Text>
                </View>

                <Text style={styles.name}>{attraction.name}</Text>
                <Text style={styles.location}>
                  {attraction.location || "Ghana"}
                </Text>

                {!!attraction.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {attraction.description}
                  </Text>
                )}

                {(attraction.openingTime || attraction.closingTime) && (
                  <Text style={styles.hours}>
                    🕐 {formatTime(attraction.openingTime) || "?"} - {formatTime(attraction.closingTime) || "?"}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
                  disabled={isBooking}
                  onPress={() => confirmBooking(attraction)}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.bookButtonText}>Book Attraction</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, fontSize: 14, color: "#6B7280" },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { marginTop: 4, color: "#6B7280", fontSize: 14 },

  list: { padding: 24 },

  card: {
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  // ✅ IMAGE AREA - Never white, always has gradient
  imageContainer: {
    height: 190,
    position: "relative",
  },

  // Dark gradient background that is ALWAYS there
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A", // Very dark navy
  },

  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  regionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },
  regionBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  // ✅ Text that shows clearly over image (or over gradient if image fails)
  imageOverlayText: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  imageOverlayTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  cardContent: {
    padding: 16,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  category: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  fee: {
    color: "#16A34A",
    backgroundColor: "#F0FDF4",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  name: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
  location: { color: "#6B7280", fontSize: 13, marginBottom: 8 },
  description: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  hours: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 14,
  },

  bookButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  bookButtonDisabled: { opacity: 0.7 },
  bookButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});