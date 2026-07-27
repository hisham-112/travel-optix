import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LoginResult = {
  success: boolean;
  message?: string;
};

type AuthState = {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;

  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const TOKEN_KEY = "travel_optix_token";
const USER_KEY = "travel_optix_user";

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  token: null,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      // Backend response format:
      // { data: { email, fullName, role, token, ... } }
      const userData = response.data.data;
      const token = userData.token;

      if (!token) {
        return {
          success: false,
          message: "Login succeeded but no token was returned.",
        };
      }

      const user: User = {
        id: String(userData.userId || userData.id || ""),
        name: userData.fullName || userData.name || "Traveler",
        email: userData.email,
        role: userData.role || "TOURIST",
      };

      // Save permanently on the device
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      // Save for the current app session
      set({
        isLoggedIn: true,
        token,
        user,
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      console.log(
        "Login error:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed. Please check your email and password.",
      };
    }
  },

  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;

        set({
          isLoggedIn: true,
          token,
          user,
          isLoading: false,
        });
      } else {
        set({
          isLoggedIn: false,
          token: null,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.log("Could not restore saved session:", error);

      set({
        isLoggedIn: false,
        token: null,
        user: null,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

    set({
      isLoggedIn: false,
      token: null,
      user: null,
      isLoading: false,
    });
  },
}));