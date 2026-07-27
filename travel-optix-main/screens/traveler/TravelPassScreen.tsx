import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";

type PassInfo = {
  passExpiryDate?: string;
  isExpired?: boolean;
  renewalFee?: number;
};

type PaymentMethod = "MOBILE_MONEY" | "CARD";

function formatDate(dateValue?: string) {
  if (!dateValue) return "Not set";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TravelPassScreen() {
  const user = useAuthStore((state) => state.user);

  const fullName = user?.name || "Traveler";
  const email = user?.email || "No email available";
  const role = user?.role || "TOURIST";
  const passId = user?.id
    ? `#TO-${user.id.toString().padStart(4, "0")}`
    : "#TO-0000";

  const [passInfo, setPassInfo] = useState<PassInfo>({});
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("MOBILE_MONEY");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("MTN");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const fetchPassInfo = useCallback(async () => {
    try {
      const response = await api.get("/tourist/pass");
      setPassInfo(response.data.data || {});
    } catch (error: any) {
      console.log("Pass info error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassInfo();
  }, [fetchPassInfo]);

  const openRenewModal = () => {
    setPaymentMethod("MOBILE_MONEY");
    setMobileNumber("");
    setMobileProvider("MTN");
    setCardHolderName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setShowRenewModal(true);
  };

  const closeRenewModal = () => {
    setShowRenewModal(false);
    setProcessing(false);
  };

  const handleRenew = () => {
    if (paymentMethod === "MOBILE_MONEY" && !mobileNumber.trim()) {
      Alert.alert("Mobile number required", "Enter a mobile money number.");
      return;
    }

    if (paymentMethod === "CARD" && (!cardHolderName.trim() || !cardNumber.trim())) {
      Alert.alert("Card details required", "Enter card holder name and number.");
      return;
    }

    const fee = passInfo.renewalFee || 25;

    Alert.alert(
      "Confirm Renewal",
      `Renew your Travel Pass for GHS ${fee.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Pay & Renew", onPress: processRenewal },
      ]
    );
  };

  const processRenewal = async () => {
    setProcessing(true);

    try {
      const body =
        paymentMethod === "MOBILE_MONEY"
          ? {
              paymentMethod: "MOBILE_MONEY",
              mobileNumber: mobileNumber.trim(),
              mobileProvider,
            }
          : {
              paymentMethod: "CARD",
              cardHolderName: cardHolderName.trim(),
              cardNumber: cardNumber.replace(/\s/g, ""),
              cardExpiry: cardExpiry.trim(),
              cardCvv: cardCvv.trim(),
            };

      const response = await api.post("/tourist/pass/renew", body);

      Alert.alert(
        "Pass Renewed! 🎉",
        `${response.data.message}\n\nNew expiry: ${formatDate(
          response.data.data?.newExpiryDate
        )}\nTransaction: ${response.data.data?.transactionRef}`
      );

      closeRenewModal();
      await fetchPassInfo();
    } catch (error: any) {
      Alert.alert(
        "Renewal Failed",
        error.response?.data?.message || "Could not renew pass. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const fee = passInfo.renewalFee || 25;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Travel Pass</Text>
        <Text style={styles.headerSubtitle}>Digital Identification & Access Card</Text>
      </View>

      <View style={styles.passCard}>
        <View style={styles.passTop}>
          <Text style={styles.passAppName}>Travel Optix</Text>
          <Text style={styles.passType}>PREMIUM PASS</Text>
        </View>

        <View style={styles.passDivider} />

        <View style={styles.passInfo}>
          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Pass ID</Text>
            <Text style={styles.passInfoValue}>{passId}</Text>
          </View>

          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Holder</Text>
            <Text style={styles.passInfoValue}>{fullName}</Text>
          </View>

          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Email</Text>
            <Text style={styles.passInfoValue} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Role</Text>
            <Text style={styles.passInfoValue}>
              {role.replace(/_/g, " ")}
            </Text>
          </View>

          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Status</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={passInfo.isExpired ? styles.statusExpired : styles.statusActive}>
                {passInfo.isExpired ? "EXPIRED" : "ACTIVE"}
              </Text>
            )}
          </View>

          <View style={styles.passRow}>
            <Text style={styles.passInfoLabel}>Expires</Text>
            <Text style={styles.expiryDate}>
              {loading ? "Loading..." : formatDate(passInfo.passExpiryDate)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What Your Pass Includes</Text>

      <View style={styles.benefitCard}>
        <Text style={styles.benefitTitle}>Attractions Access</Text>
        <Text style={styles.benefitDesc}>Book and enjoy registered tourist attractions across Ghana.</Text>
      </View>

      <View style={styles.benefitCard}>
        <Text style={styles.benefitTitle}>Event Bookings</Text>
        <Text style={styles.benefitDesc}>Access to local events and cultural festivals.</Text>
      </View>

      <View style={styles.benefitCard}>
        <Text style={styles.benefitTitle}>Booking Management</Text>
        <Text style={styles.benefitDesc}>Track all your bookings in one place.</Text>
      </View>

      <TouchableOpacity style={styles.renewButton} onPress={openRenewModal}>
        <Text style={styles.renewButtonText}>
          Renew Travel Pass — GHS {fee.toFixed(2)}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Renewal extends your pass by 1 year from today (or from your current expiry date if still active).
      </Text>

      <View style={styles.bottomSpace} />

      {/* ─── Renewal Modal ─────────────────────────────────── */}
      {showRenewModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renew Travel Pass</Text>

            <View style={styles.feeBox}>
              <Text style={styles.feeLabel}>Renewal Fee</Text>
              <Text style={styles.feeAmount}>GHS {fee.toFixed(2)}</Text>
              <Text style={styles.feeNote}>Valid for 1 year</Text>
            </View>

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  paymentMethod === "MOBILE_MONEY" && styles.selectedMethod,
                ]}
                onPress={() => setPaymentMethod("MOBILE_MONEY")}
              >
                <Text
                  style={[
                    styles.methodText,
                    paymentMethod === "MOBILE_MONEY" && styles.selectedMethodText,
                  ]}
                >
                  Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  paymentMethod === "CARD" && styles.selectedMethod,
                ]}
                onPress={() => setPaymentMethod("CARD")}
              >
                <Text
                  style={[
                    styles.methodText,
                    paymentMethod === "CARD" && styles.selectedMethodText,
                  ]}
                >
                  Card
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === "MOBILE_MONEY" ? (
              <>
                <Text style={styles.label}>Provider</Text>
                <View style={styles.providerRow}>
                  {["MTN", "Vodafone", "AirtelTigo"].map((provider) => (
                    <TouchableOpacity
                      key={provider}
                      style={[
                        styles.providerButton,
                        mobileProvider === provider && styles.selectedProviderButton,
                      ]}
                      onPress={() => setMobileProvider(provider)}
                    >
                      <Text
                        style={[
                          styles.providerText,
                          mobileProvider === provider && styles.selectedProviderText,
                        ]}
                      >
                        {provider}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0240000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </>
            ) : (
              <>
                <Text style={styles.demoWarning}>
                  Demo only — do not enter a real card number.
                </Text>

                <Text style={styles.label}>Card Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Demo User"
                  placeholderTextColor="#9CA3AF"
                  value={cardHolderName}
                  onChangeText={setCardHolderName}
                />

                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4111 1111 1111 1111"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />

                <View style={styles.cardDetailsRow}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Expiry</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12/30"
                      placeholderTextColor="#9CA3AF"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={setCardCvv}
                    />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.payButton, processing && styles.payButtonDisabled]}
              disabled={processing}
              onPress={handleRenew}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pay GHS {fee.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeRenewModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: "#FFFFFF" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },

  passCard: { margin: 24, backgroundColor: "#1E3A5F", borderRadius: 16, padding: 24 },
  passTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  passAppName: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  passType: { color: "#94A3B8", fontSize: 12, backgroundColor: "#2D4E6F", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  passDivider: { height: 1, backgroundColor: "#2D4E6F", marginVertical: 16 },
  passInfo: { gap: 14 },
  passRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  passInfoLabel: { color: "#94A3B8", fontSize: 14 },
  passInfoValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  statusActive: { color: "#4ADE80", fontWeight: "700", fontSize: 15 },
  statusExpired: { color: "#F87171", fontWeight: "700", fontSize: 15 },
  expiryDate: { color: "#FBBF24", fontWeight: "700", fontSize: 15 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", paddingHorizontal: 24, marginBottom: 12 },

  benefitCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 24, marginBottom: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  benefitTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 6 },
  benefitDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },

  renewButton: { backgroundColor: "#2563EB", marginHorizontal: 24, marginTop: 10, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  renewButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  note: { textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 10, paddingHorizontal: 40, marginBottom: 30 },

  bottomSpace: { height: 40 },

  // ─── Modal ─────────────────────────────────
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: "#111827" },

  feeBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  feeLabel: { color: "#2563EB", fontSize: 13 },
  feeAmount: { fontSize: 28, fontWeight: "bold", color: "#1E3A5F", marginVertical: 4 },
  feeNote: { color: "#6B7280", fontSize: 12 },

  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 10, marginBottom: 6 },

  methodRow: { flexDirection: "row", gap: 10 },
  methodButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: "#E5E7EB" },
  selectedMethod: { backgroundColor: "#2563EB" },
  methodText: { color: "#4B5563", fontSize: 13, fontWeight: "700" },
  selectedMethodText: { color: "#FFFFFF" },

  providerRow: { flexDirection: "row", gap: 7, marginBottom: 4 },
  providerButton: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  selectedProviderButton: { backgroundColor: "#DBEAFE", borderWidth: 1, borderColor: "#2563EB" },
  providerText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  selectedProviderText: { color: "#2563EB" },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 4,
  },

  demoWarning: {
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    marginBottom: 10,
  },

  cardDetailsRow: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },

  payButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  cancelButton: { marginTop: 10, paddingVertical: 10, alignItems: "center" },
  cancelButtonText: { color: "#DC2626", fontSize: 14, fontWeight: "600" },
});