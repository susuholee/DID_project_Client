"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/Store/userStore";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const { setUser, setIsLoggedIn } = useUserStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // API 요청 제거 - 더미 데이터로 처리
        console.log("더미 카카오 사용자 정보 생성");
        
        // 사용자 정보 추출 및 상태 업데이트
        const userData = {
          id: 1,
          nickname: "카카오 사용자",
          profileImage: null,
          thumbnailImage: null
        };
        
        setUser(userData);
        setIsLoggedIn(true);
        
        // 토큰 확인 후 무조건 signup/did로 이동
        router.replace("/signup/did");
        
      } catch (error) {
        console.error("카카오 로그인 처리 오류:", error);
        router.replace("/login?error=auth_failed");
      }
    };

    checkAuth();
  }, []);

  return <p>카카오 로그인 처리 중...</p>;
}