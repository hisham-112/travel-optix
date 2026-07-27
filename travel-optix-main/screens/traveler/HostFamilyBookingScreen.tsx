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
import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../services/api";

export default function HostFamilyBookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const family = route.params?.family;

  const [familyName, setFamilyName] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("2");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const pricePerNight = family?.pricePerNight || 75;
  const estimatedTotal = pricePerNight * parseInt(numberOfPeople || "1");

  const handleBook = async () => {
    if (!familyName.trim()) {
      Alert.alert("Required", "Please enter your family name.");
      return;
    }
    if (!numberOfPeople || parseInt(numberOfPeople) < 1) {
      Alert.alert("Required", "Please enter a valid number of people.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        bookingType: "HOST_FAMILY",
        referenceId: family.familyId,
        totalAmount: estimatedTotal,
        notes: `Family Name: ${familyName} | Number of People: ${numberOfPeople}\n${notes || ""}`,
      };

      console.log("Sending payload:", payload); // For debugging

      const response = await api.post("/tourist/bookings/family", payload);

      Alert.alert(
        "Booking Created Successfully!",
        "Your host family booking has been created.\n\nPlease proceed to make payment.",
        [
          {
            text: "Go to Payments",
            onPress: () => navigation.navigate("Payments"),
          },
        ]
      );
    } catch (error: any) {
      console.log("Booking Error:", error.response?.data || error.message);

      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      "Could not create booking. Please try again.";

      Alert.alert("Could not create booking", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Host Family Stay</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.familyName}>{family?.familyName || family?.user?.fullName}</Text>
        <Text style={styles.location}>{family?.location}</Text>

        <Text style={styles.label}>Your Family Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. The Mensah Family"
          value={familyName}
          onChangeText={setFamilyName}
        />

        <Text style={styles.label}>Number of People</Text>
        <TextInput
          style={styles.input}
          placeholder="2"
          keyboardType="number-pad"
          value={numberOfPeople}
          onChangeText={setNumberOfPeople}
        />

        <Text style={styles.label}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special requests or dietary needs..."
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Estimated Total</Text>
          <Text style={styles.total}>GHS {estimatedTotal.toFixed(2)}</Text>
          <Text style={styles.breakdown}>
            ({pricePerNight} per night × {numberOfPeople} people)
          </Text>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Proceed to Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    backgroundColor: "#1E3A5F",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15 },
  backText: { color: "#FFFFFF", fontSize: 18 },
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },

  content: { padding: 24 },

  familyName: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  location: { fontSize: 15, color: "#2563EB", marginBottom: 20 },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: { height: 90, textAlignVertical: "top" },

  priceBox: {
    backgroundColor: "#F0F9FF",
    padding: 20,
    borderRadius: 12,
    marginVertical: 24,
    alignItems: "center",
  },
  priceLabel: { color: "#0369A1", fontSize: 14 },
  total: { fontSize: 28, fontWeight: "bold", color: "#1E40AF", marginVertical: 6 },
  breakdown: { color: "#64748B", fontSize: 13 },

  bookButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});