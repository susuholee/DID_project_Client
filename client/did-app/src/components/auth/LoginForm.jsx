"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";
import axios from "axios";
import api from "@/lib/axios";

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
      const loginUser = await api.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`,
        {
          userid: userId,
          password,
        },
        { withCredentials: true }
      );

      const { state } = loginUser.data;
     
     
      if (state === 200) {
        try {
          const userResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
            { withCredentials: true }
          );
          
          if (userResponse.data.state === 200) {
            const userData = Array.isArray(userResponse.data.data) 
              ? userResponse.data.data[0] 
              : userResponse.data.data;
            
              setUser(userData, "normal");
           
              const currentState = useUserStore.getState();
              router.push("/dashboard");
        
          } else {
            showErrorModal("사용자 정보를 불러오는데 실패했습니다.");
          }
        } catch (error) {
          showErrorModal("사용자 정보 조회 중 오류가 발생했습니다.");
        }
      } else {
       
        showErrorModal("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      
    
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
    
  
  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/auth`;
  };
    
  return (
    <>
      <div className="w-full max-w-sm mx-auto rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/50 p-4 sm:p-5 md:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-cyan-700">Sealium</span>
          </div>
          <h1 className="text-xl sm:text-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-1 sm:mb-2">로그인</h1>
          <p className="text-gray-600 text-sm px-2">디지털 수료증 발급 플랫폼에 오신 것을 환영합니다</p>
        </div>
        
     
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4" noValidate>
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm text-gray-700">
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
            <label className="block text-xs sm:text-sm text-gray-700">
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
            className="mt-3 sm:mt-4 w-full h-[44px] text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none"
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

      
        <div className="flex items-center my-4 sm:my-5">
          <div className="flex-grow border-b border-gray-300"></div>
          <span className="px-3 text-xs bg-white rounded-full text-gray-500">또는</span>
          <div className="flex-grow border-b border-gray-300"></div>
        </div>

     
        <div className="space-y-3">
          <button 
            onClick={handleKakaoLogin} 
            className="block w-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
              <img
                src="/images/kakao_login.png"
                alt="카카오 로그인"
                className="w-full h-[44px] sm:h-[48px] object-cover object-center"
              />
            </div>
          </button>
        </div>

      
        <div className="mt-4 sm:mt-5 text-center">
          <p className="text-xs text-gray-600 mb-2">
            아직 계정이 없으신가요?
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-cyan-600 hover:text-white hover:bg-cyan-600 border-2 border-cyan-600 rounded-lg transition-all duration-200 group text-sm"
          >
            <span>회원가입</span>
            <div className="w-3 h-3 bg-cyan-600 group-hover:bg-white rounded-full group-hover:scale-110 transition-all duration-200"></div>
          </Link>
        </div>
      </div>

      {showModal && (
        <Modal isOpen={showModal} message={modalMessage} onClose={closeModal} />
      )}
    </>
  );
}