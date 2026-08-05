import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useCallback } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { useNotificationStore } from "../../store/notificationStore";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<NavProp>();

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  const storedUser = user as any;

  const fullName = user?.name || "Traveler";
  const email = user?.email || "No email available";
  const role = user?.role || "TOURIST";
  const phone = storedUser?.phone || "Not set";
  const location =
    storedUser?.city && storedUser?.region
      ? `${storedUser.city}, ${storedUser.region}`
      : storedUser?.region || storedUser?.city || "Not set";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>

        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Account Details</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{fullName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{phone}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{location}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{role.replace("_", " ")}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <Text style={[styles.infoValue, styles.activeText]}>Active</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      <View style={styles.infoCard}>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Text style={styles.infoLabel}>Notifications</Text>
          <View style={styles.notifRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => navigation.navigate("PrivacyPolicy")}
        >
          <Text style={styles.infoLabel}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => navigation.navigate("HelpSupport")}
        >
          <Text style={styles.infoLabel}>Help & Support</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => (navigation as any).navigate("TravelPass")}
        >
          <Text style={styles.infoLabel}>Travel Pass</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => (navigation as any).navigate("Bookings")}
        >
          <Text style={styles.infoLabel}>My Bookings</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {role === "ADMIN" && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => navigation.navigate("Admin")}
            >
              <Text style={styles.infoLabel}>Admin Dashboard</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    backgroundColor: "#2563EB",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 28 },
  profileName: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  editButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 8 },
  editButtonText: { color: "#2563EB", fontWeight: "600", fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#111827", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  infoCard: { backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 24, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  infoLabel: { fontSize: 15, color: "#374151" },
  infoValue: { fontSize: 15, color: "#6B7280", maxWidth: "58%", textAlign: "right" },
  activeText: { color: "#16A34A", fontWeight: "600" },
  chevron: { fontSize: 20, color: "#9CA3AF" },
  notifRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { backgroundColor: "#DC2626", borderRadius: 12, minWidth: 22, height: 22, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  logoutButton: { margin: 24, backgroundColor: "#DC2626", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  bottomSpace: { height: 24 },
});