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


  const showLoading = useCallback((message = 'Sealium 로딩 중...', size = 'md') => {
    startLoading(message, size);
  }, [startLoading]);

 
  const hideLoading = useCallback(() => {
    stopLoading();
  }, [stopLoading]);

 
  const updateMessage = useCallback((message) => {
    setLoadingMessage(message);
  }, [setLoadingMessage]);

  
  const updateSize = useCallback((size) => {
    setLoadingSize(size);
  }, [setLoadingSize]);


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
    isLoading,
    loadingMessage,
    loadingSize,
    
    showLoading,
    hideLoading,
    updateMessage,
    updateSize,
    withLoading
  };
};

