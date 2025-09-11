import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null, 
      isLoggedIn: false, 
      notifications: [], // 기본값 배열
    
      // 사용자 정보 저장
      setUser: (userData) => {
        set({ user: userData, isLoggedIn: true });
      },
    
      // 로그아웃 시 상태 초기화
      logout: () => {
        set({ user: null, isLoggedIn: false, notifications: [] });
      },
    
      // 수정된 addNotification - 안전한 배열 처리
      addNotification: (userId, notification) => {
        set((state) => {
          // state.notifications가 배열인지 확인하고 안전하게 처리
          const currentNotifications = Array.isArray(state.notifications) 
            ? state.notifications 
            : [];
            
          return {
            notifications: [...currentNotifications, notification]
          };
        });
      },
    
      // 새로운 배열이나 콜백 함수를 인자로 받아 알림을 업데이트합니다.
      setNotifications: (newListOrUpdater) => {
        if (typeof newListOrUpdater === 'function') {
          set((state) => {
            const currentNotifications = Array.isArray(state.notifications) 
              ? state.notifications 
              : [];
            return { notifications: newListOrUpdater(currentNotifications) };
          });
        } else {
          set({ notifications: Array.isArray(newListOrUpdater) ? newListOrUpdater : [] });
        }
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({
        notifications: Array.isArray(state.notifications) ? state.notifications : [],
      }),
      // 복원 시 안전성 보장
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.notifications)) {
          state.notifications = [];
        }
      },
    }
  )
);

export default useUserStore;