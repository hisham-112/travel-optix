import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import api from "../../services/api";

// ⚠️ Must match paystack.callback-url in application.properties
const PAYSTACK_CALLBACK_PREFIX = "https://traveloptix.app/paystack/callback";

type Booking = {
  bookingId: number;
  bookingType?: string;
  scheduledDate?: string;
  status?: string;
  totalAmount?: number | string | null;
  notes?: string;
  referenceName?: string;
};

function formatBookingType(type?: string) {
  if (!type) return "Booking";
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatMoney(amount?: number | string | null) {
  if (amount == null || amount === "") return "—";
  const parsed = parseFloat(String(amount));
  if (isNaN(parsed)) return "—";
  return `GHS ${parsed.toFixed(2)}`;
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PaymentsScreen({ route }: any) {
  const selectedFromBooking = route?.params?.selectedBooking as Booking | undefined;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(selectedFromBooking || null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ✅ Paystack checkout state
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payReference, setPayReference] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // ✅ FIXED: only SUCCESS payments remove a booking from "awaiting payment"
  const paidBookingIds = useMemo(() => {
    return new Set(
      payments
        .filter((p) => (p.paymentStatus || "").toUpperCase() === "SUCCESS")
        .map((p) => p.booking?.bookingId)
        .filter((id): id is number => typeof id === "number")
    );
  }, [payments]);

  const unpaidBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const isCancelled = (booking.status || "").toUpperCase() === "CANCELLED";
      const amountNum = booking.totalAmount != null ? parseFloat(String(booking.totalAmount)) : 0;
      return !isCancelled && amountNum > 0 && !paidBookingIds.has(booking.bookingId);
    });
  }, [bookings, paidBookingIds]);

  const loadPaymentData = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        api.get("/tourist/bookings"),
        api.get("/tourist/payments"),
      ]);
      setBookings(bRes.data?.data || []);
      setPayments(pRes.data?.data || []);
    } catch (error: any) {
      console.log("Payment load error:", error.response?.status, JSON.stringify(error.response?.data));
      Alert.alert("Could not load payments", error.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const handleRefresh = () => { setRefreshing(true); loadPaymentData(); };

  // ─── 1. Start payment: get Paystack checkout URL ─────────
  const startPayment = async () => {
    if (!selectedBooking) {
      Alert.alert("Select a booking", "Please choose a booking to pay for.");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post("/tourist/payments/paystack/initialize", {
        bookingId: selectedBooking.bookingId,
      });

      const data = res.data?.data || {};
      if (!data.authorizationUrl) {
        throw new Error("No checkout URL returned");
      }

      setPayReference(data.reference);
      setPayUrl(data.authorizationUrl); // opens the WebView modal
    } catch (error: any) {
      Alert.alert(
        "Could not start payment",
        error.response?.data?.message || error.message || "Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // ─── 2. Watch the WebView for Paystack's redirect ────────
  const handleWebViewNav = (navState: { url?: string }) => {
    if (navState.url && navState.url.startsWith(PAYSTACK_CALLBACK_PREFIX)) {
      setPayUrl(null);
      verifyPayment();
    }
  };

  // ─── 3. Verify with the backend ──────────────────────────
  const verifyPayment = async (reference?: string | null) => {
    const ref = reference ?? payReference;
    if (!ref) return;

    setVerifying(true);
    try {
      const res = await api.get(`/tourist/payments/paystack/verify/${ref}`);
      const status =
        res.data?.data?.paymentStatus || res.data?.paymentStatus || "";

      if (status.toUpperCase() === "SUCCESS") {
        Alert.alert("Payment Successful 🎉", "Your booking is now confirmed.");
        setSelectedBooking(null);
      } else {
        Alert.alert(
          "Payment not completed",
          "No successful payment was found for this transaction."
        );
      }
      await loadPaymentData();
    } catch (error: any) {
      Alert.alert(
        "Verification failed",
        error.response?.data?.message || "Could not verify payment."
      );
    } finally {
      setVerifying(false);
      setPayReference(null);
    }
  };

  // Closing the checkout early → silently check just in case they paid
  const closeCheckout = () => {
    setPayUrl(null);
    if (payReference) {
      verifyPayment(payReference);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerSubtitle}>Pay securely for your Travel Optix bookings</Text>
      </View>

      <Text style={styles.sectionTitle}>Bookings Awaiting Payment</Text>

      {unpaidBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No unpaid bookings</Text>
          <Text style={styles.emptyText}>Your unpaid bookings with a price will appear here.</Text>
        </View>
      ) : (
        unpaidBookings.map((booking) => {
          const isSelected = selectedBooking?.bookingId === booking.bookingId;
          return (
            <TouchableOpacity key={booking.bookingId} style={[styles.bookingCard, isSelected && styles.selectedBookingCard]} onPress={() => setSelectedBooking(booking)}>
              <View style={styles.bookingRow}>
                <Text style={styles.bookingTitle}>
                  {booking.referenceName || `${formatBookingType(booking.bookingType)} Booking`}
                </Text>
                {isSelected && <Text style={styles.selectedText}>SELECTED</Text>}
              </View>
              <Text style={styles.info}>Scheduled: {formatDate(booking.scheduledDate)}</Text>
              <Text style={styles.amount}>{formatMoney(booking.totalAmount)}</Text>
            </TouchableOpacity>
          );
        })
      )}

      {selectedBooking && (
        <>
          <Text style={styles.sectionTitle}>Checkout</Text>

          <View style={styles.paymentCard}>
            <Text style={styles.payFor}>
              Paying: <Text style={styles.bold}>{selectedBooking.referenceName || `${formatBookingType(selectedBooking.bookingType)} Booking`}</Text>
            </Text>
            <Text style={styles.bigAmount}>{formatMoney(selectedBooking.totalAmount)}</Text>

            {/* ✅ Paystack handles MTN, Vodafone, AirtelTigo & cards */}
            <View style={styles.secureBox}>
              <Ionicons name="lock-closed" size={16} color="#2563EB" />
              <Text style={styles.secureText}>
                Secured by Paystack — pay with Mobile Money (MTN, Vodafone, AirtelTigo) or card.
              </Text>
            </View>

            <TouchableOpacity style={[styles.payBtn, processing && styles.disabled]} disabled={processing} onPress={startPayment}>
              {processing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.payBtnText}>Pay {formatMoney(selectedBooking.totalAmount)} with Paystack</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Payment History</Text>
      {payments.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No payments yet</Text><Text style={styles.emptyText}>Your payments will appear here.</Text></View>
      ) : (
        payments.map((p) => (
          <View key={p.paymentId} style={styles.historyCard}>
            <View style={styles.rowSpace}>
              <Text style={styles.historyTitle}>{formatBookingType(p.booking?.bookingType)} Payment</Text>
              <Text style={[styles.statusLabel, p.paymentStatus === "SUCCESS" ? styles.green : p.paymentStatus === "REFUNDED" ? styles.red : styles.orange]}>
                {p.paymentStatus || "PENDING"}
              </Text>
            </View>
            <Text style={styles.historyAmount}>{formatMoney(p.amount)}</Text>
            <Text style={styles.infoSmall}>Method: {p.paymentMethod || "—"}</Text>
            <Text style={styles.infoSmall}>Ref: {p.transactionRef || "—"}</Text>
          </View>
        ))
      )}

      {/* ─── ✅ Paystack checkout WebView ─────────────────────── */}
      <Modal visible={payUrl !== null} animationType="slide" onRequestClose={closeCheckout}>
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <Text style={styles.webviewTitle}>Paystack Checkout</Text>
            <TouchableOpacity onPress={closeCheckout} hitSlop={8}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {payUrl && (
            <WebView
              source={{ uri: payUrl }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              )}
              onNavigationStateChange={handleWebViewNav}
            />
          )}
        </View>
      </Modal>

      {/* Verifying overlay */}
      <Modal visible={verifying} transparent animationType="fade">
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { color: "#6B7280", marginTop: 10, fontSize: 14 },

  // ✅ CHANGED: white header to match the rest of the app
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#FFFFFF" },
  headerTitle: { color: "#111827", fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { color: "#6B7280", fontSize: 14, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, marginHorizontal: 24, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 5 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  bookingCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: "transparent" },
  selectedBookingCard: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  bookingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  bookingTitle: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  selectedText: { color: "#2563EB", fontSize: 11, fontWeight: "bold" },
  info: { color: "#6B7280", fontSize: 13, marginBottom: 6 },
  amount: { color: "#16A34A", fontSize: 16, fontWeight: "700" },

  paymentCard: { backgroundColor: "#FFFFFF", marginHorizontal: 24, marginTop: 4, borderRadius: 12, padding: 16 },
  payFor: { fontSize: 13, color: "#6B7280" },
  bold: { fontWeight: "700", color: "#111827" },
  bigAmount: { fontSize: 26, fontWeight: "800", color: "#2563EB", marginTop: 6, marginBottom: 16 },

  secureBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  secureText: { flex: 1, fontSize: 12, color: "#374151", lineHeight: 17 },

  payBtn: { backgroundColor: "#2563EB", borderRadius: 9, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  disabled: { opacity: 0.6 },
  payBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  historyCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, marginBottom: 12, padding: 16 },
  rowSpace: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  historyTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  statusLabel: { fontSize: 12, fontWeight: "800" },
  green: { color: "#16A34A" },
  red: { color: "#DC2626" },
  orange: { color: "#D97706" },
  historyAmount: { fontSize: 18, fontWeight: "800", color: "#2563EB", marginBottom: 8 },
  infoSmall: { color: "#6B7280", fontSize: 12, marginBottom: 3 },

  // ✅ WebView checkout
  webviewContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  webviewHeader: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  webviewTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  webviewLoading: { flex: 1, justifyContent: "center", alignItems: "center" },

  verifyingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  verifyingBox: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 28, alignItems: "center" },
  verifyingText: { marginTop: 12, fontSize: 14, color: "#374151", fontWeight: "600" },
});