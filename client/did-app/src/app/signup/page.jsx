"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import Modal from "@/components/UI/Modal";
import ProgressBar from "@/components/UI/ProgressBar";
import LoadingSpinner from "@/components/UI/Spinner";
import useUserStore from "@/Store/userStore";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState(""); // 실명
  const [nickName, setNickName] = useState(""); // 닉네임
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [imgPath, setImgPath] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userIdCheckStatus, setUserIdCheckStatus] = useState(null); // 'checking', 'available', 'duplicate', null
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);
  
  const {setUser} = useUserStore.getState();
  const router = useRouter();
  
  const registerMutation = useMutation({
    mutationFn: ({ userData, imageFile }) => createUser(userData, imageFile),
    onSuccess: async (data) => {
      showErrorModal("회원가입이 완료되었습니다!");
      router.push('/'); // 메인 페이지로 이동
    },
    onError: (error) => {
      console.error('회원가입 에러:', error);
      
      if (error.message.includes('500')) {
        showErrorModal("서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } else if (error.message.includes('중복') || error.message.includes('이미 존재')) {
        showErrorModal("이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.");
        setCurrentStep(1);
      } else if (error.message.includes('네트워크') || error.message.includes('연결')) {
        showErrorModal("네트워크 연결을 확인하고 다시 시도해주세요.");
      } else if (error.message.includes('프로필 사진은 필수입니다.')) {
        showErrorModal("프로필 사진을 등록해주세요.");
        setCurrentStep(4);
      } else {
        showErrorModal(error.message || "회원가입 중 오류가 발생했습니다.");
      }
  },
});

const createUser = async (userData, file) => {
  try {
    const formData = new FormData();
    formData.append("userId", userData.userId);
    formData.append("userName", userData.userName);
    formData.append("nickName", userData.nickName);
    formData.append("password", userData.password);
    formData.append("address", userData.address);
    formData.append("birthDate", userData.birthDate);

    if (!file) {
      throw new Error("프로필 사진은 필수입니다."); 
    }
    formData.append("file", file); 

    const response = await axios.post(
     `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`,
      formData,
      {
        withCredentials: false,
      }
    );

    console.log("회원가입 성공 응답:", response.data);
    return response.data;
  } catch (error) {
    console.error("회원가입 API 에러:", error);
    if (error.response) {
      throw new Error(error.response.data?.message || `서버 오류 (${error.response.status})`);
    }
    throw new Error("회원가입 요청 실패");
  }
};

const checkUserIdDuplicate = async (userId) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
    );
    console.log("아이디 중복 확인 응답:", response.data);
    
    // 서버 응답 구조: {state: 404, message: 'no user'} 또는 {state: 200, data: {...}}
    if (response.data.state === 404) {
      // state가 404면 사용자가 존재하지 않는다는 뜻 (사용 가능)
      return { isDuplicate: false, message: "사용 가능한 아이디입니다." };
    } else if (response.data.state === 200) {
      // state가 200이면 사용자가 존재한다는 뜻 (중복)
      return { isDuplicate: true, message: "이미 사용 중인 아이디입니다." };
    } else {
      // 예상치 못한 응답
      throw new Error("아이디 중복 확인 응답을 처리할 수 없습니다.");
    }
  } catch (error) {
    console.error('아이디 중복 확인 오류:', error);
    // 네트워크 오류 등
    throw new Error("아이디 중복 확인 중 오류가 발생했습니다.");
  }
};

const getInputStatus = (value, isValid, hasError = false) => {
  if (!value) return "";
  if (hasError) return "border-red-300 bg-red-50";
  return isValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50";
};

  const pwdValid = useMemo(() => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':",.<>?]).{8,}$/;
    return regex.test(password);
  }, [password]);

  const pwdOk = useMemo(() => pwdValid && password === confirm, [pwdValid, password, confirm]);

  const fullAddress = useMemo(
    () => (addressDetail ? `${address} ${addressDetail}` : address),
    [address, addressDetail]
  );

  // 닉네임과 아이디가 같은지 체크하는 함수 추가
  const isNickNameSameAsUserId = useMemo(() => {
    return nickName.trim().toLowerCase() === userId.trim().toLowerCase();
  }, [nickName, userId]);

  const step1Valid = useMemo(() => {
    const userNameRegex = /^[가-힣a-zA-Z\s]{2,20}$/;
    const nickNameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
    const userIdRegex = /^[a-zA-Z0-9]+$/;
    
    // 이름 유효성 검사 함수
    const isValidUserName = (name) => {
      const trimmedName = name.trim();
      
      // 기본 길이 체크
      if (trimmedName.length < 2 || trimmedName.length > 20) return false;
      
      // 앞뒤 공백 체크
      if (name !== trimmedName) return false;
      
      // 기본 정규식 체크 (한글, 영어, 공백만 허용)
      if (!userNameRegex.test(trimmedName)) return false;
      
      // 연속된 공백 방지
      if (trimmedName.includes('  ')) return false;
      
      // 공백으로만 구성 방지
      if (trimmedName.replace(/\s/g, '').length === 0) return false;
      
      // 숫자나 특수문자 방지
      if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedName)) return false;
      
      return true;
    };
    
    return isValidUserName(userName) &&
           nickName.trim().length >= 2 && 
           nickName.trim().length <= 12 &&
           nickName === nickName.trim() &&
           nickNameRegex.test(nickName.trim()) &&
           !/(.)\1{2,}/.test(nickName.trim()) &&
           !/^\d+$/.test(nickName.trim()) &&
           !isNickNameSameAsUserId && // 닉네임과 아이디가 같으면 안됨
           userId.trim().length >= 4 && 
           userId.trim().length <= 16 &&
           userId === userId.trim() &&
           userIdRegex.test(userId.trim()) &&
           !/(.)\1{2,}/.test(userId.trim()) &&
           userIdCheckStatus === 'available';
  }, [userName, nickName, userId, userIdCheckStatus, isNickNameSameAsUserId]);

  const step2Valid = useMemo(() => pwdOk, [pwdOk]);

  const step3Valid = useMemo(() => {
    if (!birthDate || !address.trim()) return false;
    
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    today.setHours(0, 0, 0, 0);
    birthDateObj.setHours(0, 0, 0, 0);

    return birthDateObj.getTime() <= today.getTime();
  }, [birthDate, address]);

  const step4Valid = useMemo(() => {
    return selectedImageFile !== null;
  }, [selectedImageFile]);

  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      if (!step1Valid) {
        if (!userName.trim()) {
          showErrorModal("이름을 입력해주세요.");
          return;
        }
        if (userName !== userName.trim()) {
          showErrorModal("이름의 앞뒤 공백을 제거해주세요.");
          return;
        }
        if (userName.trim().length < 2) {
          showErrorModal("이름은 2자 이상 입력해주세요.");
          return;
        }
        if (userName.trim().length > 20) {
          showErrorModal("이름은 20자 이하로 입력해주세요.");
          return;
        }
        if (userName.includes('  ')) {
          showErrorModal("이름에 연속된 공백은 사용할 수 없습니다.");
          return;
        }
        if (userName.replace(/\s/g, '').length === 0) {
          showErrorModal("이름을 올바르게 입력해주세요.");
          return;
        }
        if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userName)) {
          showErrorModal("이름에는 숫자나 특수문자를 사용할 수 없습니다.");
          return;
        }
        const userNameRegex = /^[가-힣a-zA-Z\s]{2,20}$/;
        if (!userNameRegex.test(userName.trim())) {
          showErrorModal("이름은 한글 또는 영어만 사용 가능합니다.");
          return;
        }
        
        if (!nickName.trim()) {
          showErrorModal("닉네임을 입력해주세요.");
          return;
        }
        if (nickName !== nickName.trim()) {
          showErrorModal("닉네임의 앞뒤 공백을 제거해주세요.");
          return;
        }
        if (nickName.trim().length < 2) {
          showErrorModal("닉네임은 2자 이상 입력해주세요.");
          return;
        }
        if (nickName.trim().length > 12) {
          showErrorModal("닉네임은 12자 이하로 입력해주세요.");
          return;
        }
        const nickNameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
        if (!nickNameRegex.test(nickName.trim())) {
          showErrorModal("닉네임은 한글, 영문, 숫자만 사용 가능합니다.");
          return;
        }
        if (/(.)\1{2,}/.test(nickName.trim())) {
          showErrorModal("닉네임에 같은 문자를 3번 이상 연속 사용할 수 없습니다.");
          return;
        }
        if (/^\d+$/.test(nickName.trim())) {
          showErrorModal("닉네임은 숫자로만 구성할 수 없습니다.");
          return;
        }
        if (isNickNameSameAsUserId) {
          showErrorModal("닉네임과 아이디는 같을 수 없습니다.");
          return;
        }
        if (!userId.trim()) {
          showErrorModal("아이디를 입력해주세요.");
          return;
        }
        if (userId !== userId.trim()) {
          showErrorModal("아이디의 앞뒤 공백을 제거해주세요.");
          return;
        }
        if (userId.trim().length < 4) {
          showErrorModal("아이디는 4자 이상 입력해주세요.");
          return;
        }
        if (userId.trim().length > 16) {
          showErrorModal("아이디는 16자 이하로 입력해주세요.");
          return;
        }
        const userIdRegex = /^[a-zA-Z0-9]+$/;
        if (!userIdRegex.test(userId.trim())) {
          showErrorModal("아이디는 영문자와 숫자만 사용 가능합니다.");
          return;
        }
        if (/(.)\1{2,}/.test(userId.trim())) {
          showErrorModal("아이디에 같은 문자를 3번 이상 연속 사용할 수 없습니다.");
          return;
        }
        if (userIdCheckStatus !== 'available') {
          console.log('현재 userIdCheckStatus:', userIdCheckStatus);
          showErrorModal("아이디 중복 확인을 해주세요.");
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
        if (!birthDate) {
          showErrorModal("생년월일을 선택해주세요.");
          return;
        }
        
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        today.setHours(0, 0, 0, 0);
        birthDateObj.setHours(0, 0, 0, 0);

        if (birthDateObj.getTime() > today.getTime()) {
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
    } else if (currentStep === 4) {
      if (!step4Valid) {
        showErrorModal("프로필 사진은 필수입니다.");
        return;
      }
    }
  }, [currentStep, step1Valid, step2Valid, step3Valid, step4Valid, userName, nickName, userId, password, confirm, birthDate, address, selectedImageFile, userIdCheckStatus, showErrorModal, isNickNameSameAsUserId]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (currentStep < 4) {
          handleNext();
        } else if (currentStep === 4) {
          const submitButton = document.querySelector('button[type="submit"]');
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, handleNext]);

  const handleUserIdCheck = async () => {
    if (!userId.trim()) {
      showErrorModal("아이디를 입력해주세요.");
      return;
    }

    if (userId.trim().length < 4 || userId.trim().length > 16) {
      showErrorModal("아이디는 4자 이상 16자 이하로 입력해주세요.");
      return;
    }

    const userIdRegex = /^[a-zA-Z0-9]+$/;
    if (!userIdRegex.test(userId.trim())) {
      showErrorModal("아이디는 영문자와 숫자만 사용 가능합니다.");
      return;
    }

    if (/(.)\1{2,}/.test(userId.trim())) {
      showErrorModal("아이디에 같은 문자를 3번 이상 연속 사용할 수 없습니다.");
      return;
    }

    setIsCheckingUserId(true);
    setUserIdCheckStatus('checking');

    try {
      const result = await checkUserIdDuplicate(userId.trim());
      console.log('중복체크 결과:', result);
      setUserIdCheckStatus(result.isDuplicate ? 'duplicate' : 'available');
      console.log('userIdCheckStatus 업데이트:', result.isDuplicate ? 'duplicate' : 'available');
      
      // 중복 여부에 관계없이 모달창으로 결과 표시
      showErrorModal(result.message);
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      setUserIdCheckStatus(null);
      showErrorModal(error.message);
    } finally {
      setIsCheckingUserId(false);
    }
  };

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

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({ dataUrl, compressedFile });
            } else {
              resolve({ dataUrl, compressedFile: null });
            }
          }, "image/jpeg", quality);
        };
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImgPath(null);
      setSelectedImageFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorModal("파일 크기는 5MB 이하여야 합니다.");
      e.target.value = '';
      setImgPath(null);
      setSelectedImageFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showErrorModal("이미지 파일만 업로드 가능합니다.");
      e.target.value = '';
      setImgPath(null);
      setSelectedImageFile(null);
      return;
    }

    try {
      const { dataUrl, compressedFile } = await compressImage(file);
      setImgPath(dataUrl);
      setSelectedImageFile(compressedFile);
    } catch (error) {
      console.error("이미지 처리 중 오류 발생:", error);
      showErrorModal("이미지 처리 중 오류가 발생했습니다.");
      e.target.value = '';
      setImgPath(null);
      setSelectedImageFile(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!step4Valid) {
      showErrorModal("프로필 사진을 등록해주세요.");
      return;
    }

    const userData = {
      userId: userId.trim(),
      userName: userName.trim(),
      nickName: nickName.trim(),
      password,
      birthDate,
      address: fullAddress,
    };

    registerMutation.mutate({ userData, imageFile: selectedImageFile });
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
        <div className="rounded-xl bg-white shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-4 sm:px-6 sm:py-5 text-white">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">회원가입</h1>
            <p className="text-cyan-100 text-xs sm:text-sm">간단한 정보로 빠르게 가입하세요</p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 1, label: '기본정보' },
                { id: 2, label: '보안정보' },
                { id: 3, label: '개인정보' },
                { id: 4, label: '프로필' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentStep(tab.id)}
                  className={`flex-1 px-1 sm:px-2 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    currentStep === tab.id
                      ? 'bg-cyan-50 text-cyan-600 border-b-2 border-cyan-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
        
            <form onSubmit={handleSubmit} className="min-h-[350px] sm:min-h-[300px]" encType="multipart/form-data">
              {/* 1단계: 기본 정보 */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">기본 정보</h2>
                    <p className="text-xs sm:text-sm text-gray-600">이름, 닉네임, 아이디를 입력해주세요</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="userName">이름</label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="한글 또는 영어 2-20자 (예: 홍길동, John Smith)"
                      className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors ${getInputStatus(
                        userName,
                        userName.trim().length >= 2 && 
                        userName.trim().length <= 20 && 
                        /^[가-힣a-zA-Z\s]{2,20}$/.test(userName.trim()) &&
                        !userName.includes('  ') &&
                        userName === userName.trim() &&
                        userName.replace(/\s/g, '').length > 0 &&
                        !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userName),
                        userName && (
                          userName !== userName.trim() || 
                          userName.trim().length < 2 || 
                          userName.trim().length > 20 || 
                          !/^[가-힣a-zA-Z\s]{2,20}$/.test(userName.trim()) ||
                          userName.includes('  ') ||
                          userName.replace(/\s/g, '').length === 0 ||
                          /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userName)
                        )
                      )}`}
                      aria-label="이름 입력"
                    />
                    {userName && userName !== userName.trim() && (
                      <p className="text-xs text-red-600 mt-1" role="alert">앞뒤 공백을 제거해주세요</p>
                    )}
                    {userName.trim() && userName.trim().length > 0 && userName.trim().length < 2 && (
                      <p className="text-xs text-red-600 mt-1" role="alert">2자 이상 입력해주세요</p>
                    )}
                    {userName.trim() && userName.trim().length > 20 && (
                      <p className="text-xs text-red-600 mt-1" role="alert">20자 이하로 입력해주세요</p>
                    )}
                    {userName && userName.includes('  ') && (
                      <p className="text-xs text-red-600 mt-1" role="alert">연속된 공백은 사용할 수 없습니다</p>
                    )}
                    {userName && userName.replace(/\s/g, '').length === 0 && (
                      <p className="text-xs text-red-600 mt-1" role="alert">이름을 올바르게 입력해주세요</p>
                    )}
                    {userName && /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userName) && (
                      <p className="text-xs text-red-600 mt-1" role="alert">숫자나 특수문자는 사용할 수 없습니다</p>
                    )}
                    {userName.trim() && userName.trim().length >= 2 && userName.trim().length <= 20 && /^[가-힣a-zA-Z\s]{2,20}$/.test(userName.trim()) && !userName.includes('  ') && userName === userName.trim() && userName.replace(/\s/g, '').length > 0 && !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userName) && (
                      <p className="text-xs text-green-600 mt-1">올바른 이름입니다</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="nickName">닉네임</label>
                    <Input
                      id="nickName"
                      value={nickName}
                      onChange={(e) => setNickName(e.target.value)}
                      placeholder="한글, 영문, 숫자 2-12자"
                      className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors ${getInputStatus(
                        nickName,
                        nickName.trim().length >= 2 && nickName.trim().length <= 12 && /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickName.trim()) && !/(.)\1{2,}/.test(nickName.trim()) && !/^\d+$/.test(nickName.trim()) && !isNickNameSameAsUserId,
                        nickName && (nickName !== nickName.trim() || nickName.trim().length < 2 || nickName.trim().length > 12 || !/^[가-힣a-zA-Z0-9]{2,12}$/.test(nickName.trim()) || /(.)\1{2,}/.test(nickName.trim()) || /^\d+$/.test(nickName.trim()) || isNickNameSameAsUserId)
                      )}`}
                      aria-label="닉네임 입력"
                    />
                    {nickName && nickName !== nickName.trim() && (
                      <p className="text-xs text-red-600 mt-1" role="alert">앞뒤 공백을 제거해주세요</p>
                    )}
                    {nickName.trim() && nickName.trim().length > 0 && nickName.trim().length < 2 && (
                      <p className="text-xs text-red-600 mt-1" role="alert">2자 이상 입력해주세요</p>
                    )}
                    {nickName.trim() && nickName.trim().length > 12 && (
                      <p className="text-xs text-red-600 mt-1" role="alert">12자 이하로 입력해주세요</p>
                    )}
                    {nickName.trim() && nickName.trim().length >= 2 && nickName.trim().length <= 12 && !/^[가-힣a-zA-Z0-9]{2,12}$/.test(nickName.trim()) && (
                      <p className="text-xs text-red-600 mt-1" role="alert">한글, 영문, 숫자만 사용 가능합니다</p>
                    )}
                    {nickName.trim() && /(.)\1{2,}/.test(nickName.trim()) && (
                      <p className="text-xs text-red-600 mt-1" role="alert">같은 문자를 3번 이상 연속 사용할 수 없습니다</p>
                    )}
                    {nickName.trim() && /^\d+$/.test(nickName.trim()) && (
                      <p className="text-xs text-red-600 mt-1" role="alert">숫자로만 구성할 수 없습니다</p>
                    )}
                    {isNickNameSameAsUserId && nickName.trim() && userId.trim() && (
                      <p className="text-xs text-red-600 mt-1" role="alert">닉네임과 아이디는 같을 수 없습니다</p>
                    )}
                    {nickName.trim() && nickName.trim().length >= 2 && nickName.trim().length <= 12 && /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickName.trim()) && !/(.)\1{2,}/.test(nickName.trim()) && !/^\d+$/.test(nickName.trim()) && !isNickNameSameAsUserId && (
                      <p className="text-xs text-green-600 mt-1">사용 가능한 닉네임입니다</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="userId">아이디</label>
                    <div className="flex gap-2">
                      <Input
                        id="userId"
                        value={userId}
                        onChange={(e) => {
                          setUserId(e.target.value);
                          setUserIdCheckStatus(null); // 아이디 변경 시 중복체크 상태 초기화
                        }}
                        placeholder="영문/숫자 4-16자"
                        className={`flex-1 h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors ${getInputStatus(
                          userId,
                          userId.trim().length >= 4 && userId.trim().length <= 16 && /^[a-zA-Z0-9]+$/.test(userId.trim()) && !/(.)\1{2,}/.test(userId.trim()) && userIdCheckStatus === 'available' && !isNickNameSameAsUserId,
                          userId && (userId !== userId.trim() || userId.trim().length < 4 || userId.trim().length > 16 || !/^[a-zA-Z0-9]+$/.test(userId.trim()) || /(.)\1{2,}/.test(userId.trim()) || userIdCheckStatus === 'duplicate' || isNickNameSameAsUserId)
                        )}`}
                        aria-label="아이디 입력"
                      />
                      <Button
                        type="button"
                        onClick={handleUserIdCheck}
                        disabled={isCheckingUserId || !userId.trim() || userId.trim().length < 4 || userId.trim().length > 16 || !/^[a-zA-Z0-9]+$/.test(userId.trim()) || /(.)\1{2,}/.test(userId.trim())}
                        className="bg-cyan-500 text-white hover:bg-cyan-600 px-2 sm:px-3 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-xs sm:text-sm font-medium"
                        aria-label="아이디 중복 확인"
                      >
                        {isCheckingUserId ? "확인중..." : "중복확인"}
                      </Button>
                    </div>
                    
                    <div className="mt-1">
                      {userId && userId !== userId.trim() && (
                        <p className="text-xs text-red-600" role="alert">앞뒤 공백을 제거해주세요</p>
                      )}
                      {userId && userId.trim().length > 0 && userId.trim().length < 4 && (
                        <p className="text-xs text-red-600" role="alert">4자 이상 입력해주세요</p>
                      )}
                      {userId && userId.trim().length > 16 && (
                        <p className="text-xs text-red-600" role="alert">16자 이하로 입력해주세요</p>
                      )}
                      {userId && userId.trim().length >= 4 && userId.trim().length <= 16 && !/^[a-zA-Z0-9]+$/.test(userId.trim()) && (
                        <p className="text-xs text-red-600" role="alert">영문자와 숫자만 사용 가능합니다</p>
                      )}
                      {userId && /(.)\1{2,}/.test(userId.trim()) && (
                        <p className="text-xs text-red-600" role="alert">같은 문자를 3번 이상 연속 사용할 수 없습니다</p>
                      )}
                      {isNickNameSameAsUserId && nickName.trim() && userId.trim() && (
                        <p className="text-xs text-red-600" role="alert">닉네임과 아이디는 같을 수 없습니다</p>
                      )}
                      {userIdCheckStatus === 'available' && !isNickNameSameAsUserId && (
                        <p className="text-xs text-green-600">사용 가능한 아이디입니다</p>
                      )}
                      {userIdCheckStatus === 'duplicate' && (
                        <p className="text-xs text-red-600">이미 사용 중인 아이디입니다</p>
                      )}
                      {userIdCheckStatus === 'checking' && (
                        <p className="text-xs text-blue-600">중복 확인 중...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2단계: 보안 정보 */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">보안 정보</h2>
                    <p className="text-xs sm:text-sm text-gray-600">안전한 비밀번호를 설정해주세요</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="password">비밀번호</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                        className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors pr-12 sm:pr-14 ${getInputStatus(password, pwdValid)}`}
                        aria-label="비밀번호 입력"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showPassword ? "숨기기" : "보기"}
                      </button>
                    </div>
                    <div className="mt-1">
                      {password.length > 0 && !pwdValid && (
                        <p className="text-xs text-red-600" role="alert">영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요</p>
                      )}
                      {pwdValid && (
                        <p className="text-xs text-green-600">안전한 비밀번호입니다</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="confirm-password">비밀번호 확인</label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="비밀번호 재입력"
                        className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors pr-12 sm:pr-14 ${getInputStatus(confirm, password === confirm && confirm.length > 0, confirm.length > 0 && password !== confirm)}`}
                        aria-label="비밀번호 확인"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                        aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showConfirmPassword ? "숨기기" : "보기"}
                      </button>
                    </div>
                    <div className="mt-1">
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
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">개인 정보</h2>
                    <p className="text-xs sm:text-sm text-gray-600">생년월일과 주소를 입력해주세요</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="birthDate">생년월일</label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors ${getInputStatus(birthDate, step3Valid)}`}
                      aria-label="생년월일 선택"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {birthDate && new Date(birthDate) > new Date() && (
                      <p className="text-xs text-red-600 mt-1" role="alert">미래 날짜는 선택할 수 없습니다</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">주소</label>
                    <Button
                      type="button"
                      onClick={openPostcode}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 h-10 sm:h-12 rounded-lg text-xs sm:text-sm w-full font-medium transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg"
                      aria-label="주소 검색 열기"
                    >
                      주소 검색
                    </Button>
                    <Input
                      value={address}
                      readOnly
                      placeholder="도로명 주소"
                      className={`h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors bg-gray-50 ${getInputStatus(address, address.trim().length > 0)}`}
                      aria-label="선택된 주소"
                    />
                    <Input
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="상세 주소 (선택)"
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 transition-colors"
                      aria-label="상세 주소 입력"
                    />
                  </div>
                </div>
              )}

              {/* 4단계: 프로필 설정 */}
              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">프로필 설정</h2>
                    <p className="text-xs sm:text-sm text-gray-600">프로필 사진을 설정하세요 <span className="text-red-500 font-bold">(필수)</span></p>
                  </div>

                  <div className="text-center">
                    {imgPath ? (
                      <img
                        src={imgPath}
                        alt="프로필 미리보기"
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover mx-auto mb-3 sm:mb-4 border-2 border-green-200"
                      />
                    ) : (
                      <img
                        src="/images/default.png"
                        alt="기본 프로필"
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover mx-auto mb-3 sm:mb-4 border-2 border-gray-200"
                      />
                    )}

                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileChange}
                      className="block w-full text-xs sm:text-sm text-gray-500
                                 file:mr-4 file:py-2 file:px-4
                                 file:rounded-full file:border-0
                                 file:text-xs sm:file:text-sm file:font-semibold
                                 file:bg-gradient-to-r file:from-cyan-500 file:to-cyan-600 file:text-white
                                 hover:file:from-cyan-600 hover:file:to-cyan-700"
                      aria-label="프로필 이미지 업로드"
                    />
                    {!step4Valid && (
                      <p className="text-xs text-red-600 mt-2" role="alert">프로필 사진을 선택해주세요.</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG 파일 (최대 5MB)</p>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">입력하신 정보</h3>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                      <p><span className="font-medium">이름:</span> {userName}</p>
                      <p><span className="font-medium">닉네임:</span> {nickName}</p>
                      <p><span className="font-medium">아이디:</span> {userId}</p>
                      <p><span className="font-medium">생년월일:</span> {birthDate}</p>
                      <p><span className="font-medium">주소:</span> {fullAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between items-center mt-6 sm:mt-8 pt-4 border-t border-gray-200 gap-3">
                <Link 
                  href="/" 
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg inline-block text-center transition-colors text-xs sm:text-sm font-medium"
                  aria-label="로그인 페이지로 이동"
                >
                  로그인으로
                </Link>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !step1Valid) ||
                      (currentStep === 2 && !step2Valid) ||
                      (currentStep === 3 && !step3Valid)
                    }
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none text-xs sm:text-sm font-medium shadow-lg"
                    aria-label="다음 단계로"
                  >
                    다음
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending || !step4Valid}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none text-xs sm:text-sm font-medium shadow-lg min-w-[80px] sm:min-w-[100px]"
                    aria-label="회원가입 완료"
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center justify-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        가입 중...
                      </span>
                    ) : (
                      '가입 완료'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
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