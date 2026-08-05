import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://100.112.25.176:8080/api" // Replace with your actual API URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT token automatically to protected requests.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("travel_optix_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;