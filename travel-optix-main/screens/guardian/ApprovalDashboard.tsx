import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type ApprovalRequest = {
  id: string;
  minorName: string;
  eventName: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
};

const requests: ApprovalRequest[] = [
  { id: "1", minorName: "Ama Doe", eventName: "Youth Dance Showcase", date: "July 12, 2026", status: "Pending" },
  { id: "2", minorName: "Kofi Doe", eventName: "Community Night Walk", date: "July 25, 2026", status: "Pending" },
  { id: "3", minorName: "Ama Doe", eventName: "Adae Festival", date: "July 5, 2026", status: "Approved" },
  { id: "4", minorName: "Kofi Doe", eventName: "Ghana Food Festival", date: "July 8, 2026", status: "Rejected" },
];

const statusColor: Record<ApprovalRequest["status"], string> = {
  Pending: "#D97706",
  Approved: "#16A34A",
  Rejected: "#DC2626",
};

export default function ApprovalDashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guardian Approvals</Text>
        <Text style={styles.headerSubtitle}>Manage your minors' event requests</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
          <Text style={styles.summaryCount}>2</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#DCFCE7" }]}>
          <Text style={styles.summaryCount}>1</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={styles.summaryCount}>1</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Approval Requests</Text>

      {requests.map((req) => (
        <View key={req.id} style={styles.requestCard}>
          <View style={styles.requestTop}>
            <Text style={styles.minorName}>{req.minorName}</Text>
            <Text style={[styles.status, { color: statusColor[req.status] }]}>
              {req.status}
            </Text>
          </View>
          <Text style={styles.eventName}>{req.eventName}</Text>
          <Text style={styles.eventDate}>{req.date}</Text>

          {req.status === "Pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveButton}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
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
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryCount: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  summaryLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  minorName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  status: { fontSize: 13, fontWeight: "600" },
  eventName: { fontSize: 14, color: "#374151", marginBottom: 4 },
  eventDate: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  approveButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  rejectText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
});
