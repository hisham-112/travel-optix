import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { AuthStackParamList } from "../../types";
import api from "../../services/api";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Register">;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GHANA_CARD_REGEX = /^GHA-\d{9}-\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_REGEX = /^0\d{9}$/;

function ConsentRow({
  checked,
  onToggle,
  text,
  onLinkPress,
  linkText,
}: {
  checked: boolean;
  onToggle: () => void;
  text: string;
  onLinkPress?: () => void;
  linkText?: string;
}) {
  return (
    <View style={styles.consentRow}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={styles.checkboxWrapper}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.consentTextWrapper}>
        <Text style={styles.consentText}>
          {text}{" "}
          {onLinkPress && linkText ? (
            <Text style={styles.consentLink} onPress={onLinkPress}>
              {linkText}
            </Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ghanaCard, setGhanaCard] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [nationality, setNationality] = useState("Ghanaian");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeData, setAgreeData] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");

  const [loading, setLoading] = useState(false);

  const validateStepOne = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!EMAIL_REGEX.test(email.trim()))
      return "Please enter a valid email address.";
    if (!PHONE_REGEX.test(phone.trim()))
      return "Phone number must be 10 digits starting with 0.";
    if (!GHANA_CARD_REGEX.test(ghanaCard.trim().toUpperCase()))
      return "Ghana Card must be in the format GHA-123456789-0";
    if (!address.trim()) return "Please enter your residential address.";
    if (!city.trim()) return "Please enter your city/town.";
    if (!region.trim()) return "Please enter your region.";
    if (!nationality.trim()) return "Please enter your nationality.";
    if (!DATE_REGEX.test(dateOfBirth.trim()))
      return "Date of birth must be YYYY-MM-DD.";
    if (password.length < 6)
      return "Your password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!agreeTerms) return "Please agree to the Terms of Service.";
    if (!agreePrivacy) return "Please agree to the Privacy Policy.";
    if (!agreeData)
      return "Please agree to the Data Collection & Processing policy.";
    return null;
  };

  const handleSendOtp = async () => {
    const error = validateStepOne();
    if (error) {
      Alert.alert("Check your details", error);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const res = await api.post("/auth/send-otp", {
        email: normalizedEmail,
      });

      setOtpHint(res.data?.message || "OTP sent. Check your email.");
      setOtp("");
      setStep(2);
    } catch (err: any) {
      Alert.alert(
        "Could not send code",
        err?.response?.data?.message ||
          err?.message ||
          "Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code you received.");
      return;
    }

    setLoading(true);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: "TOURIST",
      ghanaCardNumber: ghanaCard.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      region: region.trim(),
      nationality: nationality.trim(),
      dateOfBirth: dateOfBirth.trim(),
      otp: otp.trim(),
    };

    try {
      await api.post("/auth/register", payload);

      Alert.alert(
        "Account created 🎉",
        "Welcome to Travel Optix! Please log in.",
        [
          {
            text: "Go to Login",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Registration failed",
        err?.response?.data?.message ||
          err?.message ||
          "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const allConsentsGiven = agreeTerms && agreePrivacy && agreeData;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Travel Optix</Text>
        <Text style={styles.tagline}>Explore Ghana, your way</Text>

        <Text style={styles.pageTitle}>
          {step === 1 ? "Sign Up" : "Verify Email"}
        </Text>
        <Text style={styles.pageSubtitle}>
          {step === 1
            ? "Create your account to get started"
            : `Enter the 6-digit code sent to ${email.trim().toLowerCase()}`}
        </Text>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>1</Text>
          </View>
          <View
            style={[styles.stepLine, step === 2 && styles.stepLineActive]}
          />
          <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
        </View>

        {step === 1 ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="person-outline" size={14} color="#1E3A5F" />{" "}
                Personal Information
              </Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ama Mensah"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ama@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0240000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Ghana Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="GHA-123456789-0"
                placeholderTextColor="#9CA3AF"
                value={ghanaCard}
                onChangeText={(t) => setGhanaCard(t.toUpperCase())}
              />

              <Text style={styles.label}>Nationality</Text>
              <TextInput
                style={styles.input}
                placeholder="Ghanaian"
                placeholderTextColor="#9CA3AF"
                value={nationality}
                onChangeText={setNationality}
              />

              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1998-05-21"
                placeholderTextColor="#9CA3AF"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="location-outline" size={14} color="#1E3A5F" />{" "}
                Location Information
              </Text>

              <Text style={styles.label}>Residential Address</Text>
              <TextInput
                style={styles.input}
                placeholder="House number & street"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.label}>City / Town</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Accra"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.label}>Region</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Greater Accra"
                placeholderTextColor="#9CA3AF"
                value={region}
                onChangeText={setRegion}
              />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="lock-closed-outline" size={14} color="#1E3A5F" />{" "}
                Security
              </Text>

              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#1E3A5F" />{" "}
                Agreements
              </Text>

              <Text style={styles.consentNote}>
                Please read and agree to each of the following before continuing.
              </Text>

              <ConsentRow
                checked={agreeTerms}
                onToggle={() => setAgreeTerms((v) => !v)}
                text="I have read and agree to the"
                linkText="Terms of Service"
                onLinkPress={() =>
                  Alert.alert(
                    "Terms of Service",
                    "By using Travel Optix you agree to our terms including responsible use of the platform, accurate information submission, and compliance with Ghanaian tourism regulations."
                  )
                }
              />

              <ConsentRow
                checked={agreePrivacy}
                onToggle={() => setAgreePrivacy((v) => !v)}
                text="I have read and agree to the"
                linkText="Privacy Policy"
                onLinkPress={() => navigation.navigate("PrivacyPolicy" as any)}
              />

              <ConsentRow
                checked={agreeData}
                onToggle={() => setAgreeData((v) => !v)}
                text="I consent to the collection and processing of my personal data for booking and safety purposes."
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!allConsentsGiven || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={!allConsentsGiven || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  Continue — Verify Email →
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.otpCard}>
            <Ionicons name="mail-outline" size={40} color="#2563EB" />
            <Text style={styles.otpTitle}>Check your email</Text>
            <Text style={styles.otpSubtitle}>
              {otpHint ||
                `We sent a 6-digit code to ${email.trim().toLowerCase()}`}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="••••••"
              placeholderTextColor="#D1D5DB"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(t) =>
                setOtp(t.replace(/\D/g, "").slice(0, 6))
              }
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyAndRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  Verify & Create Account
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
              <Text style={styles.link}>Resend code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep(1)}
              disabled={loading}
            >
              <Text style={styles.link}>‹ Change my details</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: { backgroundColor: "#2563EB" },
  stepDotText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  stepLineActive: { backgroundColor: "#2563EB" },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    color: "#111827",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  link: {
    color: "#2563EB",
    textAlign: "center",
    fontSize: 14,
    marginTop: 12,
  },
  consentNote: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 14,
    lineHeight: 17,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  checkboxWrapper: { paddingTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  consentTextWrapper: { flex: 1 },
  consentText: { fontSize: 13, color: "#4B5563", lineHeight: 19 },
  consentLink: {
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
  },
  eyeBtn: { padding: 12 },
  otpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  otpSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  otpInput: {
    width: 180,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: "center",
    color: "#111827",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: { color: "#6B7280", fontSize: 14 },
  footerLink: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
});