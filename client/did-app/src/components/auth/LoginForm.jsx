"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";
import axios from "axios";

export default function LoginForm() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const { setUser, setToken } = useUserStore();
  const router = useRouter();

  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 입력값 검증
    if (!userId.trim()) {
      showErrorModal("아이디를 입력해주세요.");
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      showErrorModal("비밀번호를 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      // 로그인 요청
      const loginUser = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`,
        {
          userid: userId,
          password,
        },
        { withCredentials: true }
      );

      const { state } = loginUser.data;
      console.log("로그인 응답:", loginUser.data);
      
      // 로그인 성공 처리
      if (state === 200) {
        try {
          // 로그인 성공 후 사용자 정보 조회
          const userResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
            { withCredentials: true }
          );
          
          if (userResponse.data.state === 200) {
            const userData = Array.isArray(userResponse.data.data) 
              ? userResponse.data.data[0] 
              : userResponse.data.data;
            
              setUser(userData, "normal");
              console.log("사용자 정보 저장 완료:", userData);
            
              const currentState = useUserStore.getState();
              console.log("현재 전역 상태:", currentState);
              router.push("/dashboard");
        
          } else {
            showErrorModal("사용자 정보를 불러오는데 실패했습니다.");
          }
        } catch (error) {
          console.error("사용자 정보 조회 실패:", error);
          showErrorModal("사용자 정보 조회 중 오류가 발생했습니다.");
        }
      } else {
        // 로그인 실패 - 프론트엔드 메시지 사용
        showErrorModal("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      
      // 에러 상황별 프론트엔드 메시지 처리
      if (error.response) {
        if (error.response.status === 401) {
          showErrorModal("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else if (error.response.status === 404) {
          showErrorModal("존재하지 않는 사용자입니다.");
        } else if (error.response.status >= 500) {
          showErrorModal("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          showErrorModal("로그인에 실패했습니다. 다시 시도해주세요.");
        }
      } else if (error.request) {
        showErrorModal("서버와 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
      } else {
        showErrorModal("예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };
    
  // 카카오 로그인 버튼 클릭 시
  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/auth`;
  };
    
  return (
    <>
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-gray-200 shadow-lg p-8">
          <h1 className="text-black text-3xl font-extrabold mb-8">로그인</h1>
          
          {/* 일반 로그인 (아이디 / 비밀번호) */}
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                아이디
              </label>
              <Input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력해주세요"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">
                비밀번호
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-[48px] rounded-xl bg-black hover:bg-rose-500 cursor-pointer text-white text-lg"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-b border-gray-500"></div>
            <div className="flex-grow border-b border-gray-500"></div>
          </div>

          {/* 카카오 로그인 버튼 */}
          <div className="space-y-2">
            <button onClick={handleKakaoLogin} className="block w-full cursor-pointer">
              <img
                src="/images/kakao_login.png"
                alt="카카오 로그인"
                className="w-full h-[48px] object-cover rounded-xl"
              />
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="text-indigo-500 hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </main>

      {showModal && (
        <Modal isOpen={showModal} message={modalMessage} onClose={closeModal} />
      )}
    </>
  );
}