// src/store/useUserStore.js
import { create } from "zustand";

const useUserStore = create((set) => ({
  user: null,
  userType: null,
  notifications: [], // ✅ 항상 배열 보장

  setUser: (userData, type) =>
    set(() => {
      const data = { ...userData, type: type || "local" };
      localStorage.setItem("currentUser", JSON.stringify(data));
      return { user: data, userType: data.type };
    }),

  loadUser: () =>
    set(() => {
      try {
        const raw = localStorage.getItem("currentUser");
        if (raw) {
          const userData = JSON.parse(raw);
          const notiRaw =
            localStorage.getItem(`notifications_${userData.id}`) || "[]";
          return {
            user: userData,
            userType: userData.type || "local",
            notifications: JSON.parse(notiRaw) || [],
          };
        }
      } catch (e) {
        console.warn("failed to load user", e);
      }
      return { user: null, userType: null, notifications: [] };
    }),

  logout: () =>
    set(() => {
      localStorage.removeItem("currentUser");
      return { user: null, userType: null, notifications: [] };
    }),

  addNotification: (userId, newNotification) =>
    set((state) => {
      const updated = [...(state.notifications || []), newNotification]; 
      localStorage.setItem(
        `notifications_${userId}`,
        JSON.stringify(updated)
      );
      return { notifications: updated };
    }),

  setNotifications: (userId, newList) =>
    set(() => {
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(newList));
      return { notifications: newList || [] }; 
    }),
}));

export default useUserStore;
