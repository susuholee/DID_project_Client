"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useModal from "@/hooks/useModal";
import Modal from "@/components/UI/Modal";
import Link from "next/link";
import axios from "axios";
import useUserStore from "@/Store/userStore";

export default function ProfilePage() {
  const router = useRouter();
  const { isOpen, message, openModal, closeModal } = useModal();
  const { user, updateUser, isLoggedIn } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // 수정 가능한 필드들만
  const [profilePreview, setProfilePreview] = useState("/images/default-avatar.png");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const detailRef = useRef(null);

  // 회원탈퇴 관련
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 에러 메시지
  const [nameError, setNameError] = useState("");

  // 사용자 이름 가져오기 (카카오: name, 일반: userName)
  const getUserName = (userObj) => {
    return userObj?.isKakaoUser ? userObj.name : userObj.userName;
  };

  // 닉네임 유효성 검사
  const validateName = (name) => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "닉네임을 입력해주세요.";
    }
    
    if (name !== trimmedName) {
      return "닉네임 앞뒤 공백을 제거해주세요.";
    }
    
    if (trimmedName.length < 2 || trimmedName.length > 10) {
      return "닉네임은 2-10자 사이여야 합니다.";
    }
    
    const regex = /^[가-힣a-zA-Z0-9]+$/;
    if (!regex.test(trimmedName)) {
      return "닉네임은 한글, 영문, 숫자만 사용 가능합니다.";
    }
    
    return "";
  };

  useEffect(() => {
    const scriptId = "daum-postcode-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.async = true;
      document.body.appendChild(s);
    }

    if (!isLoggedIn || !user) {
      router.push("/");
      return;
    }

    setAddress(user.address || "");
    setAddressDetail(user.addressDetail || "");
    setProfilePreview(user.profile || user.imgPath || "/images/default-avatar.png");
  }, [user, isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name' || name === 'userName') {
      const error = validateName(value);
      setNameError(error);
    }
    
    updateUser({
      [name]: value,
    });
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      openModal("JPG, PNG, WEBP 형식의 이미지를 선택해 주세요.");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      openModal("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePreview(reader.result);
      updateUser({ profile: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) {
      openModal("주소 검색 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const base = data.roadAddress || data.jibunAddress;
        setAddress(base);
        setTimeout(() => detailRef.current?.focus(), 0);
      },
    }).open();
  };

  const handleSave = async () => {
    if (!user) return;

    const currentName = getUserName(user);
    
    const nameValidationError = validateName(currentName || "");
    if (nameValidationError) {
      setNameError(nameValidationError);
      openModal(nameValidationError);
      return;
    }
    setNameError("");

    try {
      setIsLoading(true);
      
      const updateData = {
        ...(user.isKakaoUser 
          ? { name: (user.name || "").trim() }
          : { userName: (user.userName || "").trim() }
        ),
        address,
        addressDetail: addressDetail.trim(),
        profile: profilePreview,
      };

      await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${user.id}`, updateData, {
        withCredentials: true
      });

      updateUser({
        address,
        addressDetail: addressDetail.trim(),
        profile: profilePreview,
        ...(user.isKakaoUser 
          ? { name: (user.name || "").trim() }
          : { userName: (user.userName || "").trim() }
        ),
      });
      
      openModal("프로필이 수정되었습니다.");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      openModal("프로필 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;
    setIsWithdrawing(true);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${user.userId}`, {
        withCredentials: true
      });

      setShowWithdrawModal(false);
      openModal("회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      router.push("/");
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      openModal("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleModalClose = () => {
    closeModal();
    if (message === "프로필이 수정되었습니다.") {
      router.push("/profile");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">프로필 저장 중...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium mb-4">사용자 정보를 불러올 수 없습니다.</p>
          <button 
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:ml-64">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center text-gray-600 hover:text-cyan-600 transition-colors mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전으로
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">프로필 수정</h1>
          <p className="text-gray-600 mt-2">개인정보를 안전하게 관리하세요</p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* 프로필 이미지 */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <img
                  src={profilePreview}
                  alt="프로필"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100 shadow-md"
                />
                <label className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full shadow-lg cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto">
                JPG, PNG, WEBP • 2MB 이하
              </p>
            </div>

            {/* 폼 필드들 */}
            <div className="space-y-6">
              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  닉네임
                </label>
                <input
                  type="text"
                  name={user.isKakaoUser ? "name" : "userName"}
                  value={getUserName(user) || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                    nameError 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-cyan-500'
                  } focus:outline-none`}
                  placeholder="2-10자 이내 (한글, 영문, 숫자)"
                />
                {nameError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {nameError}
                  </p>
                )}
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  주소
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={address}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600"
                    placeholder="주소를 검색해주세요"
                  />
                  <button
                    type="button"
                    onClick={openPostcode}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                  >
                    검색
                  </button>
                </div>
                <input
                  type="text"
                  ref={detailRef}
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="상세 주소 (선택사항)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-cyan-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleSave}
                disabled={isLoading || !!nameError}
                className="w-full bg-cyan-500 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 cursor-pointer rounded-xl transition-all duration-200 transform  disabled:hover:scale-100 shadow-lg disabled:shadow-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    저장 중...
                  </span>
                ) : (
                  '변경사항 저장'
                )}
              </button>

              <button
                onClick={openWithdrawModal}
                className="w-full py-4 border-2 bg-cyan-500 text-white rounded-xl cursor-pointer transition-all duration-200"
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 기본 모달 */}
      <Modal isOpen={isOpen} message={message} onClose={handleModalClose} />

      {/* 회원탈퇴 모달 */}
      {showWithdrawModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={closeWithdrawModal}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
              <div className="bg-cyan-500 px-6 py-5">
                <h3 className="text-xl font-bold text-white">회원탈퇴</h3>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-red-800 mb-3">
                     주의하세요!
                    </h4>
                    <div className="text-red-800 font-medium space-y-2 text-sm">
                      <p>모든 수료증이 영구 삭제됩니다</p>
                      <p>학습 기록이 모두 사라집니다</p>
                      <p>개인 정보가 완전히 제거됩니다</p>
                      <p>삭제된 데이터는 복구할 수 없습니다</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-700 font-semibold text-lg mb-2">
                    정말로 탈퇴하시겠습니까?
                  </p>
                  <p className="text-gray-500 text-sm">
                    이 작업은 되돌릴 수 없습니다
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeWithdrawModal}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isWithdrawing ? (
                      <span className="flex items-center justify-center">
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        처리중...
                      </span>
                    ) : (
                      '탈퇴하기'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}