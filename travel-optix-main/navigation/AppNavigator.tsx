import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from "../types";
import { useAuthStore } from "../store/authStore";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Tourist Screens
import HomeScreen from "../screens/traveler/HomeScreen";
import TravelPassScreen from "../screens/traveler/TravelPassScreen";
import BookingScreen from "../screens/traveler/BookingScreen";
import EventsScreen from "../screens/traveler/EventsScreen";
import AttractionsScreen from "../screens/traveler/AttractionsScreen";
import TourGuidesScreen from "../screens/traveler/TourGuidesScreen";
import ProfileScreen from "../screens/traveler/ProfileScreen";
import PaymentsScreen from "../screens/traveler/PaymentsScreen";

// ✅ Transport screen
import TransportScreen from "../screens/traveler/TransportScreen";

// ✅ New support screens
import NotificationsScreen from "../screens/traveler/NotificationsScreen";
import PrivacyPolicyScreen from "../screens/traveler/PrivacyPolicyScreen";
import HelpSupportScreen from "../screens/traveler/HelpSupportScreen";

// Guardian Screen
import ApprovalDashboard from "../screens/guardian/ApprovalDashboard";

// Admin Screens
import AdminDashboard from "../screens/admin/AdminDashboard";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminBookingsScreen from "../screens/admin/AdminBookingsScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function TouristTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="TravelPass"
        component={TravelPassScreen}
        options={{
          title: "My Pass",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="passport" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Bookings"
        component={BookingScreen}
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-check" size={size - 2} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="party-popper" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens */}
      <MainTab.Screen
        name="Attractions"
        component={AttractionsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <MainTab.Screen
        name="Guides"
        component={TourGuidesScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <MainTab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      {/* ✅ Transport added as hidden tab */}
      <MainTab.Screen
        name="Transport"
        component={TransportScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : isAdmin ? (
          <>
            <RootStack.Screen name="Admin" component={AdminDashboard} />
            <RootStack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <RootStack.Screen name="AdminBookings" component={AdminBookingsScreen} />
          </>
        ) : (
          <RootStack.Screen name="Main" component={TouristTabNavigator} />
        )}

        <RootStack.Screen name="Guardian" component={ApprovalDashboard} />

        {/* Support screens */}
        <RootStack.Screen name="Notifications" component={NotificationsScreen} />
        <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <RootStack.Screen name="HelpSupport" component={HelpSupportScreen} />
        
        {/* ✅ Transport registered in RootStack too */}
        <RootStack.Screen name="Transport" component={TransportScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
});