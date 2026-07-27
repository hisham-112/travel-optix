import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.lastUpdated}>Last updated: January 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          When you use Travel Optix, we collect information you provide directly, including
          your full name, email address, phone number, nationality, passport number, and
          date of birth. We also collect booking history, payment records, and emergency
          contact details you choose to add.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Your information is used to process bookings, facilitate payments, connect you
          with tour guides and host families, send booking confirmations and updates, and
          ensure your safety through our emergency contact and guardian alert features.
        </Text>

        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We share relevant booking details with tour guides, host families, and attraction
          operators strictly to fulfil your bookings. We do not sell your personal
          information to third parties. Payment information is processed securely and is
          not stored on our servers in raw form.
        </Text>

        <Text style={styles.sectionTitle}>4. Emergency Contacts & Guardian Alerts</Text>
        <Text style={styles.paragraph}>
          For certain bookings (such as event attendance), we may notify your designated
          emergency contact or guardian for your safety. This information is only used for
          safety purposes and is never shared beyond what is necessary.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your account and booking information for as long as your account is
          active, or as needed to comply with legal obligations, resolve disputes, and
          enforce our agreements.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, correct, or request deletion of your personal
          information at any time. To exercise these rights, please contact us using the
          details in the Help & Support section of this app.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures, including encrypted
          authentication and secure data storage, to protect your personal information
          from unauthorized access, alteration, or disclosure.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any
          material changes through the app or via email.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy or how your data is handled,
          please reach out via the Help & Support section of this app.
        </Text>

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

  content: { flex: 1 },
  contentInner: { padding: 24 },

  lastUpdated: { fontSize: 12, color: "#9CA3AF", marginBottom: 20, fontStyle: "italic" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
  },

  bottomSpace: { height: 40 },
});