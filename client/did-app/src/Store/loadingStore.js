import { create } from 'zustand';

export const useLoadingStore = create((set) => ({
  // 로딩 상태
  isLoading: false,
  loadingMessage: 'Sealium 로딩 중...',
  loadingSize: 'md',

  // 로딩 시작
  startLoading: (message = 'Sealium 로딩 중...', size = 'md') => {
    set({
      isLoading: true,
      loadingMessage: message,
      loadingSize: size
    });
  },

  // 로딩 종료
  stopLoading: () => {
    set({
      isLoading: false,
      loadingMessage: 'Sealium 로딩 중...',
      loadingSize: 'md'
    });
  },

  // 로딩 메시지만 변경
  setLoadingMessage: (message) => {
    set({ loadingMessage: message });
  },

  // 로딩 크기만 변경
  setLoadingSize: (size) => {
    set({ loadingSize: size });
  }
}));
