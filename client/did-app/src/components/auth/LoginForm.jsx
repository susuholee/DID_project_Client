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
  const { setUser } = useUserStore(); // setIsLoggedIn 제거 - setUser에서 자동 처리
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
      const loginUser = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`,
        {
          userid: userId,
          password,
        },
        { withCredentials: true }
      );

      const { state, message, data } = loginUser.data;
      console.log("응답 데이터:", loginUser.data);
      console.log("state 값:", state, "타입:", typeof state);
      console.log("message 값:", message);

      // 로그인 성공 처리
      if (state === 200) {
        console.log("로그인 성공 - 사용자 정보 조회 시작");

        try {
          // GET /user/:userId로 사용자 정보 조회
          const userInfoResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
            { withCredentials: true }
          );

          console.log("사용자 정보 API 응답:", userInfoResponse.data);

          if (userInfoResponse.data.state === 200) {
            // 전역 상태에 사용자 정보 저장
            setUser(userInfoResponse.data, "local");
            
            console.log("사용자 정보 저장 완료 - 대시보드로 이동");
            router.push("/dashboard");
          } else {
            showErrorModal("사용자 정보를 가져올 수 없습니다.");
          }
        } catch (userInfoError) {
          console.error("사용자 정보 조회 실패:", userInfoError);
          showErrorModal("사용자 정보 조회 중 오류가 발생했습니다.");
        }

      } else {
        console.log("로그인 실패 - state가 200이 아님");
        showErrorModal(message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 실패:", error);

      if (error.response) {
        const msg =
          error.response.data?.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
        showErrorModal(msg);
      } else {
        showErrorModal("서버와 연결할 수 없습니다.");
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
                placeholder="아이디를 입력해주세요.."
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