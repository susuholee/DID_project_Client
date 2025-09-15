import { create } from 'zustand';

export const useLoadingStore = create((set) => ({

  isLoading: false,
  loadingMessage: 'Sealium 로딩 중...',
  loadingSize: 'md',

 
  startLoading: (message = 'Sealium 로딩 중...', size = 'md') => {
    set({
      isLoading: true,
      loadingMessage: message,
      loadingSize: size
    });
  },

 
  stopLoading: () => {
    set({
      isLoading: false,
      loadingMessage: 'Sealium 로딩 중...',
      loadingSize: 'md'
    });
  },

 
  setLoadingMessage: (message) => {
    set({ loadingMessage: message });
  },


  setLoadingSize: (size) => {
    set({ loadingSize: size });
  }
}));
