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
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  photoUrls?: string;
  isActive?: boolean;
  isLocalOnly?: boolean;
};

const USD_TO_GHS = 15.5;

const API_BASE_URL = String(api.defaults?.baseURL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const LOCAL_GHANA_ATTRACTIONS: Attraction[] = [
  {
    attractionId: -1,
    name: "Cape Coast Castle",
    description:
      "A historic UNESCO World Heritage Site and one of Ghana’s most important cultural landmarks.",
    location: "Cape Coast",
    region: "Central Region",
    category: "Historical Site",
    entryFee: 4,
    openingTime: "09:00",
    closingTime: "17:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -2,
    name: "Kwame Nkrumah Memorial Park",
    description:
      "A memorial park and museum dedicated to Ghana’s first President, Osagyefo Dr. Kwame Nkrumah.",
    location: "Accra",
    region: "Greater Accra",
    category: "Museum",
    entryFee: 3,
    openingTime: "09:00",
    closingTime: "17:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -3,
    name: "Elmina Castle",
    description:
      "One of the oldest European buildings in sub-Saharan Africa, rich with Ghanaian history.",
    location: "Elmina",
    region: "Central Region",
    category: "Historical Site",
    entryFee: 4,
    openingTime: "09:00",
    closingTime: "17:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -4,
    name: "Mole National Park",
    description:
      "Ghana’s largest wildlife park, popular for elephants, antelopes, birds, and safari experiences.",
    location: "Damongo",
    region: "Savannah Region",
    category: "National Park",
    entryFee: 5,
    openingTime: "06:00",
    closingTime: "18:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -5,
    name: "Wli Waterfalls",
    description:
      "One of West Africa’s highest waterfalls, surrounded by mountains and forest trails.",
    location: "Wli",
    region: "Volta Region",
    category: "Nature",
    entryFee: 3,
    openingTime: "08:00",
    closingTime: "17:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -6,
    name: "Lake Bosomtwe",
    description:
      "A natural lake located in a meteorite impact crater and a peaceful destination for relaxation.",
    location: "Kuntanase",
    region: "Ashanti Region",
    category: "Lake",
    entryFee: 2,
    openingTime: "08:00",
    closingTime: "18:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -7,
    name: "Aburi Botanical Gardens",
    description:
      "A beautiful botanical garden with scenic walkways, plants, trees, and peaceful nature views.",
    location: "Aburi",
    region: "Eastern Region",
    category: "Garden",
    entryFee: 2,
    openingTime: "08:00",
    closingTime: "17:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -8,
    name: "Shai Hills Resource Reserve",
    description:
      "A wildlife and nature reserve near Accra, known for baboons, caves, hiking, and rocky hills.",
    location: "Shai Osudoku",
    region: "Greater Accra",
    category: "Nature Reserve",
    entryFee: 3,
    openingTime: "06:00",
    closingTime: "18:00",
    isActive: true,
    isLocalOnly: true,
  },
  {
    attractionId: -9,
    name: "Labadi Beach",
    description:
      "One of Accra’s most popular beaches, known for entertainment, food, horse rides, and nightlife.",
    location: "Labadi",
    region: "Greater Accra",
    category: "Beach",
    entryFee: 2,
    openingTime: "08:00",
    closingTime: "22:00",
    isActive: true,
    isLocalOnly: true,
  },
];

const WIKIMEDIA_SEARCH_TERMS: Record<string, string> = {
  "kakum national park": "Kakum National Park Ghana",
  "cape coast castle": "Cape Coast Castle Ghana",
  "kwame nkrumah memorial park": "Kwame Nkrumah Mausoleum Accra Ghana",
  "elmina castle": "Elmina Castle Ghana",
  "mole national park": "Mole National Park Ghana",
  "wli waterfalls": "Wli Waterfalls Ghana",
  "lake bosomtwe": "Lake Bosumtwi Ghana",
  "aburi botanical gardens": "Aburi Botanical Gardens Ghana",
  "shai hills resource reserve": "Shai Hills Resource Reserve Ghana",
  "labadi beach": "Labadi Beach Ghana",
};

function normalizeImageUrl(dbUrl?: string): string {
  if (!dbUrl || dbUrl.trim() === "") return "";

  const trimmed = dbUrl.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (!API_BASE_URL) return "";

  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return `${API_BASE_URL}/${trimmed}`;
}

function parseBackendPhotoUrls(photoUrls?: string): string[] {
  if (!photoUrls || photoUrls.trim() === "") return [];

  return photoUrls
    .split(",")
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean);
}

async function fetchWikimediaImages(attractionName: string): Promise<string[]> {
  try {
    const key = attractionName.toLowerCase().trim();
    const searchTerm =
      WIKIMEDIA_SEARCH_TERMS[key] || `${attractionName} Ghana tourist site`;

    const url =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query` +
      `&generator=search` +
      `&gsrnamespace=6` +
      `&gsrsearch=${encodeURIComponent(searchTerm)}` +
      `&gsrlimit=8` +
      `&prop=imageinfo` +
      `&iiprop=url` +
      `&iiurlwidth=1000` +
      `&format=json` +
      `&origin=*`;

    const response = await fetch(url, {
  headers: { "User-Agent": "TravelOptixApp/1.0 (contact: kwamekarikari2006@gmail.com)" },
});
if (!response.ok) return [];
const data = await response.json();

    const pages = data?.query?.pages;

    if (!pages) return [];

    const images = Object.values(pages)
      .map((page: any) => {
        const imageInfo = page?.imageinfo?.[0];
        return imageInfo?.thumburl || imageInfo?.url;
      })
      .filter(Boolean)
      .filter((imageUrl: string) => {
        const lower = imageUrl.toLowerCase();

        return (
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.includes(".jpg?") ||
          lower.includes(".jpeg?") ||
          lower.includes(".png?")
        );
      });

    return images.slice(0, 5);
  } catch (error) {
    console.log("Wikimedia image fetch failed:", attractionName, error);
    return [];
  }
}

function getImageSlides(
  attraction: Attraction,
  wikimediaImages: Record<string, string[]>
): string[] {
  const key = attraction.name.toLowerCase().trim();

  const backendMainImage = normalizeImageUrl(attraction.photoUrl);
  const backendExtraImages = parseBackendPhotoUrls(attraction.photoUrls);
  const wikiImages = wikimediaImages[key] || [];

  const combined = [
    backendMainImage,
    ...backendExtraImages,
    ...wikiImages,
  ].filter(Boolean);

  // Remove duplicates
  return Array.from(new Set(combined));
}

function formatMoney(amount?: number) {
  if (amount === undefined || amount === null || Number(amount) === 0) {
    return "Free";
  }

  return `GHS ${(Number(amount) * USD_TO_GHS).toFixed(2)}`;
}

function formatTime(time?: string) {
  if (!time) return "";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function mergeBackendAndLocalAttractions(backendAttractions: Attraction[]) {
  const backendNames = new Set(
    backendAttractions.map((item) => item.name.toLowerCase().trim())
  );

  const localOnly = LOCAL_GHANA_ATTRACTIONS.filter(
    (item) => !backendNames.has(item.name.toLowerCase().trim())
  );

  return [...backendAttractions, ...localOnly];
}

export default function AttractionsScreen() {
  const { width } = useWindowDimensions();
  const slideWidth = width - 48;

  const [backendAttractions, setBackendAttractions] = useState<Attraction[]>([]);
  const [wikimediaImages, setWikimediaImages] = useState<Record<string, string[]>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlides, setActiveSlides] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const fetchAttractions = useCallback(async () => {
    try {
      const response = await api.get("/attractions");
      setBackendAttractions(response.data.data || []);
    } catch (error: any) {
      console.log("Attractions error:", error.response?.data || error.message);
      Alert.alert("Error", "Could not load attractions from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const allAttractions = useMemo(
    () => mergeBackendAndLocalAttractions(backendAttractions),
    [backendAttractions]
  );

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      setImagesLoading(true);

      const newImages: Record<string, string[]> = {};

      for (const attraction of allAttractions) {
        const key = attraction.name.toLowerCase().trim();

        if (wikimediaImages[key]) continue;

        const images = await fetchWikimediaImages(attraction.name);

        if (images.length > 0) {
          newImages[key] = images;
        }
      }

      if (!cancelled && Object.keys(newImages).length > 0) {
        setWikimediaImages((prev) => ({
          ...prev,
          ...newImages,
        }));
      }

      if (!cancelled) {
        setImagesLoading(false);
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
    // intentionally not adding wikimediaImages to avoid repeating forever
  }, [allAttractions]);

  const handleRefresh = () => {
    setRefreshing(true);
    setWikimediaImages({});
    fetchAttractions();
  };

  const confirmBooking = (attraction: Attraction) => {
    if (attraction.isLocalOnly) {
      Alert.alert(
        "Coming Soon",
        `${attraction.name} has been added for browsing, but it needs to be added to the backend database before users can book it.`
      );
      return;
    }

    Alert.alert(
      "Book Attraction",
      `Book "${attraction.name}" for today?\nEntry: ${formatMoney(
        attraction.entryFee
      )}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Now", onPress: () => bookAttraction(attraction) },
      ]
    );
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
      Alert.alert(
        "Failed",
        error.response?.data?.message || "Booking failed."
      );
    } finally {
      setBookingId(null);
    }
  };

  const handleSlideScroll = (
    attractionId: number,
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const cardWidth = event.nativeEvent.layoutMeasurement.width;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / cardWidth);

    setActiveSlides((prev) => ({
      ...prev,
      [attractionId]: index,
    }));
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredAttractions = allAttractions.filter((attraction) => {
    const searchableText = [
      attraction.name,
      attraction.description,
      attraction.location,
      attraction.region,
      attraction.category,
      formatMoney(attraction.entryFee),
      attraction.openingTime,
      attraction.closingTime,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      normalizedSearch.length === 0 ||
      searchableText.includes(normalizedSearch)
    );
  });

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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#2563EB"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attractions</Text>
        <Text style={styles.headerSubtitle}>
          Discover amazing places to visit in Ghana
        </Text>
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔎</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search tourist sites, regions, or places..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
          >
            <Text style={styles.clearSearchText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          {filteredAttractions.length} place
          {filteredAttractions.length === 1 ? "" : "s"} found
          {imagesLoading ? " • loading real images..." : ""}
        </Text>
      </View>

      <View style={styles.list}>
        {filteredAttractions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No places found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching by name, region, location, or category.
            </Text>
          </View>
        ) : (
          filteredAttractions.map((attraction) => {
            const isBooking = bookingId === attraction.attractionId;
            const images = getImageSlides(attraction, wikimediaImages);
            const activeSlide = activeSlides[attraction.attractionId] || 0;

            return (
              <View key={attraction.attractionId} style={styles.card}>
                <View style={styles.imageContainer}>
                  {images.length > 0 ? (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) =>
                        handleSlideScroll(attraction.attractionId, event)
                      }
                    >
                      {images.map((imageUrl, index) => (
                        <View
                          key={`${attraction.attractionId}-${index}`}
                          style={[styles.slide, { width: slideWidth }]}
                        >
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderEmoji}>🌍</Text>
                            <Text style={styles.placeholderText}>
                              {attraction.name}
                            </Text>
                          </View>

                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="cover"
                          />

                          <View style={styles.darkOverlay} />
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noImageBox}>
                      <Text style={styles.placeholderEmoji}>🇬🇭</Text>
                      <Text style={styles.placeholderText}>
                        {attraction.name}
                      </Text>
                      <Text style={styles.noImageSubtext}>
                        Real images loading...
                      </Text>
                    </View>
                  )}

                  {attraction.region ? (
                    <View style={styles.regionBadge}>
                      <Text style={styles.regionBadgeText}>
                        📍 {attraction.region}
                      </Text>
                    </View>
                  ) : null}

                  {attraction.isLocalOnly ? (
                    <View style={styles.localBadge}>
                      <Text style={styles.localBadgeText}>Preview</Text>
                    </View>
                  ) : null}

                  <View style={styles.imageOverlayText}>
                    <Text style={styles.imageOverlayTitle}>
                      {attraction.name}
                    </Text>
                  </View>

                  {images.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {images.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            activeSlide === index && styles.activeDot,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.topRow}>
                    <Text style={styles.category}>
                      {attraction.category || "Attraction"}
                    </Text>

                    <Text style={styles.fee}>
                      {formatMoney(attraction.entryFee)}
                    </Text>
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
                      🕐 {formatTime(attraction.openingTime) || "?"} -{" "}
                      {formatTime(attraction.closingTime) || "?"}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      attraction.isLocalOnly && styles.previewButton,
                      isBooking && styles.bookButtonDisabled,
                    ]}
                    disabled={isBooking}
                    onPress={() => confirmBooking(attraction)}
                  >
                    {isBooking ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.bookButtonText}>
                        {attraction.isLocalOnly
                          ? "Preview Only"
                          : "Book Attraction"}
                      </Text>
                    )}
                  </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },

  headerSubtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },

  searchWrapper: {
    marginHorizontal: 24,
    marginTop: 16,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 36,
    fontSize: 15,
    color: "#111827",
  },

  clearSearchButton: {
    position: "absolute",
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  clearSearchText: {
    color: "#6B7280",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
  },

  resultInfo: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  resultText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },

  list: {
    padding: 24,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

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

  imageContainer: {
    height: 210,
    position: "relative",
    backgroundColor: "#0F172A",
  },

  slide: {
    height: 210,
    position: "relative",
    backgroundColor: "#0F172A",
  },

  imagePlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  noImageBox: {
    flex: 1,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  placeholderEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  placeholderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  noImageSubtext: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 6,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  darkOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  regionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
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

  localBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#D97706",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },

  localBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  imageOverlayText: {
    position: "absolute",
    bottom: 28,
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

  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 3,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  activeDot: {
    width: 18,
    backgroundColor: "#FFFFFF",
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

  location: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 8,
  },

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

  previewButton: {
    backgroundColor: "#6B7280",
  },

  bookButtonDisabled: {
    opacity: 0.7,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});