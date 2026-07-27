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
import api from "../../services/api";

type HostFamily = {
  familyId: number;
  familyName: string;
  location: string;
  pricePerNight?: number;
  maxCapacity: number;
  verificationStatus: string;
};

export default function HostFamiliesScreen() {
  const navigation = useNavigation<any>();

  const [families, setFamilies] = useState<HostFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFamilies = useCallback(async () => {
    try {
      const res = await api.get("/families");
      setFamilies(res.data.data || []);
    } catch (error) {
      Alert.alert("Error", "Could not load host families.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const handleSelect = (family: HostFamily) => {
    if (family.verificationStatus !== "APPROVED") {
      Alert.alert("Not Available", "This host family is still under verification.");
      return;
    }
    navigation.navigate("HostFamilyBooking", { family });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFamilies} tintColor="#2563EB" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Host Families</Text>
        <Text style={styles.headerSubtitle}>Stay with a local Ghanaian family</Text>
      </View>

      <View style={styles.list}>
        {families.map((family) => (
          <TouchableOpacity key={family.familyId} style={styles.card} onPress={() => handleSelect(family)}>
            <Text style={styles.familyName}>{family.familyName}</Text>
            <Text style={styles.location}>{family.location}</Text>
            <Text style={styles.price}>
              {family.pricePerNight ? `GHS ${family.pricePerNight} per night` : "Price on request"}
            </Text>
            <Text style={styles.capacity}>Maximum {family.maxCapacity} people</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#1E3A5F",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },

  list: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  familyName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  location: { fontSize: 14, color: "#2563EB", marginVertical: 4 },
  price: { fontSize: 16, fontWeight: "700", color: "#16A34A", marginTop: 4 },
  capacity: { fontSize: 13, color: "#6B7280" },
});