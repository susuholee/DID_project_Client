"use client";
import { useEffect, useRef, useState } from "react";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import Link from "next/link";

// Modal 컴포넌트
function Modal({ isOpen, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[280px] border border-gray-200">
        <p className="mb-3 text-center">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-amber-400 text-white px-4 py-1 rounded hover:bg-amber-500"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DIDSignupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const detailRef = useRef(null);

  // 주소검색 스크립트 + 로그인 상태 확인
  useEffect(() => {
    const scriptId = "daum-postcode-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.async = true;
      document.body.appendChild(s);
    }

    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) {
      window.location.href = "/";
      return;
    }
    if (user.hasDID) {
      window.location.href = "/dashboard";
      return;
    }

    // 일반 소셜 유저라면 name이 있을 수 있으니 초기값 세팅
    setCurrentUser(user);
    if (user.name) setName(user.name);
    if (user.address) setAddress(user.address);
    if (user.birth) setBirth(user.birth);
  }, []);

  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) {
      showErrorModal("주소 검색 스크립트가 준비되지 않았습니다.");
      return;
    }

    // 모바일 여부 확인
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    new window.daum.Postcode({
      oncomplete: (data) => {
        const roadAddr = data.roadAddress;
        const jibunAddr = data.jibunAddress;
        setAddress(roadAddr || jibunAddr);
        setTimeout(() => detailRef.current?.focus(), 0);
      },
      // 모바일에서는 전체 화면, 데스크톱에서는 적절한 크기
      width: isMobile ? '100%' : '500',
      height: isMobile ? '100%' : '600',
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#fffff", 
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FAFAFA",
        textColor: "#333333",
        queryTextColor: "#222222"
      }
    }).open({
      // 데스크톱에서만 중앙 정렬 위치 설정
      ...(isMobile ? {} : {
        left: (window.screen.width / 2) - (250),
        top: (window.screen.height / 2) - (300)
      }),
      // 모바일에서는 전체 화면으로
      ...(isMobile ? {
        popupName: 'postcodePopup',
        autoClose: true
      } : {})
    });
  };

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

    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (user.hasDID) {
      return;
    }

    // 이름 정규식 검증
    const regex3 = /^[a-zA-Z가-힣]+$/;

    // 필수 입력 검증 (빈 문자열)
    if (!name.trim()) {
      showErrorModal("서비스를 이용하려면 모든 정보를 입력해주세요.");
      return;
    }

    // 앞뒤 공백 체크
    if (name !== name.trim()) {
      showErrorModal("이름의 앞뒤 공백을 제거해주세요.");
      return;
    }
    
    // 이름 정규식 검증 (영어, 한글만 허용)
    if (!regex3.test(name)) {
      showErrorModal("이름은 한글 또는 영어만 입력 가능합니다.");
      return;
    }

    if (!birth) {
      showErrorModal("서비스를 이용하려면 모든 정보를 입력해주세요.");
      return;
    }
    if (!address.trim()) {
      showErrorModal("서비스를 이용하려면 모든 정보를 입력해주세요.");
      return;
    }

    // 간단 검증: 생년월일 미래 불가 (오늘까지는 허용)
    if (birth) {
      const today = new Date();
      const b = new Date(birth);
      
      // 오늘 날짜를 00:00:00으로 설정
      today.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      
      if (b.getTime() > today.getTime()) {
        showErrorModal("생년월일이 올바르지 않습니다. 미래 날짜는 선택할 수 없습니다.");
        return;
      }
    }

    const updatedUser = {
      ...user,
      name,
      birth,
      address: `${address} ${detail}`.trim(),
      hasDID: true,
      did: "did:example:dummy-1234567890",
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    window.location.href = "/dashboard";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">DID 정보 입력</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          안전한 DID 생성을 위해 추가 정보가 필요합니다
        </p>

        {/* 카카오(혹은 소셜)에서 온 기본 정보 요약: 읽기 전용 */}
        {currentUser && (
          <div className="mb-5 flex items-center gap-3">
            {currentUser.profile ? (
              <img
                src={currentUser.profile}
                alt="프로필"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                {(currentUser.nickname ?? currentUser.name ?? "유")[0]}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">연동된 소셜 정보</p>
              <p className="text-sm font-medium text-gray-900">
                {currentUser.nickname ?? currentUser.name ?? "사용자"}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          {/* DID 생성에 필요한 추가 입력 */}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름(실명)"
            required
          />
          <Input
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Input
              value={address}
              placeholder="주소"
              readOnly
              required
              className="flex-1"
            />
            <Button
              type="button"
              onClick={openPostcode}
              className="shrink-0 bg-gray-800 text-white px-4 rounded"
            >
              주소 검색
            </Button>
          </div>
          <Input
            ref={detailRef}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세주소"
          />

          <Button
            type="submit"
            className="w-full bg-rose-400 text-black py-3 rounded cursor-pointer"
          >
            DID 생성
          </Button>
        </form>

        {/* 커스텀 모달 */}
        <Modal 
          isOpen={showModal} 
          message={modalMessage} 
          onClose={closeModal} 
        />
      </div>
    </main>
  );
}