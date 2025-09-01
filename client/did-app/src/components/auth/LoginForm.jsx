"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Modal from "@/components/UI/Modal";

export default function LoginForm() {
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // 컴포넌트 마운트시 모달 상태 초기화
  useEffect(() => {
    setShowModal(false);
    setModalMessage("");
  }, []);

  // 모달 관련 함수들
  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // 입력값 검증
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
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // 사용자 목록이 비어있는 경우
      if (users.length === 0) {
        throw new Error("등록된 사용자가 없습니다. 먼저 회원가입을 해주세요.");
      }

      const foundUser = users.find(
        (u) => u.id === idOrEmail && u.password === password 
      );

      if (!foundUser) {
        throw new Error("아이디 또는 비밀번호가 잘못되었습니다.");
      }

      // 로그인 성공 후 현재 사용자만 저장
      localStorage.setItem("currentUser", JSON.stringify(foundUser));

    
      window.location.href = "/dashboard";

      
    } catch (error) {
      showErrorModal(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-gray-200 shadow-lg p-8">
          <h1 className="text-black text-3xl font-extrabold mb-8">로그인</h1>

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

          <div className="flex items-center my-6">
            <div className="flex-grow border-b border-gray-500"></div>
            <div className="flex-grow border-b border-gray-500"></div>
          </div>

          <div className="space-y-2">
            <Link href="/auth/kakao/callback" className="block">
              <img
                src="/images/kakao_login.png"
                alt="카카오 로그인"
                className="w-full h-[48px] object-cover rounded-xl"
              />
            </Link>
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
  <Modal 
    isOpen={showModal} 
    message={modalMessage}
    onClose={closeModal}
  />
)}
    </>
  );
}