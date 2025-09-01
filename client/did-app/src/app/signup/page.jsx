"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import Modal from "@/components/UI/Modal";
import ProgressBar from "@/components/UI/ProgressBar";
import LoadingSpinner from "@/components/UI/Spinner";

// 입력 상태에 따른 스타일 반환
const getInputStatus = (value, isValid, hasError = false) => {
  if (!value) return "";
  if (hasError) return "border-red-300 bg-red-50";
  return isValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50";
};

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setuserName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [idCheckStatus, setIdCheckStatus] = useState(""); // "checking", "available", "unavailable", ""
  const [isIdChecked, setIsIdChecked] = useState(false); // 중복체크 완료 여부
  const [lastCheckedId, setLastCheckedId] = useState(""); // 마지막으로 체크한 아이디
  const [retryCount, setRetryCount] = useState(0);

  // 폼 데이터 임시 저장 (새로고침 대응)
  useEffect(() => {
    const savedData = localStorage.getItem("signup_temp");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setuserName(data.userName || "");
        setId(data.id || "");
        setBirth(data.birth || "");
        setAddress(data.address || "");
        setAddressDetail(data.addressDetail || "");
        setCurrentStep(data.currentStep || 1);
      } catch (error) {
        console.error("임시 데이터 로드 실패:", error);
      }
    }
  }, []);

  // 폼 데이터 임시 저장
  useEffect(() => {
    const tempData = {
      userName, id, birth, address, addressDetail, currentStep
    };
    localStorage.setItem("signup_temp", JSON.stringify(tempData));
  }, [name, id, birth, address, addressDetail, currentStep]);

  // 아이디가 변경되면 중복체크 상태 초기화
  useEffect(() => {
    if (id !== lastCheckedId) {
      setIsIdChecked(false);
      setIdCheckStatus("");
    }
  }, [id, lastCheckedId]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (currentStep < 4) {
          // 각 단계별 유효성 검사를 여기서 직접 체크
          let isCurrentStepValid = false;
          
          if (currentStep === 1) {
            const userNameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
            const idRegex = /^[a-zA-Z0-9]+$/;
            
            isCurrentStepValid = userName.trim().length >= 2 && 
                   userName.trim().length <= 12 &&
                   userName === userName.trim() &&
                   userNameRegex.test(userName.trim()) &&
                   !/(.)\1{2,}/.test(userName.trim()) &&
                   !/^\d+$/.test(userName.trim()) &&
                   id.trim().length >= 4 && 
                   id.trim().length <= 16 &&
                   id === id.trim() &&
                   idRegex.test(id.trim()) &&
                   !/(.)\1{2,}/.test(id.trim()) &&
                   isIdChecked &&
                   idCheckStatus === "available" &&
                   id === lastCheckedId;
          } else if (currentStep === 2) {
            const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':",.<>?]).{8,}$/;
            const passwordValid = regex.test(password);
            isCurrentStepValid = passwordValid && password === confirm;
          } else if (currentStep === 3) {
            if (!birth || !address.trim()) {
              isCurrentStepValid = false;
            } else {
              const today = new Date();
              const birthDate = new Date(birth);
              today.setHours(0, 0, 0, 0);
              birthDate.setHours(0, 0, 0, 0);
              isCurrentStepValid = birthDate.getTime() <= today.getTime();
            }
          }
          
          if (isCurrentStepValid) {
            setCurrentStep(currentStep + 1);
          } else {
            // 유효하지 않을 때만 handleNext 호출 (에러 메시지 표시용)
            handleNext();
          }
        } else if (currentStep === 4) {
          handleSubmit();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, userName, id, password, confirm, birth, address, isIdChecked, idCheckStatus, lastCheckedId]);

  const pwdValid = useMemo(() => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':",.<>?]).{8,}$/;
    return regex.test(password);
  }, [password]);

  const pwdOk = useMemo(() => pwdValid && password === confirm, [pwdValid, password, confirm]);

  const fullAddress = useMemo(
    () => (addressDetail ? `${address} ${addressDetail}` : address),
    [address, addressDetail]
  );

  // 아이디 중복 체크 함수
  const checkIdAvailability = useCallback(async () => {
    const trimmedId = id.trim();
    
    if (!trimmedId || trimmedId.length < 4) {
      showErrorModal("아이디를 4자 이상 입력해주세요.");
      return;
    }

    if (trimmedId.length > 16) {
      showErrorModal("아이디는 16자 이하로 입력해주세요.");
      return;
    }

    const idRegex = /^[a-zA-Z0-9]+$/;
    if (!idRegex.test(trimmedId)) {
      showErrorModal("아이디는 영문자와 숫자만 사용 가능합니다.");
      return;
    }

    if (/(.)\1{2,}/.test(trimmedId)) {
      showErrorModal("아이디에 같은 문자를 3번 이상 연속 사용할 수 없습니다.");
      return;
    }

    setIdCheckStatus("checking");
    setLoading(true);
    
    try {
      // 실제로는 API 호출, 여기서는 localStorage 체크
      await new Promise(resolve => setTimeout(resolve, 800)); // 실제 API 호출 시뮬레이션
      
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const isAvailable = !users.some((u) => u.id === trimmedId);
      
      if (isAvailable) {
        setIdCheckStatus("available");
        setIsIdChecked(true);
        setLastCheckedId(trimmedId);
        showErrorModal("사용 가능한 아이디입니다!");
      } else {
        setIdCheckStatus("unavailable");
        setIsIdChecked(false);
        showErrorModal("이미 사용 중인 아이디입니다.");
      }
    } catch (error) {
      setIdCheckStatus("");
      setIsIdChecked(false);
      showErrorModal("중복체크 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 각 단계별 완료 조건
  const step1Valid = useMemo(() => {
    const userNameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
    const idRegex = /^[a-zA-Z0-9]+$/;
    
    return userName.trim().length >= 2 && 
           userName.trim().length <= 12 &&
           userName === userName.trim() &&
           userNameRegex.test(userName.trim()) &&
           !/(.)\1{2,}/.test(userName.trim()) &&
           !/^\d+$/.test(userName.trim()) &&
           id.trim().length >= 4 && 
           id.trim().length <= 16 &&
           id === id.trim() &&
           idRegex.test(id.trim()) &&
           !/(.)\1{2,}/.test(id.trim()) &&
           isIdChecked &&
           idCheckStatus === "available" &&
           id === lastCheckedId; // 현재 아이디와 체크한 아이디가 같은지 확인
  }, [userName, id, isIdChecked, idCheckStatus, lastCheckedId]);

  const step2Valid = useMemo(() => pwdOk, [pwdOk]);

  const step3Valid = useMemo(() => {
    if (!birth || !address.trim()) return false;
    
    const today = new Date();
    const birthDate = new Date(birth);
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);

    return birthDate.getTime() <= today.getTime();
  }, [birth, address]);

  // 모달 관련 함수들
  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  // 기본 프로필 이미지 경로
  const getDefaultProfile = () => "/images/default.png";

  // 이미지 압축 함수 개선
  const compressImage = useCallback((file, maxSize = 150, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 이미지 업로드 처리
  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      showErrorModal("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      showErrorModal("이미지 파일만 업로드 가능합니다.");
      return;
    }

    try {
      setLoading(true);
      const compressedImage = await compressImage(file);
      setProfile(compressedImage);
    } catch (error) {
      showErrorModal("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로
  const handleNext = () => {
    if (currentStep === 1) {
      if (!step1Valid) {
        if (!userName.trim()) {
          showErrorModal("닉네임을 입력해주세요.");
          return;
        }
        if (userName !== userName.trim()) {
          showErrorModal("닉네임의 앞뒤 공백을 제거해주세요.");
          return;
        }
        if (userName.trim().length < 2) {
          showErrorModal("닉네임은 2자 이상 입력해주세요.");
          return;
        }
        if (userName.trim().length > 12) {
          showErrorModal("닉네임은 12자 이하로 입력해주세요.");
          return;
        }
        const userNameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
        if (!userNameRegex.test(userName.trim())) {
          showErrorModal("닉네임은 한글, 영문, 숫자만 사용 가능합니다.");
          return;
        }
        if (/(.)\1{2,}/.test(userName.trim())) {
          showErrorModal("닉네임에 같은 문자를 3번 이상 연속 사용할 수 없습니다.");
          return;
        }
        if (/^\d+$/.test(userName.trim())) {
          showErrorModal("닉네임은 숫자로만 구성할 수 없습니다.");
          return;
        }
        if (!id.trim()) {
          showErrorModal("아이디를 입력해주세요.");
          return;
        }
        if (!isIdChecked) {
          showErrorModal("아이디 중복체크를 완료해주세요.");
          return;
        }
        if (id !== lastCheckedId) {
          showErrorModal("아이디가 변경되었습니다. 중복체크를 다시 진행해주세요.");
          return;
        }
        if (idCheckStatus !== "available") {
          showErrorModal("사용 가능한 아이디를 입력해주세요.");
          return;
        }
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!step2Valid) {
        if (!password.trim()) {
          showErrorModal("비밀번호를 입력해주세요.");
          return;
        }
        if (!pwdValid) {
          showErrorModal("비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.");
          return;
        }
        if (!pwdOk) {
          showErrorModal("비밀번호가 일치하지 않습니다.");
          return;
        }
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!step3Valid) {
        if (!birth) {
          showErrorModal("생년월일을 선택해주세요.");
          return;
        }
        
        const today = new Date();
        const birthDate = new Date(birth);
        today.setHours(0, 0, 0, 0);
        birthDate.setHours(0, 0, 0, 0);

        if (birthDate.getTime() > today.getTime()) {
          showErrorModal("생년월일이 올바르지 않습니다. 미래 날짜는 선택할 수 없습니다.");
          return;
        }
        
        if (!address.trim()) {
          showErrorModal("주소를 입력해주세요.");
          return;
        }
        return;
      }
      setCurrentStep(4);
    }
  };

  // 이전 단계로
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 회원가입 완료
  const handleSubmit = async () => {
    setLoading(true);
    setRetryCount(0);

    const attemptSignup = async () => {
      try {
        // 네트워크 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalProfile = profile || getDefaultProfile();

        const newUser = {
          userName: userName.trim(),
          id: id.trim(),
          password,
          birth,
          address: fullAddress,
          profile: finalProfile,
          hasDID: false,
          createdAt: new Date().toISOString()
        };

        const users = JSON.parse(localStorage.getItem("users") || "[]");
        
        // 최종 중복 체크
        if (users.some((u) => u.id === id.trim())) {
          throw new Error("이미 사용 중인 아이디입니다.");
        }

        localStorage.setItem("users", JSON.stringify([...users, newUser]));
        
        // 임시 데이터 삭제
        localStorage.removeItem("signup_temp");

        showErrorModal("회원가입이 완료되었습니다!");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);

      } catch (error) {
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          showErrorModal(`오류가 발생했습니다. 다시 시도하시겠습니까? (${retryCount + 1}/3)`);
          setTimeout(attemptSignup, 1000);
        } else {
          showErrorModal("회원가입 중 오류가 발생했습니다. 나중에 다시 시도해주세요.");
        }
      } finally {
        setLoading(false);
      }
    };

    await attemptSignup();
  };

  const openPostcode = () => {
    if (typeof window === "undefined" || !window.daum) {
      showErrorModal("주소 검색 스크립트가 준비되지 않았습니다.");
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress;
        setAddress(addr);
      },
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
      ...(isMobile ? {} : {
        left: (window.screen.width / 2) - (250),
        top: (window.screen.height / 2) - (300)
      }),
      ...(isMobile ? {
        popupName: 'postcodePopup',
        autoClose: true
      } : {})
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-8 sm:flex sm:items-center sm:justify-center">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

      <div className="w-full max-w-sm mx-auto sm:max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 sm:mb-2">회원가입</h1>
          <p className="text-xs sm:text-sm text-gray-600">간단한 정보로 빠르게 가입하세요</p>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={4} />

        <div className="min-h-[280px] sm:min-h-[300px]">
          {/* 1단계: 기본 정보 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">기본 정보</h2>
                <p className="text-xs sm:text-sm text-gray-600">닉네임과 아이디를 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="userName">닉네임</label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setuserName(e.target.value)}
                  placeholder="한글, 영문, 숫자 2-12자"
                  className={`h-12 text-base ${getInputStatus(userName, userName.trim().length >= 2 && userName.trim().length <= 12 && /^[가-힣a-zA-Z0-9]{2,12}$/.test(userName.trim()) && !/(.)\1{2,}/.test(userName.trim()) && !/^\d+$/.test(userName.trim()), userName && (userName !== userName.trim() || userName.trim().length < 2 || userName.trim().length > 12 || !/^[가-힣a-zA-Z0-9]{2,12}$/.test(userName.trim()) || /(.)\1{2,}/.test(userName.trim()) || /^\d+$/.test(userName.trim())))}`}
                  aria-label="닉네임 입력"
                  aria-describedby={userName && userName !== userName.trim() ? "userName-error" : undefined}
                />
                {userName && userName !== userName.trim() && (
                  <p id="userName-error" className="text-xs text-red-600 mt-1" role="alert">앞뒤 공백을 제거해주세요</p>
                )}
                {userName.trim() && userName.trim().length > 0 && userName.trim().length < 2 && (
                  <p className="text-xs text-red-600 mt-1" role="alert">2자 이상 입력해주세요</p>
                )}
                {userName.trim() && userName.trim().length > 12 && (
                  <p className="text-xs text-red-600 mt-1" role="alert">12자 이하로 입력해주세요</p>
                )}
                {userName.trim() && userName.trim().length >= 2 && userName.trim().length <= 12 && !/^[가-힣a-zA-Z0-9]{2,12}$/.test(userName.trim()) && (
                  <p className="text-xs text-red-600 mt-1" role="alert">한글, 영문, 숫자만 사용 가능합니다</p>
                )}
                {userName.trim() && /(.)\1{2,}/.test(userName.trim()) && (
                  <p className="text-xs text-red-600 mt-1" role="alert">같은 문자를 3번 이상 연속 사용할 수 없습니다</p>
                )}
                {userName.trim() && /^\d+$/.test(userName.trim()) && (
                  <p className="text-xs text-red-600 mt-1" role="alert">숫자로만 구성할 수 없습니다</p>
                )}
                {userName.trim() && userName.trim().length >= 2 && userName.trim().length <= 12 && /^[가-힣a-zA-Z0-9]{2,12}$/.test(userName.trim()) && !/(.)\1{2,}/.test(userName.trim()) && !/^\d+$/.test(userName.trim()) && (
                  <p className="text-xs text-green-600 mt-1">사용 가능한 닉네임입니다</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="user-id">아이디</label>
                <div className="flex gap-2">
                  <Input
                    id="user-id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="영문/숫자 4-16자"
                    className={`h-12 text-base flex-1 ${getInputStatus(id, isIdChecked && idCheckStatus === "available" && id === lastCheckedId, id && (id !== id.trim() || idCheckStatus === "unavailable"))}`}
                    aria-label="아이디 입력"
                    aria-describedby="id-status"
                  />
                  <Button
                    type="button"
                    onClick={checkIdAvailability}
                    disabled={!id.trim() || id.trim().length < 4 || loading || idCheckStatus === "checking"}
                    className="bg-black text-white hover:bg-rose-500 px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap h-12"
                    aria-label="아이디 중복체크"
                  >
                    {idCheckStatus === "checking" ? (
                      <LoadingSpinner message="확인중" size="sm" color="white" />
                    ) : (
                      "중복체크"
                    )}
                  </Button>
                </div>
                
                <div id="id-status" className="mt-1">
                  {id && id !== id.trim() && (
                    <p className="text-xs text-red-600" role="alert">앞뒤 공백을 제거해주세요</p>
                  )}
                  {id && id.trim().length > 0 && id.trim().length < 4 && (
                    <p className="text-xs text-red-600" role="alert">4자 이상 입력해주세요</p>
                  )}
                  {isIdChecked && idCheckStatus === "available" && id === lastCheckedId && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span>사용 가능한 아이디입니다</span>
                    </p>
                  )}
                  {idCheckStatus === "unavailable" && (
                    <p className="text-xs text-red-600" role="alert">이미 사용 중인 아이디입니다</p>
                  )}
                  {id !== lastCheckedId && isIdChecked && (
                    <p className="text-xs text-orange-600" role="alert">아이디가 변경되었습니다. 중복체크를 다시 진행해주세요</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2단계: 보안 정보 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">보안 정보</h2>
                <p className="text-xs sm:text-sm text-gray-600">안전한 비밀번호를 설정해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="password">비밀번호</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                    className={`h-12 text-base pr-10 ${getInputStatus(password, pwdValid)}`}
                    aria-label="비밀번호 입력"
                    aria-describedby="password-status"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? "숨기기" : "보기"}
                  </button>
                </div>
                <div id="password-status" className="mt-1">
                  {password.length > 0 && !pwdValid && (
                    <p className="text-xs text-red-600" role="alert">영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요</p>
                  )}
                  {pwdValid && (
                    <p className="text-xs text-green-600">안전한 비밀번호입니다</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="confirm-password">비밀번호 확인</label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className={`h-12 text-base pr-10 ${getInputStatus(confirm, password === confirm && confirm.length > 0, confirm.length > 0 && password !== confirm)}`}
                    aria-label="비밀번호 확인"
                    aria-describedby="confirm-status"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showConfirmPassword ? "숨기기" : "보기"}
                  </button>
                </div>
                <div id="confirm-status" className="mt-1">
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-red-600" role="alert">비밀번호가 일치하지 않습니다</p>
                  )}
                  {confirm.length > 0 && password === confirm && (
                    <p className="text-xs text-green-600">비밀번호가 일치합니다</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3단계: 개인 정보 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">개인 정보</h2>
                <p className="text-xs sm:text-sm text-gray-600">생년월일과 주소를 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="birth">생년월일</label>
                <Input
                  id="birth"
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  className={`h-12 text-base ${getInputStatus(birth, step3Valid)}`}
                  aria-label="생년월일 선택"
                  max={new Date().toISOString().split('T')[0]}
                />
                {birth && new Date(birth) > new Date() && (
                  <p className="text-xs text-red-600 mt-1" role="alert">미래 날짜는 선택할 수 없습니다</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">주소</label>
                <Button
                  type="button"
                  onClick={openPostcode}
                  className="bg-black text-white hover:bg-rose-500 h-12 rounded-lg text-sm w-full font-medium"
                  aria-label="주소 검색 열기"
                >
                  주소 검색
                </Button>
                <Input
                  value={address}
                  readOnly
                  placeholder="도로명 주소"
                  className={`h-12 text-base bg-gray-50 ${getInputStatus(address, address.trim().length > 0)}`}
                  aria-label="선택된 주소"
                />
                <Input
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="상세 주소 (선택)"
                  className="h-12 text-base"
                  aria-label="상세 주소 입력"
                />
              </div>
            </div>
          )}

          {/* 4단계: 프로필 설정 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">프로필 설정</h2>
                <p className="text-sm text-gray-600">프로필 사진을 설정하세요 (선택사항)</p>
              </div>

              <div className="text-center">
                {profile ? (
                  <img
                    src={profile}
                    alt="프로필 미리보기"
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-green-200"
                  />
                ) : (
                  <img
                    src="/images/default.png"
                    alt="기본 프로필"
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-gray-200"
                  />
                )}

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileChange}
                  className="block w-full text-sm text-gray-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-black file:text-white
                             hover:file:bg-rose-500"
                  aria-label="프로필 이미지 업로드"
                />
                <p className="text-xs text-gray-500 mt-2">JPG, PNG 파일 (최대 5MB)</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">입력하신 정보</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">닉네임:</span> {userName}</p>
                  <p><span className="font-medium">아이디:</span> {id}</p>
                  <p><span className="font-medium">생년월일:</span> {birth}</p>
                  <p><span className="font-medium">주소:</span> {fullAddress}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              onClick={handlePrev}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-6 py-2 rounded-lg transition-colors"
              aria-label="이전 단계로"
            >
              이전
            </Button>
          ) : (
            <Link 
              href="/" 
              className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-6 py-2 rounded-lg inline-block text-center transition-colors"
              aria-label="로그인 페이지로 이동"
            >
              로그인으로
            </Link>
          )}

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !step1Valid) ||
                (currentStep === 2 && !step2Valid) ||
                (currentStep === 3 && !step3Valid) ||
                loading
              }
              className="bg-rose-400 text-white hover:bg-rose-500 px-6 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="다음 단계로"
            >
              {loading ? <LoadingSpinner message="확인 중..." /> : "다음"}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-rose-400 text-white hover:bg-rose-500 px-6 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[100px]"
              aria-label="회원가입 완료"
            >
              {loading ? <LoadingSpinner message="가입 중..." /> : "가입 완료"}
            </Button>
          )}
        </div>
      </div>

      {/* 커스텀 모달 */}
      <Modal 
        isOpen={showModal} 
        message={modalMessage} 
        onClose={closeModal}
        aria-label="알림 모달"
      />
    </main>
  );
}