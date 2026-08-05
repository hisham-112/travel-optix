import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const FAQS = [
  {
    question: "How do I cancel a booking?",
    answer:
      "Go to the Bookings tab, find the booking you want to cancel, and tap 'Cancel Booking'. Cancelled bookings cannot be reversed.",
  },
  {
    question: "How do I pay for a booking?",
    answer:
      "After creating a booking, go to the Payments screen. Select the booking, choose Mobile Money or Card, and complete the payment.",
  },
  {
    question: "What is my Travel Pass?",
    answer:
      "Your Travel Pass is your digital identity within Travel Optix. It verifies you as a registered tourist and gives you access to attractions, events, and bookings. It renews annually for a small fee.",
  },
  {
    question: "How do emergency contacts work?",
    answer:
      "You can add emergency contacts to your profile. For certain bookings, your primary contact may be notified for safety purposes.",
  },
  {
    question: "I made a payment but my booking still shows pending. What do I do?",
    answer:
      "Pull down to refresh the Bookings screen. If the issue persists after a few minutes, contact support with your transaction reference.",
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@traveloptix.com?subject=Support Request");
  };

  const handleCall = () => {
    Linking.openURL("tel:+233200000000");
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/233200000000");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Contact Us</Text>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#2563EB" />
            <Text style={styles.contactLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQS.map((faq, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqTop}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqChevron}>{isExpanded ? "−" : "+"}</Text>
              </View>

              {isExpanded && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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

  content: { flex: 1, padding: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },

  contactRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  contactCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: { fontSize: 24 },
  contactLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },

  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  faqTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  faqChevron: { fontSize: 20, color: "#2563EB", fontWeight: "700" },
  faqAnswer: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 10,
    lineHeight: 19,
  },

  bottomSpace: { height: 40 },
});