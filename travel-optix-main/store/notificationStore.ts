import { create } from "zustand";
import api from "../services/api";

type NotificationStore = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  fetchUnreadCount: async () => {
    try {
      const response = await api.get("/tourist/notifications/unread-count");
      set({ unreadCount: response.data?.count ?? 0 });
    } catch (error: any) {
      console.log("Unread count error:", error.response?.data || error.message);
    }
  },
}));