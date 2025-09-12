"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import NotificationBell from "../UI/NotificationBell";
import useUserStore from "@/Store/userStore";

export default function ClientNav() {
  
  // zustand store에서 사용자 정보와 알림 가져오기
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

 

  return (
    <div className="fixed top-4 right-6 flex items-center gap-4 z-50">
      {/* 사용자 프로필 */}
      {user && isLoggedIn && (
        <Link href="/profile" className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
          {/* 프로필 사진 */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
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
                <span className="text-gray-600 font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              );
            })()}
          </div>
          
          {/* 사용자 이름 */}
          <span className="text-gray-800 font-medium">
            {user.nickName || user.nickname || user.userName || '사용자'}님
          </span>
        </Link>
      )}
    </div>
  );
}
