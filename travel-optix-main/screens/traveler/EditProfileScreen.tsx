import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Western North",
  "Volta",
  "Oti",
  "Northern",
  "North East",
  "Savannah",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const storedUser = user as any;

  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(storedUser?.phone || "");
  const [address, setAddress] = useState(storedUser?.address || "");
  const [city, setCity] = useState(storedUser?.city || "");
  const [region, setRegion] = useState(storedUser?.region || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Pre-fill from backend (source of truth) ─────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/tourist/profile");
        const data = response.data?.data || {};
        setFullName(data.fullName || user?.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setRegion(data.region || "");
      } catch (error: any) {
        console.log("Load profile error:", error.response?.data || error.message);
        // Fall back to whatever is in the store — still editable
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.name]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }

    setSaving(true);
    try {
      await api.put("/tourist/profile", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        region,
      });

      // ✅ Update the store so Profile screen reflects changes instantly
      useAuthStore.setState((state) => ({
        user: state.user
          ? ({
              ...state.user,
              name: fullName.trim(),
              phone: phone.trim(),
              address: address.trim(),
              city: city.trim(),
              region,
            } as any)
          : state.user,
      }));

      Alert.alert("Profile Updated ✅", "Your details have been saved.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error.response?.data?.message || "Could not update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.backButton} />
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0240000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Email</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{user?.email}</Text>
          </View>
          <Text style={styles.helperText}>
            Email can't be changed — it's your verified login.
          </Text>
        </View>

        {/* Location */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. House 12, Osu Oxford Street"
            placeholderTextColor="#9CA3AF"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>City / Town</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Accra"
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Region</Text>
          <View style={styles.regionWrap}>
            {GHANA_REGIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.regionChip, region === r && styles.regionChipSelected]}
                onPress={() => setRegion(r)}
              >
                <Text
                  style={[styles.regionChipText, region === r && styles.regionChipTextSelected]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },

  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 8, marginBottom: 6 },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111827",
  },
  inputDisabled: { backgroundColor: "#F3F4F6", justifyContent: "center" },
  inputDisabledText: { color: "#9CA3AF", fontSize: 15 },
  helperText: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },

  regionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  regionChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  regionChipSelected: { backgroundColor: "#DBEAFE", borderWidth: 1, borderColor: "#2563EB" },
  regionChipText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  regionChipTextSelected: { color: "#2563EB" },

  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  bottomSpace: { height: 40 },
});