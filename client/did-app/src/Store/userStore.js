import { create } from "zustand";

const useUserStore = create((set) => ({
  user: null,
  userType: null,
  token: null,
  notifications: [],
  isLoggedIn: false,

  // 통합된 setUser 함수
  setUser: (userData, type = "local") =>
    set(() => {
      const data = { ...userData, type };
      return { 
        user: data, 
        userType: type,
        isLoggedIn: true
      };
    }),

  setToken: (tokenValue) =>
    set(() => ({
      token: tokenValue,
    })),

  setIsLoggedIn: (status) =>
    set(() => ({
      isLoggedIn: status,
    })),

  logout: () =>
    set(() => ({
      user: null,
      userType: null,
      token: null,
      notifications: [],
      isLoggedIn: false,
    })),

  addNotification: (userId, newNotification) =>
    set((state) => {
      const updated = [...(state.notifications || []), newNotification];
      return { notifications: updated };
    }),

  setNotifications: (userId, newList) =>
    set(() => {
      return { notifications: newList || [] };
    }),

  updateUser: (updatedData) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedData };
      return { user: updatedUser };
    }),
}));

export default useUserStore;