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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import api from "../../services/api";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminUsers"
>;

type User = {
  userId: number;
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
};

function formatRole(role?: string) {
  if (!role) return "USER";
  return role.replace(/_/g, " ");
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminUsersScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error: any) {
      console.log("Admin users error:", error.response?.data || error.message);
      Alert.alert(
        "Could not load users",
        error.response?.data?.message || "Make sure you are logged in as administrator."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const toggleUserStatus = (user: User) => {
    const currentStatus = user.isActive !== false;
    const action = currentStatus ? "deactivate" : "activate";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.fullName || user.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.toUpperCase(),
          style: currentStatus ? "destructive" : "default",
          onPress: () => updateUserStatus(user),
        },
      ]
    );
  };

  const updateUserStatus = async (user: User) => {
    const isCurrentlyActive = user.isActive !== false;
    const endpoint = isCurrentlyActive
      ? `/admin/users/${user.userId}/deactivate`
      : `/admin/users/${user.userId}/activate`;

    setUpdatingUserId(user.userId);

    try {
      const response = await api.put(endpoint);

      Alert.alert("Success", response.data.message || "User status updated successfully.");
      await fetchUsers();
    } catch (error: any) {
      console.log("Status update error:", error.response?.data || error.message);
      Alert.alert(
        "Update Failed",
        error.response?.data?.message || "Could not update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Users & Profiles</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>Registered users will appear here.</Text>
          </View>
        ) : (
          users.map((user) => {
            const isActive = user.isActive !== false;
            const isUpdating = updatingUserId === user.userId;

            return (
              <View key={user.userId} style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(user.fullName)}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.fullName || "Unnamed User"}
                    </Text>
                    <Text style={styles.userEmail}>
                      {user.email || "No email provided"}
                    </Text>
                  </View>
                </View>

                <View style={styles.badges}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {formatRole(user.role)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isActive ? styles.activeBadge : styles.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isActive ? styles.activeText : styles.inactiveText,
                      ]}
                    >
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </Text>
                  </View>

                  {user.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isActive ? styles.deactivateButton : styles.activateButton,
                    isUpdating && styles.buttonDisabled,
                  ]}
                  disabled={isUpdating}
                  onPress={() => toggleUserStatus(user)}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {isActive ? "Deactivate User" : "Activate User"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#1E3A5F",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2D4E6F",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: { color: "#FFFFFF", fontSize: 30, lineHeight: 30 },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold" },
  headerSubtitle: { color: "#94A3B8", fontSize: 13 },

  list: { padding: 16 },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6 },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  userTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  userEmail: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  roleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleText: { color: "#2563EB", fontSize: 12, fontWeight: "700" },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadge: { backgroundColor: "#DCFCE7" },
  inactiveBadge: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 12, fontWeight: "700" },
  activeText: { color: "#16A34A" },
  inactiveText: { color: "#DC2626" },

  verifiedBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: { color: "#9333EA", fontSize: 12, fontWeight: "700" },

  actionButton: {
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activateButton: { backgroundColor: "#16A34A" },
  deactivateButton: { backgroundColor: "#DC2626" },
  buttonDisabled: { opacity: 0.6 },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  bottomSpace: { height: 40 },
});