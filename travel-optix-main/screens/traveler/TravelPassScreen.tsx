import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { WebView } from "react-native-webview";
import api from "../../services/api";

const PAYSTACK_CALLBACK_PREFIX = "https://traveloptix.app/paystack/callback";

type PassInfo = {
  passExpiryDate?: string;
  isExpired?: boolean;
  renewalFee?: number;
};

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
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payReference, setPayReference] = useState<string | null>(null);

  const fetchPassInfo = useCallback(async () => {
    try {
      const response = await api.get("/tourist/pass");
      setPassInfo(response.data?.data || {});
    } catch (error: any) {
      console.log("Pass info error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassInfo();
  }, [fetchPassInfo]);

  const fee = passInfo.renewalFee || 25;

  const handleRenew = async () => {
    Alert.alert(
      "Renew Travel Pass",
      `Renew your Travel Pass for GHS ${fee.toFixed(2)}?\n\nYou will be redirected to Paystack to complete payment securely.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue to Payment", onPress: startRenewalPayment },
      ]
    );
  };

  const startRenewalPayment = async () => {
    setProcessing(true);

    try {
      const response = await api.post(
        "/tourist/payments/paystack/initialize-travel-pass"
      );

      const data = response.data?.data || {};

      if (!data.authorizationUrl) {
        throw new Error("No Paystack checkout URL returned.");
      }

      setPayReference(data.reference);
      setPayUrl(data.authorizationUrl);
    } catch (error: any) {
      Alert.alert(
        "Could not start payment",
        error.response?.data?.message ||
          error.message ||
          "Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const verifyRenewal = async (reference?: string | null) => {
    const ref = reference || payReference;
    if (!ref) return;

    setVerifying(true);

    try {
      const response = await api.get(
        `/tourist/payments/paystack/verify-travel-pass/${ref}`
      );

      const status = (
        response.data?.data?.paymentStatus || ""
      ).toUpperCase();

      if (status === "SUCCESS") {
        Alert.alert(
          "Pass Renewed! 🎉",
          `Your Travel Pass has been renewed successfully.\n\nNew expiry: ${formatDate(
            response.data?.data?.newExpiryDate
          )}`
        );
        await fetchPassInfo();
      } else {
        Alert.alert(
          "Payment not completed",
          "No successful payment was found for this transaction."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Verification failed",
        error.response?.data?.message ||
          error.message ||
          "Could not verify payment."
      );
    } finally {
      setVerifying(false);
      setPayReference(null);
    }
  };

  const handleWebViewNav = (navState: { url?: string }) => {
    if (
      navState.url &&
      navState.url.startsWith(PAYSTACK_CALLBACK_PREFIX)
    ) {
      setPayUrl(null);
      verifyRenewal();
    }
  };

  const closeCheckout = () => {
    setPayUrl(null);
    if (payReference) {
      verifyRenewal(payReference);
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Travel Pass</Text>
          <Text style={styles.headerSubtitle}>
            Digital Identification & Access Card
          </Text>
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
                <Text
                  style={
                    passInfo.isExpired
                      ? styles.statusExpired
                      : styles.statusActive
                  }
                >
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
          <Text style={styles.benefitDesc}>
            Book and enjoy registered tourist attractions across Ghana.
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>Event Bookings</Text>
          <Text style={styles.benefitDesc}>
            Access to local events and cultural festivals.
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>Booking Management</Text>
          <Text style={styles.benefitDesc}>
            Track all your bookings in one place.
          </Text>
        </View>

        <View style={styles.renewBox}>
          <View style={styles.renewFeeRow}>
            <Text style={styles.renewFeeLabel}>Renewal Fee</Text>
            <Text style={styles.renewFeeAmount}>GHS {fee.toFixed(2)}</Text>
          </View>
          <Text style={styles.renewFeeNote}>
            Extends your pass by 1 year · Secured by Paystack
          </Text>

          <TouchableOpacity
            style={[
              styles.renewButton,
              processing && styles.renewButtonDisabled,
            ]}
            onPress={handleRenew}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.renewButtonText}>
                Renew Travel Pass with Paystack →
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={payUrl !== null}
        animationType="slide"
        onRequestClose={closeCheckout}
      >
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <Text style={styles.webviewTitle}>Paystack Checkout</Text>
            <TouchableOpacity onPress={closeCheckout} hitSlop={8}>
              <Text style={styles.webviewClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {payUrl && (
            <WebView
              source={{ uri: payUrl }}
              style={styles.webview}
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

      <Modal visible={verifying} transparent animationType="fade">
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },
  passCard: {
    margin: 24,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 24,
  },
  passTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passAppName: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  passType: {
    color: "#DBEAFE",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  passDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 16,
  },
  passInfo: { gap: 14 },
  passRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passInfoLabel: { color: "#DBEAFE", fontSize: 14 },
  passInfoValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  statusActive: { color: "#4ADE80", fontWeight: "700", fontSize: 15 },
  statusExpired: { color: "#F87171", fontWeight: "700", fontSize: 15 },
  expiryDate: { color: "#FBBF24", fontWeight: "700", fontSize: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  benefitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  benefitDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  renewBox: {
    margin: 24,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  renewFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  renewFeeLabel: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "600",
  },
  renewFeeAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563EB",
  },
  renewFeeNote: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 16,
  },
  renewButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  renewButtonDisabled: { opacity: 0.7 },
  renewButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomSpace: { height: 40 },
  webviewContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  webviewHeader: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webviewTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
  },
  webviewClose: { fontSize: 20, color: "#111827" },
  webview: { flex: 1 },
  webviewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
    minWidth: 190,
  },
  verifyingText: {
    marginTop: 12,
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
});