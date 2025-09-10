import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      user: null, 
      isLoggedIn: false, 
      notifications: [],
    
      // 사용자 정보 저장
      setUser: (userData) => {
        set({ user: userData, isLoggedIn: true });
      },
    
      // 로그아웃 시 상태 초기화
      logout: () => {
        set({ user: null, isLoggedIn: false });
      },
    
      addNotification: (newNotification) => {
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
      },
    
   
      // 새로운 배열이나 콜백 함수를 인자로 받아 알림을 업데이트합니다.
      setNotifications: (newListOrUpdater) => {
        if (typeof newListOrUpdater === 'function') {
          set((state) => ({ notifications: newListOrUpdater(state.notifications) }));
        } else {
          set({ notifications: newListOrUpdater });
        }
      },
    }),
    {
      name: "notification-storage",

      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

export default useUserStore;