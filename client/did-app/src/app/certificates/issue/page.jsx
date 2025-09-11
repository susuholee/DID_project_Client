"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from '@tanstack/react-query';
import axios from "axios";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";

// 고정 발급 기관
const FIXED_ISSUER = "경일IT게임아카데미";

// 수료증 이름 옵션
const CERTIFICATE_OPTIONS = [
  { value: "블록체인 기초 과정 수료증", label: "블록체인 기초 과정 수료증" },
  { value: "웹 개발 풀스택 과정 수료증", label: "웹 개발 풀스택 과정 수료증" },
  { value: "모바일 앱 개발 과정 수료증", label: "모바일 앱 개발 과정 수료증" },
  { value: "AI/머신러닝 기초 과정 수료증", label: "AI/머신러닝 기초 과정 수료증" },
  { value: "데이터 분석 과정 수료증", label: "데이터 분석 과정 수료증" },
  { value: "게임 개발 과정 수료증", label: "게임 개발 과정 수료증" },
  { value: "UI/UX 디자인 과정 수료증", label: "UI/UX 디자인 과정 수료증" },
  { value: "클라우드 컴퓨팅 과정 수료증", label: "클라우드 컴퓨팅 과정 수료증" },
  { value: "사이버보안 과정 수료증", label: "사이버보안 과정 수료증" },
  { value: "IT 프로젝트 관리 과정 수료증", label: "IT 프로젝트 관리 과정 수료증" }
];

// 발급 요청 사유 옵션
const REQUEST_REASONS = [
  { value: "기업/회사", label: "기업/회사" },
  { value: "면접", label: "면접" },
  { value: "학교", label: "학교" },
  { value: "학원", label: "학원" },
  { value: "기타", label: "기타" }
];

// 수료증 발급 요청 API 함수
// 수정된 requestCertificate 함수
const requestCertificate = async (requestData) => {
  const formDataToSend = new FormData();
  
  // 필수 필드들 추가
  formDataToSend.append('userName', requestData.userName.trim());
  formDataToSend.append('userId', requestData.userId.toString());
  formDataToSend.append('certificateName', requestData.certificateName.trim());
  formDataToSend.append('description', requestData.description.trim());
  formDataToSend.append('requestDate', requestData.requestDate);
  formDataToSend.append('request', requestData.request);
  formDataToSend.append('DOB', requestData.DOB);
  
  // 이미지 파일이 있으면 추가
  if (requestData.imageFile) {
    formDataToSend.append('file', requestData.imageFile);
  }


  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`, formDataToSend, {
    withCredentials: true,
  });

  return response.data;
};

// 수정된 handleSubmit 함수 
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user) {
    setModalMessage("로그인이 필요합니다.");
    setModalType("error");
    setShowModal(true);
    return;
  }

  // 필수 필드 검증
  if (!formData.certificateName.trim() || !formData.name.trim() || !formData.reason.trim() || !formData.dateOfBirth) {
    setModalMessage("모든 필수 정보를 입력해주세요.");
    setModalType("error");
    setShowModal(true);
    return;
  }

  // 생년월일 유효성 검사
  const birthDate = new Date(formData.dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간 부분 제거
  
  if (birthDate >= today) {
    setModalMessage("올바른 생년월일을 입력해주세요. (과거 날짜여야 합니다)");
    setModalType("error");
    setShowModal(true);
    return;
  }

  // 나이 검증 (만 14세 이상)
  const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 14 || age > 100) {
    setModalMessage("올바른 생년월일을 입력해주세요.");
    setModalType("error");
    setShowModal(true);
    return;
  }


  // 로딩 모달 표시
  setModalMessage("수료증 발급 요청을 처리하고 있습니다...");
  setModalType("loading");
  setShowModal(true);

  // 요청 데이터 준비
  const requestData = {
    userName: formData.name.trim(),
    userId: user.id,
    certificateName: formData.certificateName.trim(),
    description: formData.reason.trim(),
    requestDate: new Date().toISOString().split('T')[0], // 오늘 날짜 (요청 날짜)
    request: 'issue',
    DOB: formData.dateOfBirth, // 사용자가 입력한 실제 생년월일
    imageFile: imageFile
  };


  // useMutation 실행
  certificateMutation.mutate(requestData);
};
export default function IssueCertificatePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // zustand store 연결
  const { user, addNotification } = useUserStore();

  // useMutation 설정
  const certificateMutation = useMutation({
    mutationFn: requestCertificate,
    onSuccess: (data) => {
    console.log("서버 응답:", data);
  
    // 알림 추가
    addNotification(user.userId || user.id, {
      id: Date.now(),
      title: '발급 요청 완료',
      message: `${formData.certificateName} 발급 요청이 성공적으로 전송되었습니다.`,
      ts: Date.now(),
      read: false,
    });

    // 성공 모달 표시
    setModalMessage("수료증 발급 요청이 성공적으로 제출되었습니다!");
    setModalType("success");
    setShowModal(true);

    // 성공 시 잠시 후 페이지 이동
    setShowModal(false);
    router.push("/certificates/request");
},
    onError: (error) => {
      console.error("발급 요청 실패:", error);
      
      // 간단한 에러 처리
      if (error.response) {
        const serverMessage = error.response.data?.message || error.response.data?.error || "서버 오류가 발생했습니다.";
        setModalMessage(`발급 요청 실패: ${serverMessage}`);
      } else if (error.request) {
        setModalMessage("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
      } else {
        setModalMessage("요청 처리 중 오류가 발생했습니다.");
      }
      
      setModalType("error");
      setShowModal(true);
    }
  });

  const [formData, setFormData] = useState({
    certificateName: "",
    reason: "", // 선택 옵션으로 변경
  });

  // 실제 파일 객체를 저장할 상태 추가
  const [imageFile, setImageFile] = useState(null);

  // 이미지 미리보기 URL
  const [imagePreview, setImagePreview] = useState(null);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // success, error, loading


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 파일 업로드 처리
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setModalMessage("파일 크기는 5MB 이하여야 합니다.");
        setModalType("error");
        setShowModal(true);
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setModalMessage("이미지 파일만 업로드할 수 있습니다.");
        setModalType("error");
        setShowModal(true);
        return;
      }

      // 파일 객체 저장
      setImageFile(file);
      
      // 미리보기를 위한 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setModalMessage("로그인이 필요합니다.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // 필수 필드 검증
    if (!formData.certificateName.trim() || !formData.reason.trim()) {
      setModalMessage("모든 필수 정보를 입력해주세요.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // 로딩 모달 표시
    setModalMessage("수료증 발급 요청을 처리하고 있습니다...");
    setModalType("loading");
    setShowModal(true);

    // 요청 데이터 준비 (전역 상태에서 사용자 정보 가져오기)
    const requestData = {
      userName: user.userName, // 전역 상태에서 가져오기
      userId: user.userId, // 전역 상태에서 가져오기
      certificateName: formData.certificateName.trim(),
      description: formData.reason, // 선택된 사유
      requestDate: new Date().toISOString().split('T')[0], // 오늘 날짜 (요청 날짜)
      request: 'issue', // 발급 요청
      DOB: user.birthDate, // 전역 상태에서 가져오기
      imageFile: imageFile
    };
  
  
    // useMutation 실행
    certificateMutation.mutate(requestData);
  };

  const canSubmit = formData.certificateName.trim() && 
        formData.reason.trim() &&
        !certificateMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
      
            <form className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 space-y-8">
              {/* 수료증 정보 섹션 */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">수료증 정보</h2>
            
              {/* 수료증 이름 선택 */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  수료증 이름 <span className="text-red-500">*</span>
                </label>
                <select
                  name="certificateName"
                  value={formData.certificateName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">수료증을 선택해주세요</option>
                  {CERTIFICATE_OPTIONS.map((certificate) => (
                    <option key={certificate.value} value={certificate.value}>
                      {certificate.label}
                    </option>
                  ))}
                </select>
            </div>

            {/* 발급 기관 */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                발급 기관
              </label>
              <input
                type="text"
                value={FIXED_ISSUER}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                readOnly
              />
            </div>

            {/* 발급 요청 사유 */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                발급 용도 <span className="text-red-500">*</span>
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">발급 용도를 선택해주세요</option>
                {REQUEST_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* 프로필 사진 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">프로필 사진</h2>
            
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                프로필 사진 업로드 <span className="text-gray-500"></span>
              </label>
              <p className="text-sm text-gray-500 mb-4">수료증에 사용될 프로필 사진을 업로드해주세요. (JPG, PNG, 5MB 이하)</p>
              
              <div className="flex items-start space-x-6">
                {/* 이미지 미리보기 */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="w-28 h-28 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500">미리보기</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 파일 업로드 버튼 */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors flex flex-col items-center"
                  >
                    <div className="w-8 h-8 text-gray-400 mb-2">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">클릭하여 이미지 선택</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG 파일 (최대 5MB)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 수료증 정보 미리보기 */}
          {(formData.certificateName || formData.reason) && (
            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">요청 정보 미리보기</h3>
              <div className="bg-white rounded-lg p-6 border space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{formData.certificateName || "수료증 이름 미입력"}</h4>
                    <p className="text-sm text-gray-600 mt-1">발급기관: {FIXED_ISSUER}</p>
                    <p className="text-sm text-gray-600">발급 용도: {formData.reason || "미입력"}</p>
                  </div>
                  {imagePreview && (
                    <div className="ml-4">
                      <img src={imagePreview} alt="프로필" className="w-16 h-16 object-cover rounded-full border-2 border-gray-200" />
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">수료자 정보</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block text-xs">이름</span>
                      <span className="font-semibold text-gray-900 text-base">{user?.userName || "미입력"}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block text-xs">생년월일</span>
                      <span className="font-semibold text-gray-900 text-base">
                        {user?.birthDate ? 
                          new Date(user.birthDate).toLocaleDateString('ko-KR') : 
                          "미입력"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg transform hover:-translate-y-0.5"
            >
              {!canSubmit ? "수료증과 발급 용도를 선택해주세요" : "발급 요청하기"}
            </button>
            
            {!canSubmit && (
              <div className="mt-3 text-sm text-gray-500 text-center">
                <span className="text-red-500">*</span> 표시된 항목들을 모두 입력해주세요.
              </div>
            )}
              </div>
            </form>
          </div>
        </div>

        {/* 모달 */}
        <Modal
          isOpen={showModal || certificateMutation.isPending}
          onClose={() => !certificateMutation.isPending && setShowModal(false)}
          title={
            certificateMutation.isPending ? "처리 중" :
            modalType === "success" ? "성공" : 
            modalType === "error" ? "오류" : 
            "처리 중"
          }
        >
        <div className="p-6">
          <div className={`text-center ${
            certificateMutation.isPending ? "text-blue-600" :
            modalType === "success" ? "text-green-600" : 
            modalType === "error" ? "text-red-600" : 
            "text-blue-600"
          }`}>
            <div className="mb-4">
              {certificateMutation.isPending ? (
                <div className="w-12 h-12 mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : modalType === "success" ? (
                <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : modalType === "error" ? (
                <svg className="w-12 h-12 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="w-12 h-12 mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <p className="text-lg font-medium">
              {certificateMutation.isPending ? "수료증 발급 요청을 처리하고 있습니다..." : modalMessage}
            </p>
          </div>
          {!certificateMutation.isPending && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  modalType === "success" 
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700" 
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                }`}
              >
                확인
              </button>
            </div>
          )}
        </div>
        </Modal>
      </div>
    </div>
  );
}
