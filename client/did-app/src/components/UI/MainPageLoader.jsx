'use client';

import { useLoadingStore } from '@/Store/loadingStore';
import SealiumLoader from './SealiumLoader';

export default function MainPageLoader() {
  const { isLoading, loadingMessage, loadingSize } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-200">
      {/* Sealium 로고 */}
      <div className="mb-8">
        <img 
          src="/icons/sealium_logo.png" 
          alt="Sealium" 
          className="w-24 h-24 animate-pulse"
        />
      </div>

      {/* 플랫폼 이름 */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent mb-2">
          Sealium
        </h1>
        <p className="text-xl">
          검증 가능한 자격증명 발급 플랫폼
        </p>
      </div>

      {/* 로딩 애니메이션 */}
      <SealiumLoader 
        message={loadingMessage} 
        size={loadingSize}
        className=""
      />
    </div>
  );
}
