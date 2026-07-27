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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Admin">;

type OverviewAnalytics = {
  totalUsers?: number;
  totalBookings?: number;
  totalPayments?: number;
  totalAttractions?: number;
  totalEvents?: number;
  totalGuides?: number;
  totalHostFamilies?: number;
  pendingVerifications?: number;
  totalRevenue?: number;
};

type RevenueAnalytics = {
  totalRevenue?: number;
  mobileMoneyRevenue?: number;
  cardRevenue?: number;
  totalTransactions?: number;
};

function formatCurrency(value?: number) {
  const amount = Number(value || 0);
  return `GHS ${amount.toFixed(2)}`;
}

export default function AdminDashboard() {
  const navigation = useNavigation<NavigationProp>();
  const logout = useAuthStore((state) => (state as any).logout);

  const [overview, setOverview] = useState<OverviewAnalytics>({});
  const [revenue, setRevenue] = useState<RevenueAnalytics>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [overviewResponse, revenueResponse] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/revenue"),
      ]);
      setOverview(overviewResponse.data.analytics || {});
      setRevenue(revenueResponse.data.analytics || {});
    } catch (error: any) {
      console.log(
        "Admin dashboard error:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );
      Alert.alert(
        "Could not load admin data",
        error.response?.data?.message ||
          "Make sure you are logged in with an ADMIN account."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("travel_optix_token");
          } catch (e) {
            // ignore
          }
          if (typeof logout === "function") {
            logout();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage Travel Optix platform</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{overview.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{overview.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{overview.totalEvents || 0}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{overview.totalAttractions || 0}</Text>
          <Text style={styles.statLabel}>Attractions</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Revenue Overview</Text>
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Total Revenue</Text>
        <Text style={styles.revenueAmount}>{formatCurrency(revenue.totalRevenue)}</Text>
        <View style={styles.revenueDivider} />
        <View style={styles.revenueRow}>
          <View>
            <Text style={styles.revenueSmallLabel}>Transactions</Text>
            <Text style={styles.revenueSmallValue}>{revenue.totalTransactions || 0}</Text>
          </View>
          <View>
            <Text style={styles.revenueSmallLabel}>Mobile Money</Text>
            <Text style={styles.revenueSmallValue}>{formatCurrency(revenue.mobileMoneyRevenue)}</Text>
          </View>
          <View>
            <Text style={styles.revenueSmallLabel}>Card</Text>
            <Text style={styles.revenueSmallValue}>{formatCurrency(revenue.cardRevenue)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Platform Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tour Guides</Text>
          <Text style={styles.summaryValue}>{overview.totalGuides || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Host Families</Text>
          <Text style={styles.summaryValue}>{overview.totalHostFamilies || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payments</Text>
          <Text style={styles.summaryValue}>{overview.totalPayments || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pending Verifications</Text>
          <Text style={styles.pendingValue}>{overview.pendingVerifications || 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Manage</Text>
      <View style={styles.actionCard}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate("AdminUsers")}
        >
          <Text style={styles.actionLabel}>Users & Profiles</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate("AdminBookings")}
        >
          <Text style={styles.actionLabel}>Bookings</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.refreshHint}>Pull down to refresh dashboard data.</Text>
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#1E3A5F", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  logoutButton: { backgroundColor: "#2D4E6F", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  logoutText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  statCard: { backgroundColor: "#FFFFFF", borderRadius: 12, width: "47%", padding: 16, alignItems: "center", shadowColor: "#000000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statCount: { fontSize: 28, fontWeight: "bold", color: "#2563EB" },
  statLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", paddingHorizontal: 24, marginBottom: 12, marginTop: 8 },
  revenueCard: { marginHorizontal: 24, padding: 18, borderRadius: 12, backgroundColor: "#1E3A5F" },
  revenueLabel: { color: "#94A3B8", fontSize: 14 },
  revenueAmount: { color: "#FFFFFF", fontSize: 30, fontWeight: "bold", marginTop: 4 },
  revenueDivider: { height: 1, backgroundColor: "#2D4E6F", marginVertical: 16 },
  revenueRow: { flexDirection: "row", justifyContent: "space-between" },
  revenueSmallLabel: { color: "#94A3B8", fontSize: 11, marginBottom: 4 },
  revenueSmallValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, paddingHorizontal: 16, shadowColor: "#000000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  summaryLabel: { fontSize: 15, color: "#374151" },
  summaryValue: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  pendingValue: { fontSize: 15, fontWeight: "700", color: "#D97706" },
  actionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, paddingHorizontal: 16, shadowColor: "#000000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  actionLabel: { fontSize: 15, color: "#374151" },
  chevron: { fontSize: 20, color: "#9CA3AF" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  refreshHint: { color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 16 },
  bottomSpace: { height: 32 },
});