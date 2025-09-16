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

 
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null); 
  

  const [localNickName, setLocalNickName] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const detailRef = useRef(null);

  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

 
  const [nameError, setNameError] = useState("");


  // 변경사항이 있는지 확인하는 함수
  const hasChanges = () => {
    if (!user) return false;
    
    const trimmedNickName = localNickName.trim();
    const fullAddress = address ? `${address} ${addressDetail.trim()}`.trim() : '';
    
    const isNickNameChanged = trimmedNickName !== (user.nickName || "");
    const isAddressChanged = fullAddress !== (user.address || "");
    const hasImageFile = !!profileFile;
    
    return isNickNameChanged || isAddressChanged || hasImageFile;
  };

  const getUserName = (userObj) => {
    if (!userObj) return "";
    
 
    if (userObj.nickName) return userObj.nickName;
    

    if (userObj.isKakaoUser) {
      return userObj.name || "";
    } else {
      return userObj.userName || "";
    }
  };


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

    
    if (!user) {
      return;
    }


    setLocalNickName(user.nickName || "");
    setAddress(user.address || "");
    setAddressDetail(user.addressDetail || "");
    

    if (user.imgPath || user.profile) {
      const profileImageUrl = user.imgPath || user.profile;
      setProfilePreview(profileImageUrl);
    } else {
      setProfilePreview(null);
    }
  }, [user, isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'nickName') {
      const error = validateName(value);
      setNameError(error);
      setLocalNickName(value);
    }
    
   
    
  };

const handleProfileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }

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
    setProfileFile(file);
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

  // 변경사항 확인
  const trimmedNickName = localNickName.trim();
  const fullAddress = address ? `${address} ${addressDetail.trim()}`.trim() : '';
  
  const isNickNameChanged = trimmedNickName !== (user.nickName || "");
  const isAddressChanged = fullAddress !== (user.address || "");
  const hasImageFile = !!profileFile;

  // 아무것도 변경되지 않았다면 요청하지 않음
  if (!isNickNameChanged && !isAddressChanged && !hasImageFile) {
    openModal("변경된 내용이 없습니다.");
    return;
  }

  try {
    setIsLoading(true);
    
    const promises = [];
    
    // 이미지 파일이 새로 업로드된 경우에만 multipart/form-data 요청
    if (hasImageFile) {
      const formData = new FormData();
      
      // 닉네임이 변경된 경우에만 추가
      if (isNickNameChanged && trimmedNickName) {
        formData.append('nickName', trimmedNickName);
      }
      
      // 주소가 변경된 경우에만 추가
      if (isAddressChanged && fullAddress) {
        formData.append('address', fullAddress);
      }
      
      formData.append('file', profileFile);
      
      const userUpdatePromise = axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      promises.push(userUpdatePromise);
      
    } else {
      // 이미지 파일 변경 없고, 닉네임이나 주소만 변경된 경우
      const updateData = {};
      
      if (isNickNameChanged && trimmedNickName) {
        updateData.nickName = trimmedNickName;
      }
      
      if (isAddressChanged && fullAddress) {
        updateData.address = fullAddress;
      }
      
      // 실제로 변경된 데이터가 있는지 재확인
      if (Object.keys(updateData).length === 0) {
        openModal("변경된 내용이 없습니다.");
        setIsLoading(false);
        return;
      }
      
      const userUpdatePromise = axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
        updateData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      promises.push(userUpdatePromise);
    }
    
    const [userEditResponse] = await Promise.all(promises);
    
    
  
    const updatedUserData = {
      ...user,
      nickName: trimmedNickName,
      address: fullAddress,
      ...(profileFile ? { 
        profile: profilePreview,
        imgPath: profilePreview 
      } : {})
    };
    
    setUser(updatedUserData);
    
    openModal("프로필이 수정되었습니다.");
    
  } catch (error) {
    
    let errorMessage = "프로필 수정 중 오류가 발생했습니다.";
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 400) {
        errorMessage = "잘못된 요청입니다. 입력 정보를 확인해주세요.";
      } else if (status === 401) {
        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
      } else if (status === 403) {
        errorMessage = "권한이 없습니다.";
      } else if (status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다.";
      } else if (status === 413) {
        errorMessage = "파일 크기가 너무 큽니다. 2MB 이하로 업로드해주세요.";
      } else if (status === 415) {
        errorMessage = "지원하지 않는 파일 형식입니다. JPG, PNG, WEBP 형식을 사용해주세요.";
      } else if (status >= 500) {
        errorMessage = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else {
        errorMessage = "프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
      }
    } else if (error.request) {
      errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
    } else {
      errorMessage = "요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
    }
    
    console.error('Profile update error:', error);
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
    
    const userEdit = await axios.delete(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`,
      { withCredentials: true }
    );
    
    
    setShowWithdrawModal(false);
    
    setUser(null);
    
    
    openModal("회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
    
  } catch (error) {
    let errorMessage = "탈퇴 처리 중 오류가 발생했습니다.";
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다.";
      } else if (status === 401) {
        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
      } else if (status === 403) {
        errorMessage = "권한이 없습니다.";
      } else if (status >= 500) {
        errorMessage = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else {
        errorMessage = "탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
      }
    } else if (error.request) {
      errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
    } else {
      errorMessage = "요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
    }
    
    console.error('Withdraw error:', error);
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
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-500 mx-auto mb-6"></div>
          <p className="text-lg">프로필 저장 중...</p>
        </div>
      </main>
    );
  }

 
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:ml-64">
      <div className="max-w-md mx-auto">
    
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl  mb-3">프로필 수정</h1>
            <p className="text-lg">개인정보를 안전하게 관리하세요</p>
          </div>
        </div>

     
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
          
            <div className="text-center mb-8">
              <div className="relative inline-block group">
            
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="프로필"
                    className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-3 rounded-full shadow-xl cursor-pointer transition-all duration-200 transform hover:scale-110">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200 max-w-sm mx-auto">
                <p className="text-sm">
                  JPG, PNG, WEBP, 2MB 이하
                </p>
              </div>
            </div>

        
            <div className="space-y-8">
           
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-cyan-600 rounded"></div>
                  </div>
                  <label className="text-lg">
                    닉네임
                  </label>
                </div>
                <input
                  type="text"
                  name="nickName"
                  value={localNickName}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                    nameError 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-cyan-500 bg-gray-50 focus:bg-white'
                  } focus:outline-none focus:ring-4 focus:ring-cyan-100 text-lg`}
                  placeholder="2-10자 이내 (한글, 영문, 숫자)"
                />
                {nameError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-sm">{nameError}</p>
                  </div>
                )}
              </div>

          
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-cyan-600 rounded"></div>
                  </div>
                  <label className="text-lg">
                    주소
                  </label>
                </div>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={address}
                    readOnly
                    className="flex-1 px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-100 bg-gradient-to-r from-gray-50 to-gray-100 focus:from-white focus:to-white text-lg transition-all duration-200"
                    placeholder="주소를 검색해주세요"
                  />
                  <button
                    type="button"
                    onClick={openPostcode}
                    className="px-6 py-4 bg-cyan-500 text-white rounded-xl  transition-all duration-200 transform hover:scale-105 shadow-lg whitespace-nowrap"
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
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-100 bg-gray-50 focus:bg-white transition-all duration-200 text-lg"
                />
              </div>
            </div>

         
            <div className="mt-8 space-y-3">
              <button
                onClick={handleSave}
                disabled={isLoading || !!nameError || !hasChanges()}
                className="w-full bg-cyan-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
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

   
      <Modal isOpen={isOpen} message={message} onClose={handleModalClose} />

    
      {showWithdrawModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={closeWithdrawModal}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
              <div className="bg-cyan-500 px-6 py-5">
                <h3 className="text-xl  text-white">회원탈퇴</h3>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h4 className="text-lg  mb-3">
                     주의하세요!
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>모든 수료증이 영구 삭제됩니다</p>
                      <p>학습 기록이 모두 사라집니다</p>
                      <p>개인 정보가 완전히 제거됩니다</p>
                      <p>삭제된 데이터는 복구할 수 없습니다</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-lg mb-2">
                    정말로 탈퇴하시겠습니까?
                  </p>
                  <p className="text-sm">
                    이 작업은 되돌릴 수 없습니다
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeWithdrawModal}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl  transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl  transition-colors disabled:opacity-50 flex items-center justify-center"
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