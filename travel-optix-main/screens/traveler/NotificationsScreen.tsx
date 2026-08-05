import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useNotificationStore } from "../../store/notificationStore";

type NotificationItem = {
  notificationId: number;
  title?: string;
  message?: string;
  type?: string;
  isRead: boolean;
  sentAt?: string;
};

function timeAgo(dateValue?: string) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(dateValue?: string) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} at ${time}`;
}

function iconForType(type?: string): keyof typeof Ionicons.glyphMap {
  const t = (type || "").toUpperCase();
  if (t.includes("BOOKING")) return "calendar";
  if (t.includes("PAYMENT")) return "card";
  if (t.includes("PASS")) return "id-card";
  return "notifications";
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ The notification currently open in the reader view
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const syncBadge = (list: NotificationItem[]) => {
    setUnreadCount(list.filter((n) => !n.isRead).length);
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/tourist/notifications");
      const list: NotificationItem[] = (response.data?.data || []).map((n: any) => ({
        ...n,
        isRead: n.isRead ?? n.read ?? false,
      }));
      setNotifications(list);
      syncBadge(list);
    } catch (error: any) {
      console.log("Notifications error:", error.response?.data || error.message);
      Alert.alert("Error", "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // ─── Mark one as read (optimistic) ───────────────────────
  const markAsRead = async (id: number) => {
    const updated = notifications.map((n) =>
      n.notificationId === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    syncBadge(updated);

    try {
      await api.patch(`/tourist/notifications/${id}/read`);
    } catch (error: any) {
      console.log("Mark read error:", error.response?.data || error.message);
    }
  };

  // ─── Tap = open reader view (marks read once opened) ─────
  const handlePress = (item: NotificationItem) => {
    setSelected(item);
    if (!item.isRead) {
      markAsRead(item.notificationId);
    }
  };

  // ─── Long-press = options menu ───────────────────────────
  const handleLongPress = (item: NotificationItem) => {
    const buttons: any[] = [];

    if (!item.isRead) {
      buttons.push({
        text: "Mark as Read",
        onPress: () => markAsRead(item.notificationId),
      });
    }

    buttons.push({
      text: "Delete",
      style: "destructive",
      onPress: () => confirmDelete(item),
    });

    buttons.push({ text: "Cancel", style: "cancel" });

    Alert.alert(item.title || "Notification", undefined, buttons);
  };

  const confirmDelete = (item: NotificationItem) => {
    Alert.alert("Delete this notification?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteOne(item.notificationId),
      },
    ]);
  };

  const deleteOne = async (id: number) => {
    const updated = notifications.filter((n) => n.notificationId !== id);
    setNotifications(updated);
    syncBadge(updated);

    try {
      await api.delete(`/tourist/notifications/${id}`);
    } catch (error: any) {
      console.log("Delete error:", error.response?.data || error.message);
      fetchNotifications(); // restore if server failed
    }
  };

  // ─── Mark all read ───────────────────────────────────────
  const handleMarkAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    syncBadge(updated);

    try {
      await api.patch("/tourist/notifications/read-all");
    } catch (error: any) {
      console.log("Mark all error:", error.response?.data || error.message);
      fetchNotifications();
    }
  };

  // ─── Clear all ───────────────────────────────────────────
  const handleClearAll = () => {
    Alert.alert(
      "Clear all notifications?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setNotifications([]);
            setUnreadCount(0);
            try {
              await api.delete("/tourist/notifications/clear-all");
            } catch (error: any) {
              console.log("Clear all error:", error.response?.data || error.message);
              fetchNotifications();
            }
          },
        },
      ]
    );
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, !item.isRead && styles.iconCircleUnread]}>
        <Ionicons
          name={iconForType(item.type)}
          size={20}
          color={item.isRead ? "#9CA3AF" : "#2563EB"}
        />
      </View>

      <View style={styles.notifBody}>
        <View style={styles.notifTopRow}>
          <Text
            style={[styles.notifTitle, item.isRead && styles.notifTitleRead]}
            numberOfLines={1}
          >
            {item.title || "Notification"}
          </Text>
          <Text style={styles.notifTime}>{timeAgo(item.sentAt)}</Text>
        </View>
        <Text
          style={[styles.notifMessage, item.isRead && styles.notifMessageRead]}
          numberOfLines={2}
        >
          {item.message || ""}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={[styles.headerSide, styles.headerActions]}>
          {hasUnread && (
            <TouchableOpacity onPress={handleMarkAllRead} hitSlop={8}>
              <Ionicons name="checkmark-done" size={22} color="#2563EB" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notificationId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              Booking updates and pass alerts will show up here.
            </Text>
          </View>
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <Text style={styles.hint}>Tap to open · Hold for options</Text>
          ) : null
        }
      />

      {/* ─── ✅ Reader view (iMessage-style) ─────────────────── */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.readerOverlay}>
          <View style={styles.readerCard}>
            {/* Close */}
            <TouchableOpacity
              style={styles.readerClose}
              onPress={() => setSelected(null)}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.readerIconCircle}>
              <Ionicons
                name={iconForType(selected?.type)}
                size={28}
                color="#2563EB"
              />
            </View>

            {/* Title + time */}
            <Text style={styles.readerTitle}>
              {selected?.title || "Notification"}
            </Text>
            <Text style={styles.readerTime}>{fullDate(selected?.sentAt)}</Text>

            <View style={styles.readerDivider} />

            {/* Full message */}
            <ScrollView style={styles.readerScroll}>
              <Text style={styles.readerMessage}>
                {selected?.message || "No message content."}
              </Text>
            </ScrollView>

            {/* Done */}
            <TouchableOpacity
              style={styles.readerDoneButton}
              onPress={() => setSelected(null)}
            >
              <Text style={styles.readerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerSide: { minWidth: 40, justifyContent: "center" },
  headerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },

  listContent: { padding: 16, flexGrow: 1 },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  notifCardUnread: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconCircleUnread: { backgroundColor: "#DBEAFE" },

  notifBody: { flex: 1 },
  notifTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  notifTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  notifTitleRead: { fontWeight: "500", color: "#6B7280" },
  notifTime: { fontSize: 12, color: "#9CA3AF" },
  notifMessage: { fontSize: 13, color: "#4B5563", lineHeight: 18 },
  notifMessageRead: { color: "#9CA3AF" },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
    marginLeft: 10,
  },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 6, paddingHorizontal: 40 },

  hint: { textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8 },

  // ─── Reader view ─────────────────────────────
  readerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  readerCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 16,
    maxHeight: "80%",
  },
  readerClose: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  readerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 4,
  },
  readerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginTop: 14,
  },
  readerTime: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
  },
  readerDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },
  readerScroll: { maxHeight: 260 },
  readerMessage: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
  readerDoneButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  readerDoneText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});