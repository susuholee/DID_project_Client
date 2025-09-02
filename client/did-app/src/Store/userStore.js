import { create } from "zustand";

const useUserStore = create((set) => ({
  user: null,
  userType: null,
  notifications: [],
  isLoggedIn: false, // 로그인 여부 추가

  setUser: (userData, type) =>
    set(() => {
      const data = { ...userData, type: type || "local" };
      return { user: data, userType: data.type };
    }),

  setIsLoggedIn: (status) =>
    set(() => ({
      isLoggedIn: status,
    })),

  logout: () =>
    set(() => {
      return {
        user: null,
        userType: null,
        notifications: [],
        isLoggedIn: false, // 로그아웃 시 false로 초기화
      };
    }),

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
