import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/api";

type NotificationItem = {
  notificationId: number;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  sentAt?: string;
};

function formatTimeAgo(dateValue?: string) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getIconForType(type?: string) {
  switch ((type || "").toUpperCase()) {
    case "BOOKING":
      return "📅";
    case "PAYMENT":
      return "💳";
    case "GUARDIAN_ALERT":
      return "🛡️";
    case "CANCELLATION":
      return "❌";
    default:
      return "🔔";
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/tourist/notifications");
      setNotifications(response.data.data || []);
    } catch (error: any) {
      console.log("Notifications error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/tourist/notifications/read-all");
      fetchNotifications();
    } catch (error: any) {
      console.log("Mark all read error:", error.message);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await api.patch(`/tourist/notifications/${item.notificationId}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === item.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
      } catch (error) {
        // silently fail, not critical
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              We'll let you know when something happens.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.notificationId}
              style={[
                styles.notificationCard,
                !item.isRead && styles.unreadCard,
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              <Text style={styles.notificationIcon}>
                {getIconForType(item.type)}
              </Text>

              <View style={styles.notificationContent}>
                <View style={styles.notificationTop}>
                  <Text style={styles.notificationTitle}>
                    {item.title || "Notification"}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {item.message}
                </Text>

                <Text style={styles.notificationTime}>
                  {formatTimeAgo(item.sentAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { color: "#2563EB", fontSize: 16, width: 60 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  markAllText: { color: "#2563EB", fontSize: 13, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  notificationCard: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  unreadCard: { backgroundColor: "#EFF6FF" },

  notificationIcon: { fontSize: 24, marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },
  notificationMessage: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  notificationTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
});