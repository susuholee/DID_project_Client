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
  const { user, setUser, isLoggedIn } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // 수정 가능한 필드들만
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null); // 새로 추가: 실제 파일 객체
  
  // 로컬 편집 상태 (실제 사용자 상태와 분리)
  const [localNickName, setLocalNickName] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const detailRef = useRef(null);

  // 회원탈퇴 관련
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 에러 메시지
  const [nameError, setNameError] = useState("");

  // 사용자 이름 가져오기 - 닉네임 우선, 없으면 다른 필드에서 가져오기
  const getUserName = (userObj) => {
    if (!userObj) return "";
    
    // nickName이 있으면 우선 사용
    if (userObj.nickName) return userObj.nickName;
    
    // 없으면 카카오/일반 사용자에 따라 다른 필드 사용
    if (userObj.isKakaoUser) {
      return userObj.name || "";
    } else {
      return userObj.userName || "";
    }
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

    // user가 null이면 early return
    if (!user) {
      console.log('사용자 정보가 없습니다.');
      return;
    }

    console.log('사용자 정보 전체 확인:', user);
    console.log('닉네임 관련 필드들:', {
      nickName: user.nickName,
      name: user.name,
      userName: user.userName
    });

    // 로컬 상태 초기화
    setLocalNickName(user.nickName || "");
    setAddress(user.address || "");
    setAddressDetail(user.addressDetail || "");
    
    // 프로필 이미지 설정 - 사용자 이미지가 있을 때만 설정
    if (user.imgPath || user.profile) {
      const profileImageUrl = user.imgPath || user.profile;
      setProfilePreview(profileImageUrl);
      console.log('설정된 프로필 이미지:', profileImageUrl);
    } else {
      setProfilePreview(null);
      console.log('프로필 이미지 없음');
    }
  }, [user, isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log('입력 필드 변경:', { name, value });
    
    if (name === 'nickName') {
      const error = validateName(value);
      setNameError(error);
      setLocalNickName(value);
    }
    
    // 전체 사용자 상태는 업데이트하지 않고 로컬 상태만 관리
    console.log('로컬 닉네임 상태 업데이트:', value);
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('📁 파일이 선택되지 않음');
      return;
    }

    console.log('📁 선택된 파일:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

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
      console.log('🖼️ 이미지 미리보기 생성 완료');
      setProfilePreview(reader.result);
      setProfileFile(file); // 실제 파일 객체 저장
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
    if (!user) {
      openModal("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    // 사용자 ID 확인
    const userId = user.userId || user.id;
    if (!userId) {
      openModal("사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const nameValidationError = validateName(localNickName || "");
    if (nameValidationError) {
      setNameError(nameValidationError);
      openModal(nameValidationError);
      return;
    }
    setNameError("");

    try {
      setIsLoading(true);
      
      console.log('=== 프로필 수정 요청 시작 ===');
      console.log('사용자 정보:', {
        userId: userId,
        localNickName: localNickName,
        address: address,
        addressDetail: addressDetail
      });
      
      // FormData 생성 - 필요한 필드만 전송
      const formData = new FormData();
      
      // 1. 닉네임 - 로컬 상태에서 가져오기 (필수)
      const trimmedNickName = localNickName.trim();
      if (trimmedNickName) {
        formData.append('nickName', trimmedNickName);
        console.log('닉네임 추가:', trimmedNickName);
      }
      
      // 2. 주소 (address + addressDetail 합쳐서)
      const fullAddress = address ? `${address} ${addressDetail.trim()}`.trim() : '';
      if (fullAddress) {
        formData.append('address', fullAddress);
        console.log('주소 정보 추가:', fullAddress);
      }
      
      // 3. 프로필 이미지 처리
      if (profileFile) {
        console.log('새 프로필 이미지 파일 추가:', {
          fileName: profileFile.name,
          fileSize: profileFile.size,
          fileType: profileFile.type
        });
        formData.append('file', profileFile);
      } else {
        console.log('프로필 이미지 변경 없음');
        // 기존 이미지 경로가 있는 경우에만 전송
        const currentImgPath = user.imgPath || user.profile;
        if (currentImgPath && currentImgPath.trim()) {
          formData.append('imgPath', currentImgPath.trim());
          console.log('기존 imgPath 전송:', currentImgPath.trim());
        }
      }
      
      // FormData 내용 디버깅
      console.log('FormData 내용:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log('API 요청 URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`);
      console.log('요청 헤더 설정 중...');
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`, 
        formData, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('프로필 수정 성공:', response.data);
      
      // 서버 응답에서 업데이트된 정보 가져오기
      const serverData = response.data?.data || response.data;
      
      const updatedUserData = {
        ...user,
        nickName: trimmedNickName,
        address: fullAddress,
        ...(profileFile ? { 
          profile: profilePreview,
          imgPath: serverData?.imgPath || profilePreview 
        } : { 
          imgPath: serverData?.imgPath || user.imgPath || user.profile 
        }),
      };
      
      console.log('로컬 사용자 상태 업데이트:', updatedUserData);
      setUser(updatedUserData);
      
      openModal("프로필이 수정되었습니다.");
    } catch (error) {
      console.error("❌ 프로필 수정 실패:", error);
      
      let errorMessage = "프로필 수정 중 오류가 발생했습니다.";
      
      if (error.response) {
        console.error("응답 상태:", error.response.status);
        console.error("응답 데이터:", error.response.data);
        
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || "잘못된 요청입니다. 입력 정보를 확인해주세요.";
        } else if (status === 401) {
          errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
        } else if (status === 403) {
          errorMessage = "권한이 없습니다.";
        } else if (status === 404) {
          errorMessage = "사용자를 찾을 수 없습니다.";
        } else if (status === 413) {
          errorMessage = "파일 크기가 너무 큽니다.";
        } else if (status === 415) {
          errorMessage = "지원하지 않는 파일 형식입니다.";
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        console.error("요청 실패:", error.request);
        errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
      } else {
        console.error("요청 설정 오류:", error.message);
        errorMessage = "요청 처리 중 오류가 발생했습니다.";
      }
      
      openModal(errorMessage);
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
  // 사용자 정보 확인
  if (!user) {
    console.error('사용자 정보가 없습니다.');
    openModal("로그인이 필요합니다.");
    return;
  }

  if (!user.userId && !user.id) {
    console.error('사용자 ID가 없습니다.');
    openModal("사용자 정보를 확인할 수 없습니다.");
    return;
  }

  setIsWithdrawing(true);
  
  try {
    const userId = user.userId || user.id;
    console.log('=== 회원탈퇴 시작 ===');
    console.log('사용자 ID:', userId);
    
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
      { withCredentials: true }
    );
    
    console.log('탈퇴 성공:', response.data);
    
    // 탈퇴 모달 닫기
    setShowWithdrawModal(false);
    
    // 전역 상태 초기화
    console.log('전역 상태 초기화 시작');
    setUser(null);
    
    console.log('전역 상태 초기화 완료');
    
    // 성공 메시지 표시 (상태 초기화 후)
    openModal("회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
    
  } catch (error) {
    console.error('회원탈퇴 실패:', error);
    let errorMessage = "탈퇴 처리 중 오류가 발생했습니다.";
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('응답 상태:', status);
      console.error('응답 데이터:', data);
      
      if (status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다.";
      } else if (status === 401) {
        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
      } else if (status === 403) {
        errorMessage = "권한이 없습니다.";
      } else if (data?.message) {
        errorMessage = data.message;
      }
    } else if (error.request) {
      console.error('요청 실패:', error.request);
      errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
    } else {
      console.error('요청 설정 오류:', error.message);
      errorMessage = "요청 처리 중 오류가 발생했습니다.";
    }
    
    openModal(errorMessage);
    
  } finally {
    setIsWithdrawing(false);
  }
};

  const handleModalClose = () => {
    closeModal();
    if (message === "프로필이 수정되었습니다.") {
      router.push("/profile");
    } else if (message === "회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.") {
      // 탈퇴 완료 메시지가 표시된 경우 메인 페이지로 이동
      router.push("/");
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
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="프로필"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 border-4 border-gray-100 shadow-md flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
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
                  name="nickName"
                  value={localNickName}
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