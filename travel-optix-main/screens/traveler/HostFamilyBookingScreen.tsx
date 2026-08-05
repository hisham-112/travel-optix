import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../services/api";

type HostFamily = {
  familyId: number;
  familyName: string;
  location: string;
  pricePerNight?: number;
  maxCapacity: number;
  verificationStatus: string;
};

export default function HostFamilyBookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const family: HostFamily = route.params?.family;

  const [familyName, setFamilyName] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("2");
  const [numberOfNights, setNumberOfNights] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const pricePerNight = Number(family?.pricePerNight || 0);
  const peopleCount = useMemo(() => {
    const count = parseInt(numberOfPeople, 10);
    if (isNaN(count) || count < 1) return 1;
    return count;
  }, [numberOfPeople]);

  const nightsCount = useMemo(() => {
    const count = parseInt(numberOfNights, 10);
    if (isNaN(count) || count < 1) return 1;
    return count;
  }, [numberOfNights]);

  const estimatedTotal = useMemo(() => {
    if (pricePerNight === 0) return 0;
    return pricePerNight * nightsCount * peopleCount;
  }, [pricePerNight, nightsCount, peopleCount]);

  const handleBook = async () => {
    if (!family) {
      Alert.alert("Error", "Family information is missing");
      return;
    }

    if (!familyName.trim()) {
      Alert.alert("Required", "Please enter your family name");
      return;
    }

    if (peopleCount < 1) {
      Alert.alert("Required", "Number of people must be at least 1");
      return;
    }

    if (peopleCount > family.maxCapacity) {
      Alert.alert(
        "Capacity Exceeded",
        `This family can only accommodate up to ${family.maxCapacity} people`
      );
      return;
    }

    if (nightsCount < 1) {
      Alert.alert("Required", "Number of nights must be at least 1");
      return;
    }

    setLoading(true);

    try {
      const bookingNotes = [
        `Family Name: ${familyName.trim()}`,
        `Number of People: ${peopleCount}`,
        `Number of Nights: ${nightsCount}`,
        notes.trim() ? notes.trim() : null,
      ]
        .filter(Boolean)
        .join("\n");

      await api.post("/tourist/bookings/family", {
        referenceId: family.familyId,
        numberOfPeople: peopleCount,
        notes: bookingNotes,
      });

      Alert.alert(
        "Booking Created Successfully!",
        "Your host family booking has been created. Please proceed to make payment.",
        [
          {
            text: "Go to Bookings",
            onPress: () => navigation.navigate("Bookings"),
          },
          {
            text: "Stay Here",
            style: "cancel",
          },
        ]
      );
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Could not create booking. Please try again.";

      Alert.alert("Could not create booking", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Host Family Stay</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.familyName}>{family?.familyName}</Text>
        <Text style={styles.location}>{family?.location}</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Your Family Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Mensah Family"
            value={familyName}
            onChangeText={setFamilyName}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Number of People</Text>
            <TextInput
              style={styles.input}
              placeholder="2"
              keyboardType="number-pad"
              value={numberOfPeople}
              onChangeText={setNumberOfPeople}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helperText}>
              Max {family?.maxCapacity || 10} people
            </Text>
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Number of Nights</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="number-pad"
              value={numberOfNights}
              onChangeText={setNumberOfNights}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requests or dietary requirements..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Estimated Total</Text>
          <Text style={styles.total}>
            {pricePerNight === 0
              ? "Price on request"
              : `GHS ${estimatedTotal.toFixed(2)}`}
          </Text>
          {pricePerNight > 0 && (
            <Text style={styles.breakdown}>
              GHS {pricePerNight.toFixed(2)} × {nightsCount}{" "}
              {nightsCount === 1 ? "night" : "nights"} × {peopleCount}{" "}
              {peopleCount === 1 ? "person" : "people"}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Create Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: "#1E3A5F",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15, paddingVertical: 4, paddingRight: 8 },
  backText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", flex: 1 },
  form: { padding: 24 },
  familyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  location: { fontSize: 15, color: "#2563EB", marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  row: { flexDirection: "row" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  textArea: { height: 100, paddingTop: 12 },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  priceBox: {
    backgroundColor: "#F0F9FF",
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  priceLabel: { color: "#1E40AF", fontSize: 14, fontWeight: "600" },
  total: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563EB",
    marginVertical: 8,
  },
  breakdown: { color: "#64748B", fontSize: 12, textAlign: "center" },
  bookButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});