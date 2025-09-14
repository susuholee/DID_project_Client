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
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-xl sm:rounded-2xl bg-white shadow-2xl border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-cyan-700">Sealium</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-1 sm:mb-2">로그인</h1>
            <p className="text-gray-600 text-xs px-2">디지털 자격증명 플랫폼에 오신 것을 환영합니다</p>
          </div>
          
          {/* 일반 로그인 (아이디 / 비밀번호) */}
          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4" noValidate>
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                아이디
              </label>
              <div className="relative">
                <Input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="아이디를 입력해주세요"
                  disabled={loading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 bg-white"
                />
                <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                비밀번호
              </label>
              <div className="relative">
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  disabled={loading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 bg-white"
                />
                <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-3 sm:mt-4 w-full h-[44px] rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 cursor-pointer text-white text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm">로그인 중...</span>
                </div>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center my-4 sm:my-6">
            <div className="flex-grow border-b border-gray-300"></div>
            <span className="px-3 text-xs text-gray-500 bg-white rounded-full">또는</span>
            <div className="flex-grow border-b border-gray-300"></div>
          </div>

          {/* 카카오 로그인 버튼 */}
          <div className="space-y-3">
            <button 
              onClick={handleKakaoLogin} 
              className="block w-full cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                <img
                  src="/images/kakao_login.png"
                  alt="카카오 로그인"
                  className="w-full h-[44px] object-cover"
                />
              </div>
            </button>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs text-gray-600 mb-2 sm:mb-3">
              아직 계정이 없으신가요?
            </p>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 font-semibold transition-colors duration-200 group text-sm"
            >
              <span>회원가입</span>
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
            </Link>
          </div>
        </div>
      </main>

      {showModal && (
        <Modal isOpen={showModal} message={modalMessage} onClose={closeModal} />
      )}
    </>
  );
}