"use client";
import { useEffect } from "react";
import Link from "next/link";
import NotificationBell from "../UI/NotificationBell";
import useUserStore from "@/Store/userStore";

export default function ClientNav() {
  // zustand store에서 사용자 정보와 알림 가져오기
  const user = useUserStore((state) => state.user);
  const notifications = useUserStore((state) => state.notifications);
  const setNotifications = useUserStore((state) => state.setNotifications);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  useEffect(() => {
    // 로그인하지 않은 경우 테스트용 알림 데이터 설정
    if (!isLoggedIn || !user) {
      const testNotifications = [
        {
          id: 1,
          title: "새 보고서 등록됨",
          message: "2025년 8월 보고서가 업로드되었습니다.",
          ts: Date.now() - 1000 * 60 * 5,
          read: false,
        },
        {
          id: 2,
          title: "비밀번호 변경 완료",
          message: "계정 보안 강화를 위해 비밀번호를 변경했습니다.",
          ts: Date.now() - 1000 * 60 * 60 * 3,
          read: true,
        },
      ];
      setNotifications(user?.id || user?.userId, testNotifications);
    }
  }, [isLoggedIn, user]);

  return (
    <div className="fixed top-4 right-6 flex items-center gap-4 z-50">
      {/* 알림벨 */}
      <NotificationBell
        notifications={notifications}
        setNotifications={setNotifications}
      />

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
