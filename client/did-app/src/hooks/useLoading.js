import { useCallback } from 'react';
import { useLoadingStore } from '@/Store/loadingStore';

export const useLoading = () => {
  const { 
    isLoading, 
    loadingMessage, 
    loadingSize,
    startLoading, 
    stopLoading, 
    setLoadingMessage, 
    setLoadingSize 
  } = useLoadingStore();

  // 로딩 시작
  const showLoading = useCallback((message = 'Sealium 로딩 중...', size = 'md') => {
    startLoading(message, size);
  }, [startLoading]);

  // 로딩 종료
  const hideLoading = useCallback(() => {
    stopLoading();
  }, [stopLoading]);

  // 로딩 메시지 변경
  const updateMessage = useCallback((message) => {
    setLoadingMessage(message);
  }, [setLoadingMessage]);

  // 로딩 크기 변경
  const updateSize = useCallback((size) => {
    setLoadingSize(size);
  }, [setLoadingSize]);

  // 비동기 작업을 감싸는 헬퍼 함수
  const withLoading = useCallback(async (asyncFunction, message = '처리 중...', size = 'md') => {
    try {
      showLoading(message, size);
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return {
    // 상태
    isLoading,
    loadingMessage,
    loadingSize,
    
    // 액션
    showLoading,
    hideLoading,
    updateMessage,
    updateSize,
    withLoading
  };
};
