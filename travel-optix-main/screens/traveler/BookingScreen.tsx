import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import api from "../../services/api";

// Must match paystack.callback-url in application.properties
const PAYSTACK_CALLBACK_PREFIX = "https://traveloptix.app/paystack/callback";

type Booking = {
  bookingId: number;
  bookingType?: string;
  scheduledDate?: string;
  status?: string;
  totalAmount?: number | string | null;
  notes?: string;
  referenceName?: string;
  referenceLocation?: string;
  referenceRegion?: string;
  referenceImage?: string;
};

type Payment = {
  paymentId: number;
  amount?: number | string | null;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionRef?: string;
  paidAt?: string;
  createdAt?: string;
  booking?: Booking;
};

type CheckoutMode = "SINGLE" | "BULK";

const COLORS = {
  background: "#F9FAFB",
  white: "#FFFFFF",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#EFF6FF",
  primarySoft2: "#DBEAFE",
  textDark: "#111827",
  textMedium: "#374151",
  textLight: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  green: "#16A34A",
  greenSoft: "#F0FDF4",
  red: "#DC2626",
  redSoft: "#FEF2F2",
  orange: "#D97706",
  orangeSoft: "#FEF3C7",
  purple: "#7C3AED",
};

const statusColors: Record<string, string> = {
  CONFIRMED: COLORS.green,
  PENDING: COLORS.orange,
  CANCELLED: COLORS.red,
  COMPLETED: COLORS.primary,
};

const statusBackgrounds: Record<string, string> = {
  CONFIRMED: COLORS.greenSoft,
  PENDING: COLORS.orangeSoft,
  CANCELLED: COLORS.redSoft,
  COMPLETED: COLORS.primarySoft,
};

function formatDate(dateValue?: string) {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function formatType(type?: string) {
  if (!type) return "Booking";

  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(amount?: number | string | null) {
  if (amount == null || amount === "") return "GHS 0.00";

  const parsed = parseFloat(String(amount));

  if (Number.isNaN(parsed)) return "GHS 0.00";

  return `GHS ${parsed.toFixed(2)}`;
}

function getAmountNumber(amount?: number | string | null) {
  if (amount == null || amount === "") return 0;

  const parsed = parseFloat(String(amount));

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getBookingTitle(booking: Booking) {
  return booking.referenceName || `${formatType(booking.bookingType)} Booking`;
}

function getBookingSubtitle(booking: Booking) {
  const locationLine = [booking.referenceLocation, booking.referenceRegion]
    .filter(Boolean)
    .join(", ");

  if (locationLine) return locationLine;

  if (booking.notes?.includes("Transport:")) {
    return booking.notes;
  }

  return formatType(booking.bookingType);
}

function getBookingIcon(type?: string) {
  const normalized = (type || "").toUpperCase();

  switch (normalized) {
    case "ATTRACTION":
      return "map-marker-radius";
    case "EVENT":
      return "party-popper";
    case "TRANSPORT":
      return "airplane-takeoff";
    case "TOUR_GUIDE":
      return "account-tie";
    case "HOST_FAMILY":
      return "home-heart";
    default:
      return "calendar-check";
  }
}

export default function BookingScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payReference, setPayReference] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("SINGLE");

  const loadData = useCallback(async () => {
    try {
      const [bookingRes, paymentRes] = await Promise.all([
        api.get("/tourist/bookings"),
        api.get("/tourist/payments"),
      ]);

      setBookings(bookingRes.data?.data || []);
      setPayments(paymentRes.data?.data || []);
    } catch (error: any) {
      console.log(
        "Bookings/payment load error:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Could not load bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const paidBookingIds = useMemo(() => {
    return new Set(
      payments
        .filter(
          (payment) =>
            (payment.paymentStatus || "").toUpperCase() === "SUCCESS"
        )
        .map((payment) => payment.booking?.bookingId)
        .filter((id): id is number => typeof id === "number")
    );
  }, [payments]);

  const isBookingPaid = useCallback(
    (booking: Booking) => paidBookingIds.has(booking.bookingId),
    [paidBookingIds]
  );

  const isPayable = useCallback(
    (booking: Booking) => {
      const status = (booking.status || "").toUpperCase();
      const amount = getAmountNumber(booking.totalAmount);

      return (
        amount > 0 &&
        status !== "CANCELLED" &&
        status !== "COMPLETED" &&
        !isBookingPaid(booking)
      );
    },
    [isBookingPaid]
  );

  const canCancel = (booking: Booking) => {
    const status = (booking.status || "").toUpperCase();

    return status !== "CANCELLED" && status !== "COMPLETED";
  };

  const unpaidBookings = useMemo(() => {
    return bookings.filter((booking) => isPayable(booking));
  }, [bookings, isPayable]);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const status = (booking.status || "").toUpperCase();

      if (activeFilter === "CANCELLED") {
        if (status !== "CANCELLED") return false;
      } else {
        if (status === "CANCELLED") return false;

        if (activeFilter !== "ALL" && status !== activeFilter) {
          return false;
        }
      }

      if (!query) return true;

      const searchable = [
        booking.referenceName,
        booking.referenceLocation,
        booking.referenceRegion,
        booking.bookingType,
        formatType(booking.bookingType),
        booking.status,
        booking.notes,
        formatDate(booking.scheduledDate),
        formatMoney(booking.totalAmount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [bookings, activeFilter, searchQuery]);

  const selectedBookings = useMemo(() => {
    return bookings.filter((booking) => selectedIds.has(booking.bookingId));
  }, [bookings, selectedIds]);

  const selectedTotal = useMemo(() => {
    return selectedBookings.reduce(
      (sum, booking) => sum + getAmountNumber(booking.totalAmount),
      0
    );
  }, [selectedBookings]);

  const selectedCount = selectedBookings.length;

  const toggleBookingSelection = (booking: Booking) => {
    if (!isPayable(booking)) {
      if (isBookingPaid(booking)) {
        Alert.alert("Already paid", "This booking has already been paid.");
      } else {
        Alert.alert(
          "Cannot select booking",
          "Only unpaid bookings with an amount can be selected."
        );
      }

      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(booking.bookingId)) {
        next.delete(booking.bookingId);
      } else {
        next.add(booking.bookingId);
      }

      return next;
    });
  };

  const paySingleBooking = async (booking: Booking) => {
    if (!isPayable(booking)) {
      if (isBookingPaid(booking)) {
        Alert.alert("Already paid", "This booking has already been paid.");
      } else {
        Alert.alert(
          "Cannot pay this booking",
          "This booking is either already paid, cancelled, completed, or has no amount."
        );
      }
      return;
    }

    setPayingBookingId(booking.bookingId);
    setProcessing(true);

    try {
      const response = await api.post("/tourist/payments/paystack/initialize", {
        bookingId: booking.bookingId,
      });

      const data = response.data?.data || {};

      if (!data.authorizationUrl) {
        throw new Error("No Paystack checkout URL returned.");
      }

      setCheckoutMode("SINGLE");
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
      setPayingBookingId(null);
    }
  };

  const selectAllUnpaid = () => {
    if (unpaidBookings.length === 0) {
      Alert.alert("No unpaid bookings", "There are no unpaid bookings to select.");
      return;
    }

    setSelectedIds(new Set(unpaidBookings.map((booking) => booking.bookingId)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleCancel = (booking: Booking) => {
    const label = getBookingTitle(booking);

    Alert.alert("Cancel Booking", `Cancel "${label}"?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => processCancel(booking.bookingId),
      },
    ]);
  };

  const processCancel = async (bookingId: number) => {
    setCancellingId(bookingId);

    try {
      const response = await api.patch(`/tourist/bookings/${bookingId}/cancel`);

      Alert.alert("Success", response.data?.message || "Booking cancelled.");

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });

      await loadData();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Could not cancel booking.";

      Alert.alert("Could not cancel", message);
    } finally {
      setCancellingId(null);
    }
  };

  const startBulkPayment = async () => {
    const bookingIds = Array.from(selectedIds);

    if (bookingIds.length === 0) {
      Alert.alert("Select bookings", "Please select at least one unpaid booking.");
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post("/tourist/payments/paystack/bulk/initialize", {
        bookingIds,
      });

      const data = response.data?.data || {};

      if (!data.authorizationUrl) {
        throw new Error("No Paystack checkout URL returned.");
      }

      setCheckoutMode("BULK");
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

  const verifyPayment = async (reference?: string | null) => {
    const ref = reference || payReference;

    if (!ref) return;

    setVerifying(true);

    try {
      if (checkoutMode === "BULK") {
        const response = await api.get(
          `/tourist/payments/paystack/bulk/verify/${ref}`
        );

        const verifiedPayments = response.data?.data || [];

        const allSuccess =
          Array.isArray(verifiedPayments) &&
          verifiedPayments.length > 0 &&
          verifiedPayments.every(
            (payment: Payment) =>
              (payment.paymentStatus || "").toUpperCase() === "SUCCESS"
          );

        if (allSuccess) {
          Alert.alert(
            "Payment Successful 🎉",
            "All selected bookings have been confirmed."
          );
          clearSelection();
        } else {
          Alert.alert(
            "Payment not completed",
            "No successful payment was found for this transaction."
          );
        }
      } else {
        const response = await api.get(
          `/tourist/payments/paystack/verify/${ref}`
        );

        const payment = response.data?.data;

        const status = (payment?.paymentStatus || "").toUpperCase();

        if (status === "SUCCESS") {
          Alert.alert(
            "Payment Successful 🎉",
            "Your booking is now confirmed."
          );
          clearSelection();
        } else {
          Alert.alert(
            "Payment not completed",
            "No successful payment was found for this transaction."
          );
        }
      }

      await loadData();
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
    if (navState.url && navState.url.startsWith(PAYSTACK_CALLBACK_PREFIX)) {
      setPayUrl(null);
      verifyPayment();
    }
  };

  const closeCheckout = () => {
    setPayUrl(null);

    if (payReference) {
      verifyPayment(payReference);
    }
  };

  const renderStatusBadge = (statusRaw?: string) => {
    const status = (statusRaw || "PENDING").toUpperCase();

    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusBackgrounds[status] || COLORS.primarySoft,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColors[status] || COLORS.textLight },
          ]}
        >
          {status}
        </Text>
      </View>
    );
  };

  const renderPaymentStatus = (statusRaw?: string) => {
    const status = (statusRaw || "PENDING").toUpperCase();

    const color =
      status === "SUCCESS"
        ? COLORS.green
        : status === "REFUNDED"
        ? COLORS.red
        : COLORS.orange;

    const background =
      status === "SUCCESS"
        ? COLORS.greenSoft
        : status === "REFUNDED"
        ? COLORS.redSoft
        : COLORS.orangeSoft;

    return (
      <View style={[styles.paymentStatusBadge, { backgroundColor: background }]}>
        <Text style={[styles.paymentStatusText, { color }]}>{status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.brandText}>TRAVEL OPTIX</Text>

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>My Bookings</Text>
              <Text style={styles.headerSubtitle}>
                {bookings.length} booking{bookings.length === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={22} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookings..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter === "ALL" ? "All" : formatType(filter)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <View style={styles.bulkActions}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bulkActionsScroll}
          >
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={selectAllUnpaid}
            >
              <Ionicons name="checkbox-outline" size={16} color={COLORS.primary} />
              <Text style={styles.bulkActionText}>Select unpaid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={clearSelection}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.red} />
              <Text style={[styles.bulkActionText, { color: COLORS.red }]}>
                Clear
              </Text>
            </TouchableOpacity>

            {selectedCount > 0 && (
              <TouchableOpacity
                style={[styles.payButtonSmall, processing && styles.disabled]}
                disabled={processing}
                onPress={startBulkPayment}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="card-outline" size={16} color={COLORS.white} />
                    <Text style={styles.payButtonSmallText}>
                      Pay {formatMoney(selectedTotal)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>
            {activeFilter === "CANCELLED"
              ? "Cancelled Bookings"
              : activeFilter === "ALL"
              ? "Your Bookings"
              : formatType(activeFilter)}
          </Text>
        </View>

        <View style={styles.list}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-clear-outline"
                size={42}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No bookings match "${searchQuery}".`
                  : activeFilter === "ALL"
                  ? "You don't have any active bookings yet."
                  : activeFilter === "CANCELLED"
                  ? "You don't have any cancelled bookings."
                  : `No ${activeFilter.toLowerCase()} bookings.`}
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => {
              const isSelected = selectedIds.has(booking.bookingId);
              const payable = isPayable(booking);
              const paid = isBookingPaid(booking);
              const isCancelling = cancellingId === booking.bookingId;
              const isPayingThis = payingBookingId === booking.bookingId && processing;

              const title = getBookingTitle(booking);
              const subtitle = getBookingSubtitle(booking);
              const iconName = getBookingIcon(booking.bookingType);
              const status = (booking.status || "").toUpperCase();

              return (
                <View
                  key={booking.bookingId}
                  style={[
                    styles.bookingCard,
                    isSelected && styles.selectedBookingCard,
                  ]}
                >
                  <View style={styles.cardAccent} />

                  <View style={styles.bookingTop}>
                    {status !== "CANCELLED" && (
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                          !payable && styles.checkboxDisabled,
                        ]}
                        onPress={() => toggleBookingSelection(booking)}
                      >
                        {isSelected ? (
                          <Ionicons name="checkmark" size={15} color={COLORS.white} />
                        ) : null}
                      </TouchableOpacity>
                    )}

                    <View style={styles.bookingIconBox}>
                      <MaterialCommunityIcons
                        name={iconName as any}
                        size={21}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle} numberOfLines={2}>
                        {title}
                      </Text>

                      <Text style={styles.bookingType} numberOfLines={1}>
                        {formatType(booking.bookingType)}
                      </Text>
                    </View>

                    {renderStatusBadge(booking.status)}
                  </View>

                  <Text style={styles.bookingSubtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>

                  <Text style={styles.dateText}>
                    Scheduled {formatDate(booking.scheduledDate)}
                  </Text>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountText}>
                      {formatMoney(booking.totalAmount)}
                    </Text>

                    {paid && (
                      <View style={styles.paidBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.green} />
                        <Text style={styles.paidBadgeText}>Paid</Text>
                      </View>
                    )}
                  </View>

                  {booking.notes ? (
                    <Text style={styles.notes} numberOfLines={2}>
                      {booking.notes}
                    </Text>
                  ) : null}

                  {status !== "CANCELLED" && (
                    <View style={styles.buttonRow}>
                      {payable && (
                        <TouchableOpacity
                          style={[styles.payButton, isPayingThis && styles.disabled]}
                          onPress={() => paySingleBooking(booking)}
                          disabled={isPayingThis}
                        >
                          {isPayingThis ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                          ) : (
                            <Text style={styles.payButtonText}>Pay Now</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {canCancel(booking) && (
                        <TouchableOpacity
                          style={[
                            styles.cancelButton,
                            isCancelling && styles.cancelButtonDisabled,
                          ]}
                          disabled={isCancelling}
                          onPress={() => handleCancel(booking)}
                        >
                          {isCancelling ? (
                            <ActivityIndicator color={COLORS.red} />
                          ) : (
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Payment History</Text>
        </View>

        <View style={styles.historyList}>
          {payments.length === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptySubtitle}>
                Your successful payments will appear here.
              </Text>
            </View>
          ) : (
            payments.map((payment) => (
              <View key={payment.paymentId} style={styles.historyCard}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={
                      (payment.paymentStatus || "").toUpperCase() === "SUCCESS"
                        ? "checkmark"
                        : "time-outline"
                    }
                    size={16}
                    color={
                      (payment.paymentStatus || "").toUpperCase() === "SUCCESS"
                        ? COLORS.green
                        : COLORS.orange
                    }
                  />
                </View>

                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    {formatType(payment.booking?.bookingType)} Payment
                  </Text>
                  <Text style={styles.historySubtitle} numberOfLines={1}>
                    {payment.booking?.referenceName ||
                      payment.booking?.notes ||
                      `Booking #${payment.booking?.bookingId || "—"}`}
                  </Text>
                  <Text style={styles.historyRef} numberOfLines={1}>
                    Ref: {payment.transactionRef || "—"}
                  </Text>
                </View>

                <View style={styles.historyRight}>
                  {renderPaymentStatus(payment.paymentStatus)}
                  <Text style={styles.historyAmount}>
                    {formatMoney(payment.amount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
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
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {payUrl && (
            <WebView
              source={{ uri: payUrl }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
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
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 34,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
    fontSize: 14,
  },
  header: {
    paddingTop: 58,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },
  brandText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  headerSubtitle: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    marginTop: 18,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.textDark,
    fontSize: 15,
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: "800",
  },
  activeFilterText: {
    color: COLORS.white,
  },
  bulkActions: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  bulkActionsScroll: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingRight: 4,
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bulkActionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  payButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  payButtonSmallText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  list: {
    paddingHorizontal: 20,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    marginTop: 8,
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: 4,
    color: COLORS.textLight,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  selectedBookingCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#F8FBFF",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: COLORS.primary,
  },
  bookingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxDisabled: {
    opacity: 0.45,
  },
  bookingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
  },
  bookingType: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  bookingSubtitle: {
    marginTop: 10,
    color: COLORS.textMedium,
    fontSize: 13,
    fontWeight: "700",
  },
  dateText: {
    marginTop: 3,
    color: COLORS.textLight,
    fontSize: 12,
  },
  amountRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountText: {
    color: COLORS.textDark,
    fontSize: 20,
    fontWeight: "900",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
  },
  notes: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  buttonRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  payButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  cancelButton: {
  flex: 1,
  backgroundColor: COLORS.red,
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: "center",
},
  cancelButtonDisabled: {
    opacity: 0.6,
  },
 cancelButtonText: {
  color: COLORS.white,
  fontSize: 14,
  fontWeight: "900",
},
  historyList: {
    paddingHorizontal: 20,
  },
  emptyHistoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "900",
  },
  historySubtitle: {
    marginTop: 2,
    color: COLORS.textLight,
    fontSize: 12,
  },
  historyRef: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  historyAmount: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webviewHeader: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webviewTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    fontWeight: "900",
  },
  webview: {
    flex: 1,
  },
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
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
    minWidth: 190,
  },
  verifyingText: {
    marginTop: 12,
    color: COLORS.textMedium,
    fontSize: 14,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.65,
  },
});