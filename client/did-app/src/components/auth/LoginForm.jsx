"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";

export default function LoginForm() {
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const { user } = useUserStore();
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

    if (!idOrEmail.trim()) {
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
      if (!user) {
        showErrorModal("회원가입된 정보가 없습니다. 먼저 회원가입을 해주세요.");
        return;
      }
      if (user.userId !== idOrEmail || user.password !== password) {
        showErrorModal("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push("/dashboard");
    } catch (error) {
      showErrorModal(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 버튼 클릭 시
const handleKakaoLogin = () => {
  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize?` +
    `client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=login`;

  window.location.href = kakaoAuthUrl;
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
                value={idOrEmail}
                onChange={(e) => setIdOrEmail(e.target.value)}
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
