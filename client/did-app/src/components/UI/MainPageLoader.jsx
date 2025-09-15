'use client';

import { useLoadingStore } from '@/Store/loadingStore';
import SealiumLoader from './SealiumLoader';

export default function MainPageLoader() {
  const { isLoading, loadingMessage, loadingSize } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-300">
      <div className="mb-8">
        <img 
          src="/icons/sealium_logo.png" 
          alt="Sealium" 
          className="w-24 h-24 animate-pulse"
        />
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-cyan-500 text-5xl mb-2">
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
