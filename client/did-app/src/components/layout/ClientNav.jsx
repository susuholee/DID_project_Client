"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useUserStore from "@/Store/userStore";

export default function ClientNav() {
  
  // zustand store에서 사용자 정보와 알림 가져오기
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

 

  return (
    <div className="fixed top-4 right-6 flex items-center gap-3 z-50">
      {/* 사용자 프로필 */}
      {user && isLoggedIn && (
        <div className="relative group">
          <Link href="/profile" className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl px-4 py-2.5 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 hover:border-cyan-200 group-hover:scale-105">
            {/* 프로필 사진 */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center ring-2 ring-white shadow-sm">
              {(() => {
                // 카카오 로그인 사용자
                if (user.type === 'kakao' || user.isKakaoUser) {
                  const profileImage = user.imgPath || user.kakaoData?.profile_image;
                  if (profileImage) {
                    return <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />;
                  }
                }
                
                // 일반 로그인 사용자
                if (user.imgPath || user.profile) {
                  return <img src={user.imgPath || user.profile} alt="프로필" className="w-full h-full object-cover" />;
                }
                
                // 기본 아바타 (이니셜)
                const displayName = user.nickName || user.nickname || user.userName || '사용자';
                return (
                  <span className="font-bold text-sm text-cyan-700">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                );
              })()}
            </div>
            
            {/* 사용자 정보 */}
            <div className="flex flex-col items-start">
              <span className="font-semibold text-sm leading-tight">
                {user.nickName || user.nickname || user.userName || '사용자'}
              </span>
              <span className="text-xs opacity-70">
                {user.type === 'kakao' ? '카카오 계정' : '일반 계정'}
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
