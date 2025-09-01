"use client";
import { useEffect } from "react";

export default function KakaoCallbackPage() {
  useEffect(() => {
    const kakaoUser = {
      id: "kakao_123",
      nickname: "홍길동",
      profile:
        "https://photo.coolenjoy.co.kr/data/editor/1708/20170815064432_zsqcznqx.png",
      isKakaoUser: true, // ← 카카오 로그인 플래그
    };
    localStorage.clear();
    // 전체 사용자 목록에서 동  일 ID 찾기
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const existingUserIndex = users.findIndex((u) => u.id === kakaoUser.id);
    let mergedUser;
    let isExistingUser = false;

    if (existingUserIndex !== -1) {
      // 기존 계정 → hasDID가 false여도 대시보드로
      isExistingUser = true;
      mergedUser = { ...users[existingUserIndex], ...kakaoUser };
      users[existingUserIndex] = mergedUser;
    } else {
      // 신규 계정 → hasDID 기본 false
      mergedUser = { ...kakaoUser, hasDID: false };
      users.push(mergedUser);
    }

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(mergedUser));

    // 기존 계정이면 무조건 대시보드
    if (isExistingUser) {
      window.location.href = "/dashboard";
    } else if (mergedUser.hasDID) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/signup/did";
    }
  }, []);

  return <p>카카오 로그인 처리 중...</p>;
}
