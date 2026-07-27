import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";

type Booking = {
  bookingId: number;
  bookingType?: string;
  scheduledDate?: string;
  status?: string;
  totalAmount?: number | string | null;
  notes?: string;
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
  // ✅ Get selected booking from navigation if passed
  const selectedFromBooking = route?.params?.selectedBooking as Booking | undefined;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(selectedFromBooking || null);
  const [paymentMethod, setPaymentMethod] = useState<"MOBILE_MONEY" | "CARD">("MOBILE_MONEY");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("MTN");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const paidBookingIds = useMemo(() => {
    return new Set(
      payments.map((p) => p.booking?.bookingId).filter((id): id is number => typeof id === "number")
    );
  }, [payments]);

  const unpaidBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const isCancelled = (booking.status || "").toUpperCase() === "CANCELLED";
      const amountNum = booking.totalAmount != null ? parseFloat(String(booking.totalAmount)) : 0;
      const hasAmount = amountNum > 0;
      return !isCancelled && hasAmount && !paidBookingIds.has(booking.bookingId);
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
  const selectBooking = (booking: Booking) => setSelectedBooking(booking);
  const clearPaymentForm = () => {
    setMobileNumber(""); setMobileProvider("MTN"); setCardHolderName("");
    setCardNumber(""); setCardExpiry(""); setCardCvv("");
  };

  const handlePayment = async () => {
    if (!selectedBooking) {
      Alert.alert("Select a booking", "Please choose a booking to pay for.");
      return;
    }
    const message = paymentMethod === "MOBILE_MONEY"
      ? `Pay ${formatMoney(selectedBooking.totalAmount)} using ${mobileProvider} Mobile Money?`
      : `Pay ${formatMoney(selectedBooking.totalAmount)} using card?`;
    Alert.alert("Confirm Payment", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Pay Now", onPress: processPayment }
    ]);
  };

  const processPayment = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    try {
      const endpoint = paymentMethod === "MOBILE_MONEY" ? "/tourist/payments/mobile-money" : "/tourist/payments/card";
      const body = paymentMethod === "MOBILE_MONEY"
        ? { bookingId: selectedBooking.bookingId, paymentMethod: "MOBILE_MONEY", mobileNumber: mobileNumber.trim(), mobileProvider, currency: "GHS" }
        : { bookingId: selectedBooking.bookingId, paymentMethod: "CARD", cardHolderName: cardHolderName.trim(), cardNumber: cardNumber.replace(/\s/g, ""), cardExpiry: cardExpiry.trim(), cardCvv: cardCvv.trim(), currency: "GHS" };
      const response = await api.post(endpoint, body);
      Alert.alert("Payment Successful", response.data?.message || "Payment was successful.");
      setSelectedBooking(null);
      clearPaymentForm();
      await loadPaymentData();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Could not process payment.";
      Alert.alert("Payment Failed", msg);
    } finally {
      setProcessing(false);
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

      {/* ✅ Filter out bookings with 0 or null price properly */}
      {unpaidBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No unpaid bookings</Text>
          <Text style={styles.emptyText}>Your unpaid bookings with a price will appear here.</Text>
        </View>
      ) : (
        unpaidBookings.map((booking) => {
          const isSelected = selectedBooking?.bookingId === booking.bookingId;
          return (
            <TouchableOpacity key={booking.bookingId} style={[styles.bookingCard, isSelected && styles.selectedBookingCard]} onPress={() => selectBooking(booking)}>
              <View style={styles.bookingRow}>
                <Text style={styles.bookingTitle}>{formatBookingType(booking.bookingType)} Booking</Text>
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
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity style={[styles.methodButton, paymentMethod === "MOBILE_MONEY" && styles.selectedMethod]} onPress={() => setPaymentMethod("MOBILE_MONEY")}>
              <Text style={[styles.methodText, paymentMethod === "MOBILE_MONEY" && styles.selectedMethodText]}>Mobile Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.methodButton, paymentMethod === "CARD" && styles.selectedMethod]} onPress={() => setPaymentMethod("CARD")}>
              <Text style={[styles.methodText, paymentMethod === "CARD" && styles.selectedMethodText]}>Card</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.payFor}>Paying: <Text style={styles.bold}>{formatBookingType(selectedBooking.bookingType)} Booking</Text></Text>
            <Text style={styles.bigAmount}>{formatMoney(selectedBooking.totalAmount)}</Text>

            {paymentMethod === "MOBILE_MONEY" ? (
              <>
                <Text style={styles.label}>Provider</Text>
                <View style={styles.providerRow}>
                  {["MTN", "Vodafone", "AirtelTigo"].map((p) => (
                    <TouchableOpacity key={p} style={[styles.providerButton, mobileProvider === p && styles.selectedProvider]} onPress={() => setMobileProvider(p)}>
                      <Text style={[styles.providerText, mobileProvider === p && styles.selectedProviderText]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} placeholder="0240000000" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
              </>
            ) : (
              <>
                <Text style={styles.demoWarning}>Demo only — do not use real card.</Text>
                <Text style={styles.label}>Card Name</Text>
                <TextInput style={styles.input} placeholder="Demo User" autoCapitalize="words" value={cardHolderName} onChangeText={setCardHolderName} />
                <Text style={styles.label}>Card Number</Text>
                <TextInput style={styles.input} placeholder="4111..." keyboardType="number-pad" value={cardNumber} onChangeText={setCardNumber} />
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Expiry</Text>
                    <TextInput style={styles.input} placeholder="12/30" value={cardExpiry} onChangeText={setCardExpiry} />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput style={styles.input} placeholder="123" secureTextEntry keyboardType="number-pad" value={cardCvv} onChangeText={setCardCvv} />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.payBtn, processing && styles.disabled]} disabled={processing} onPress={handlePayment}>
              {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Pay {formatMoney(selectedBooking.totalAmount)}</Text>}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { color: "#6B7280", marginTop: 10, fontSize: 14 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#1E3A5F" },
  headerTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, marginHorizontal: 24, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 5 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  bookingCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: "transparent" },
  selectedBookingCard: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  bookingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  bookingTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  selectedText: { color: "#2563EB", fontSize: 11, fontWeight: "bold" },
  info: { color: "#6B7280", fontSize: 13, marginBottom: 6 },
  amount: { color: "#16A34A", fontSize: 16, fontWeight: "700" },
  methodRow: { flexDirection: "row", gap: 10, paddingHorizontal: 24 },
  methodButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: "#E5E7EB" },
  selectedMethod: { backgroundColor: "#2563EB" },
  methodText: { color: "#4B5563", fontWeight: "700", fontSize: 13 },
  selectedMethodText: { color: "#FFFFFF" },
  paymentCard: { backgroundColor: "#FFFFFF", marginHorizontal: 24, marginTop: 14, borderRadius: 12, padding: 16 },
  payFor: { fontSize: 13, color: "#6B7280" },
  bold: { fontWeight: "700", color: "#111827" },
  bigAmount: { fontSize: 26, fontWeight: "800", color: "#2563EB", marginTop: 6, marginBottom: 16 },
  label: { fontWeight: "600", color: "#374151", fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, color: "#111827", fontSize: 15, marginBottom: 14 },
  providerRow: { flexDirection: "row", gap: 7, marginBottom: 16 },
  providerButton: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  selectedProvider: { backgroundColor: "#DBEAFE", borderWidth: 1, borderColor: "#2563EB" },
  providerText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  selectedProviderText: { color: "#2563EB" },
  demoWarning: { color: "#B45309", backgroundColor: "#FEF3C7", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 16 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
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
});