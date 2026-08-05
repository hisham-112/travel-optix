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

type FestivalEvent = {
  eventId: number;
  name: string;
  description?: string;
  location?: string;
  region?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  pricePerPerson?: number;
  photoUrl?: string;
  photoUrls?: string;
  isActive?: boolean;
  isLocalOnly?: boolean;
};

const API_BASE_URL = String(api.defaults?.baseURL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

// Keywords that should never appear – events containing these are removed entirely
const BLOCKED_KEYWORDS = ["homowo", "kente", "panafest", "kwahu"];

const LOCAL_GHANA_EVENTS: FestivalEvent[] = [
  {
    eventId: -1,
    name: "Independence Day Celebration",
    description:
      "Ghana’s Independence Day is celebrated every 6th March with parades, cultural performances, and national events.",
    location: "Nationwide",
    region: "Ghana",
    category: "National Holiday",
    startDate: "2026-03-06",
    endDate: "2026-03-06",
    pricePerPerson: 0,
    isActive: true,
    isLocalOnly: true,
  },
  {
    eventId: -2,
    name: "Republic Day",
    description:
      "Republic Day commemorates Ghana becoming a republic on 1st July, celebrated with civic and cultural activities.",
    location: "Nationwide",
    region: "Ghana",
    category: "National Holiday",
    startDate: "2026-07-01",
    endDate: "2026-07-01",
    pricePerPerson: 0,
    isActive: true,
    isLocalOnly: true,
  },
  // Homowo, Panafest, Kwahu Easter removed
  {
    eventId: -4,
    name: "Aboakyer Festival",
    description:
      "A famous deer-hunting festival celebrated by the people of Winneba, filled with tradition, processions, and cultural displays.",
    location: "Winneba",
    region: "Central Region",
    category: "Festival",
    startDate: "2026-05-01",
    endDate: "2026-05-03",
    pricePerPerson: 60,
    isActive: true,
    isLocalOnly: true,
  },
  {
    eventId: -5,
    name: "Hogbetsotso Festival",
    description:
      "A major Anlo-Ewe festival in the Volta Region celebrating migration history, unity, dance, and traditional culture.",
    location: "Anloga",
    region: "Volta Region",
    category: "Festival",
    startDate: "2026-11-01",
    endDate: "2026-11-07",
    pricePerPerson: 45,
    isActive: true,
    isLocalOnly: true,
  },
  {
    eventId: -6,
    name: "Chale Wote Street Art Festival",
    description:
      "A vibrant street art festival in Accra featuring murals, performances, fashion, music, and contemporary African art.",
    location: "Accra",
    region: "Greater Accra",
    category: "Arts & Culture",
    startDate: "2026-08-18",
    endDate: "2026-08-24",
    pricePerPerson: 80,
    isActive: true,
    isLocalOnly: true,
  },
  {
    eventId: -9,
    name: "National Farmers' Day",
    description:
      "A national holiday honouring farmers and fishers across Ghana for their contribution to the country.",
    location: "Nationwide",
    region: "Ghana",
    category: "National Holiday",
    startDate: "2026-12-04",
    endDate: "2026-12-04",
    pricePerPerson: 0,
    isActive: true,
    isLocalOnly: true,
  },
  {
    eventId: -10,
    name: "AfroFuture Festival",
    description:
      "A popular December festival in Accra celebrating African music, food, fashion, art, and culture.",
    location: "Accra",
    region: "Greater Accra",
    category: "Music Festival",
    startDate: "2026-12-28",
    endDate: "2026-12-29",
    pricePerPerson: 250,
    isActive: true,
    isLocalOnly: true,
  },
];

const WIKIMEDIA_SEARCH_TERMS: Record<string, string> = {
  "independence day celebration": "Ghana Independence Day parade",
  "republic day": "Ghana Republic Day",
  "aboakyer festival": "Aboakyer Festival Ghana",
  "hogbetsotso festival": "Hogbetsotso Festival Ghana",
  "chale wote street art festival": "Chale Wote Street Art Festival Ghana",
  "national farmers' day": "Ghana National Farmers Day",
  "afrofuture festival": "AfroFuture Ghana festival",
};

// Helper to normalize and check if an event should be blocked
function isBlockedEvent(event: FestivalEvent) {
  const name = event.name.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => name.includes(kw));
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ");
}

function normalizeBackendEvent(e: any): FestivalEvent {
  const rawDate = e.eventDate ?? e.startDate ?? "";
  const dateStr = typeof rawDate === "string" ? rawDate.split("T")[0] : "";

  const rawCategory = e.category ?? e.eventType ?? "";
  const prettyCategory = rawCategory
    ? rawCategory
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
    : "";

  return {
    eventId: e.eventId ?? e.id ?? 0,
    name: e.name ?? "Event",
    description: e.description ?? "",
    location: e.location ?? "",
    region: e.region ?? "",
    category: prettyCategory,
    startDate: dateStr,
    endDate: (e.endDate ?? dateStr) || dateStr,
    pricePerPerson: Number(e.pricePerPerson ?? e.price ?? 0),
    photoUrl: e.photoUrl ?? "",
    photoUrls: e.photoUrls ?? "",
    isActive: e.isActive ?? true,
    isLocalOnly: false,
  };
}

function normalizeImageUrl(dbUrl?: string): string {
  if (!dbUrl || dbUrl.trim() === "") return "";
  const trimmed = dbUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (!API_BASE_URL) return "";
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
}

function parseBackendPhotoUrls(photoUrls?: string): string[] {
  if (!photoUrls || photoUrls.trim() === "") return [];
  return photoUrls.split(",").map(url => normalizeImageUrl(url)).filter(Boolean);
}

async function fetchWikimediaImages(eventName: string): Promise<string[]> {
  try {
    const key = normalizeName(eventName);
    const searchTerm = WIKIMEDIA_SEARCH_TERMS[key] || `${eventName} Ghana festival`;
    const url =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}` +
      `&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`;
    const response = await fetch(url, {
  headers: { "User-Agent": "TravelOptixApp/1.0 (contact: kwamekarikari2006@gmail.com)" },
});
if (!response.ok) return [];
const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return [];
    return Object.values(pages)
      .map((page: any) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url)
      .filter(Boolean)
      .filter((imageUrl: string) => /\.(jpe?g|png)(\?.*)?$/i.test(imageUrl))
      .slice(0, 5);
  } catch (error) {
    console.log("Wikimedia event image fetch failed:", eventName, error);
    return [];
  }
}

function getImageSlides(
  event: FestivalEvent,
  wikimediaImages: Record<string, string[]>
): string[] {
  const key = normalizeName(event.name);
  const backendMain = normalizeImageUrl(event.photoUrl);
  const backendExtra = parseBackendPhotoUrls(event.photoUrls);
  const wiki = wikimediaImages[key] || [];
  return Array.from(new Set([backendMain, ...backendExtra, ...wiki].filter(Boolean)));
}

function formatMoney(amount?: number) {
  if (!amount) return "Free";
  return `GHS ${Number(amount).toFixed(2)}`;
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Date TBA";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getBookingDate(event: FestivalEvent) {
  return event.startDate?.split("T")[0] || new Date().toISOString().split("T")[0];
}

function dedupeEvents(events: FestivalEvent[]): FestivalEvent[] {
  const seen = new Map<string, FestivalEvent>();
  for (const event of events) {
    const key = normalizeName(event.name);
    if (!seen.has(key)) seen.set(key, event);
  }
  return Array.from(seen.values());
}

function mergeBackendAndLocalEvents(backendEvents: FestivalEvent[]) {
  // First, block events with bad keywords
  const filteredBackend = backendEvents.filter((event) => !isBlockedEvent(event));

  // Merge with local (already filtered)
  const backendNames = new Set(filteredBackend.map(item => normalizeName(item.name)));
  const localOnly = LOCAL_GHANA_EVENTS.filter(
    (item) => !backendNames.has(normalizeName(item.name)) && !isBlockedEvent(item)
  );

  const merged = [...filteredBackend, ...localOnly];
  return dedupeEvents(merged);
}

function EventImageSlide({
  uri,
  eventName,
  width,
}: {
  uri: string;
  eventName: string;
  width: number;
}) {
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderEmoji}>🇬🇭</Text>
        <Text style={styles.placeholderText} numberOfLines={2}>
          {eventName}
        </Text>
      </View>

      {!errored && (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => {
            setLoading(true);
            setErrored(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setErrored(true);
            setLoading(false);
          }}
        />
      )}

      {loading && !errored && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      <View style={styles.darkOverlay} />
    </View>
  );
}

export default function EventsScreen() {
  const { width } = useWindowDimensions();
  const slideWidth = width - 48;

  const [backendEvents, setBackendEvents] = useState<FestivalEvent[]>([]);
  const [wikimediaImages, setWikimediaImages] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlides, setActiveSlides] = useState<Record<number, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get("/events");
      const raw = response.data?.data || [];
      const normalized = Array.isArray(raw) ? raw.map(normalizeBackendEvent) : [];
      setBackendEvents(normalized);
    } catch (error: any) {
      console.log("Events backend not available:", error.response?.data || error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const allEvents = useMemo(() => mergeBackendAndLocalEvents(backendEvents), [backendEvents]);

  // Load wiki images for events that have no backend image (so they might get one)
  useEffect(() => {
    let cancelled = false;
    const loadImages = async () => {
      setImagesLoading(true);
      const newImages: Record<string, string[]> = {};
      for (const event of allEvents) {
        const key = normalizeName(event.name);
        if (wikimediaImages[key]) continue;
        const images = await fetchWikimediaImages(event.name);
        if (images.length > 0) newImages[key] = images;
      }
      if (!cancelled && Object.keys(newImages).length > 0) {
        setWikimediaImages(prev => ({ ...prev, ...newImages }));
      }
      if (!cancelled) setImagesLoading(false);
    };
    loadImages();
    return () => { cancelled = true; };
  }, [allEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    setWikimediaImages({});
    fetchEvents();
  };

  const confirmBooking = (event: FestivalEvent) => {
    if (event.isLocalOnly) {
      Alert.alert("Preview Only", `${event.name} is showing for browsing, but it needs to be added to the backend database before users can book it.`);
      return;
    }
    Alert.alert("Book Event", `Book "${event.name}"?\nPrice: ${formatMoney(event.pricePerPerson)}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Book Now", onPress: () => bookEvent(event) },
    ]);
  };

  const bookEvent = async (event: FestivalEvent) => {
    setBookingId(event.eventId);
    try {
      await api.post("/tourist/bookings/event", {
        referenceId: event.eventId,
        scheduledDate: getBookingDate(event),
        numberOfPeople: 1,
        notes: `Event booking: ${event.name}`,
      });
      Alert.alert("Success", "Event booked successfully.");
    } catch (error: any) {
      Alert.alert("Failed", error.response?.data?.message || "Event booking failed.");
    } finally {
      setBookingId(null);
    }
  };

  const handleSlideScroll = (eventId: number, event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const cardWidth = event.nativeEvent.layoutMeasurement.width;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / cardWidth);
    setActiveSlides(prev => ({ ...prev, [eventId]: index }));
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Filter by search AND by having at least one image
  const filteredEvents = allEvents.filter(event => {
    // Must have at least one image URL (from backend or wiki after loading)
    if (getImageSlides(event, wikimediaImages).length === 0) {
      return false;
    }
    const searchableText = [
      event.name,
      event.description,
      event.location,
      event.region,
      event.category,
      formatMoney(event.pricePerPerson),
      formatDate(event.startDate),
      formatDate(event.endDate),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return !normalizedSearch || searchableText.includes(normalizedSearch);
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Festivals & Holidays</Text>
        <Text style={styles.headerSubtitle}>Explore Ghanaian festivals, national holidays, and cultural events</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search festivals, holidays, regions..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery("")}>
            <Text style={styles.clearSearchText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"} found
          {imagesLoading ? " • loading images..." : ""}
        </Text>
      </View>

      <View style={styles.list}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or pull to refresh.</Text>
          </View>
        ) : (
          filteredEvents.map(festivalEvent => {
            const isBooking = bookingId === festivalEvent.eventId;
            const images = getImageSlides(festivalEvent, wikimediaImages);
            const activeSlide = activeSlides[festivalEvent.eventId] || 0;
            const eventKey = normalizeName(festivalEvent.name);

            return (
              <View key={`${festivalEvent.isLocalOnly ? "local" : "db"}-${festivalEvent.eventId}-${eventKey}`} style={styles.card}>
                <View style={styles.imageContainer}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => handleSlideScroll(festivalEvent.eventId, event)}
                  >
                    {images.map((imageUrl, index) => (
                      <EventImageSlide
                        key={`${festivalEvent.eventId}-${index}-${imageUrl}`}
                        uri={imageUrl}
                        eventName={festivalEvent.name}
                        width={slideWidth}
                      />
                    ))}
                  </ScrollView>

                  {festivalEvent.region && (
                    <View style={styles.regionBadge}><Text style={styles.regionBadgeText}>📍 {festivalEvent.region}</Text></View>
                  )}
                  {festivalEvent.isLocalOnly && (
                    <View style={styles.localBadge}><Text style={styles.localBadgeText}>Preview</Text></View>
                  )}

                  <View style={styles.imageOverlayText}>
                    <Text style={styles.imageOverlayTitle} numberOfLines={2}>{festivalEvent.name}</Text>
                  </View>

                  {images.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {images.map((_, index) => (
                        <View key={index} style={[styles.dot, activeSlide === index && styles.activeDot]} />
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.topRow}>
                    <Text style={styles.category} numberOfLines={1}>{festivalEvent.category || "Event"}</Text>
                    <Text style={styles.price}>{formatMoney(festivalEvent.pricePerPerson)}</Text>
                  </View>
                  <Text style={styles.name}>{festivalEvent.name}</Text>
                  <Text style={styles.location}>{festivalEvent.location || "Ghana"}</Text>
                  <Text style={styles.dateText}>
                    📅 {formatDate(festivalEvent.startDate)}
                    {festivalEvent.endDate && festivalEvent.endDate !== festivalEvent.startDate
                      ? ` - ${formatDate(festivalEvent.endDate)}`
                      : ""}
                  </Text>
                  {!!festivalEvent.description && (
                    <Text style={styles.description} numberOfLines={3}>{festivalEvent.description}</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      festivalEvent.isLocalOnly && styles.previewButton,
                      isBooking && styles.bookButtonDisabled,
                    ]}
                    disabled={isBooking}
                    onPress={() => confirmBooking(festivalEvent)}
                  >
                    {isBooking
                      ? <ActivityIndicator color="#FFFFFF" />
                      : <Text style={styles.bookButtonText}>{festivalEvent.isLocalOnly ? "Preview Only" : "Book Event"}</Text>
                    }
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#FFFFFF" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { marginTop: 4, color: "#6B7280", fontSize: 14, lineHeight: 20 },
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
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, paddingRight: 36, fontSize: 15, color: "#111827" },
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
  clearSearchText: { color: "#6B7280", fontSize: 20, lineHeight: 22, fontWeight: "600" },
  resultInfo: { paddingHorizontal: 24, paddingTop: 10 },
  resultText: { color: "#6B7280", fontSize: 13, fontWeight: "500" },
  list: { padding: 24 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
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
  imageContainer: { height: 210, position: "relative", backgroundColor: "#0F172A" },
  slide: { height: 210, position: "relative", backgroundColor: "#0F172A", overflow: "hidden" },
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
    zIndex: 1,
  },
  noImageBox: { flex: 1, backgroundColor: "#1E3A5F", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  placeholderEmoji: { fontSize: 34, marginBottom: 8 },
  placeholderText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  noImageSubtext: { color: "#CBD5E1", fontSize: 12, marginTop: 6, textAlign: "center" },
  image: { width: "100%", height: "100%", zIndex: 2 },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  darkOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 4,
  },
  regionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 5,
  },
  regionBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  localBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#D97706",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 5,
  },
  localBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  imageOverlayText: {
    position: "absolute",
    bottom: 28,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  imageOverlayTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    lineHeight: 24,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" },
  activeDot: { width: 18, backgroundColor: "#FFFFFF" },
  cardContent: { padding: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 },
  category: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 1,
  },
  price: {
    color: "#16A34A",
    backgroundColor: "#F0FDF4",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  name: { color: "#111827", fontSize: 18, fontWeight: "700", marginBottom: 5, lineHeight: 22 },
  location: { color: "#6B7280", fontSize: 13, marginBottom: 6 },
  dateText: { color: "#2563EB", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  description: { color: "#6B7280", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  bookButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  previewButton: { backgroundColor: "#6B7280" },
  bookButtonDisabled: { opacity: 0.7 },
  bookButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});