"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// 더미 수료증 목록
const AVAILABLE_CERTIFICATES = [
  { id: "blockchain-basic", name: "블록체인 기초 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "blockchain-advanced", name: "블록체인 심화 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "smart-contract", name: "스마트컨트랙트 개발 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "did-system", name: "DID 인증 시스템 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "web3-architecture", name: "웹3 서비스 아키텍처 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "crypto-basics", name: "암호학 기초 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "nft-development", name: "NFT 개발 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "defi-basics", name: "DeFi 기초 과정 수료증", issuer: "경일IT게임아카데미" },
  { id: "frontend-react", name: "React 프론트엔드 개발 과정 수료증", issuer: "크로스허브" },
  { id: "backend-nodejs", name: "Node.js 백엔드 개발 과정 수료증", issuer: "크로스허브" },
  { id: "fullstack-web", name: "풀스택 웹 개발 과정 수료증", issuer: "크로스허브" },
  { id: "mobile-react-native", name: "React Native 모바일 개발 과정 수료증", issuer: "크로스허브" },
];

export default function IssueCertificatePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // zustand store 연결 (더미 구현)
  const user = { id: 1, name: "사용자" }; // useUserStore((state) => state.user);
  const addNotification = (userId, notification) => {
    console.log("알림 추가:", notification);
  }; // useUserStore((state) => state.addNotification);

  const [formData, setFormData] = useState({
    certificateId: "",
    issuer: "",
    reason: "",
    // 추가된 필드들
    dateOfBirth: "",
    profileImage: null,
    name: "",
    email: "",
    phone: "",
  });

  // 이미지 미리보기 URL
  const [imagePreview, setImagePreview] = useState(null);

  // 선택된 수료증
  const selectedCertificate = useMemo(() => {
    return AVAILABLE_CERTIFICATES.find((cert) => cert.id === formData.certificateId);
  }, [formData.certificateId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "certificateId") {
      const selected = AVAILABLE_CERTIFICATES.find((cert) => cert.id === value);
      setFormData((prev) => ({
        ...prev,
        certificateId: value,
        issuer: selected?.issuer || "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 파일 업로드 처리
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData(prev => ({ ...prev, profileImage: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: Date.now(),
      certificateId: formData.certificateId,
      certificateName: selectedCertificate?.name,
      issuer: formData.issuer,
      reason: formData.reason,
      requestedAt: new Date().toISOString(),
      status: "pending",
      // 추가된 필드들
      dateOfBirth: formData.dateOfBirth,
      profileImage: formData.profileImage,
      submittedInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }
    };

    console.log("발급 요청 데이터:", payload);

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 알림 추가
    const newNotification = {
      id: Date.now(),
      title: "수료증 발급 요청",
      message: `${selectedCertificate?.name} 발급 요청이 제출되었습니다.`,
      ts: Date.now(),
      read: false,
    };

    addNotification(user.id, newNotification);

    // 발급 요청 저장
    const existingRequests = JSON.parse(localStorage.getItem("certificate_requests") || "[]");
    const updatedRequests = [payload, ...existingRequests];
    localStorage.setItem("certificate_requests", JSON.stringify(updatedRequests));

    console.log("업데이트된 요청들:", updatedRequests);

    alert("수료증 발급 요청이 성공적으로 제출되었습니다!");
    router.push("/certificates/requests");
  };

  const canSubmit = formData.certificateId && 
                   formData.issuer && 
                   formData.reason.trim() &&
                   formData.dateOfBirth &&
                   formData.name.trim() &&
                   formData.email.trim() &&
                   formData.phone.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">수료증 발급 요청</h1>
          <p className="text-gray-600">기관에서 승인한 수료증 목록에서 선택하여 발급을 요청할 수 있습니다.</p>
        </div>

        <div className="space-y-8 bg-white p-8 rounded-2xl shadow-lg">
          {/* 수료증 정보 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">수료증 정보</h2>
            
            {/* 수료증 선택 */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                수료증 종류 <span className="text-red-500">*</span>
              </label>
              <select
                name="certificateId"
                value={formData.certificateId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="" disabled>
                  수료증을 선택하세요
                </option>
                {AVAILABLE_CERTIFICATES.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.name} ({cert.issuer})
                  </option>
                ))}
              </select>
            </div>

            {/* 발급 기관 */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                발급 기관 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="issuer"
                placeholder="경일IT게임아카데미"
                value={formData.issuer}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                readOnly
              />
            </div>

            {/* 발급 요청 사유 */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                발급 요청 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                placeholder="수료증 발급이 필요한 사유를 입력해주세요."
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 개인 정보 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">개인 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  생년월일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
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
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center"
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

          {/* 선택된 수료증 미리보기 */}
          {selectedCertificate && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">요청 정보 미리보기</h3>
              <div className="bg-white rounded-lg p-6 border space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{selectedCertificate.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">발급기관: {selectedCertificate.issuer}</p>
                    <p className="text-sm text-gray-600">요청사유: {formData.reason || "미입력"}</p>
                  </div>
                  {imagePreview && (
                    <div className="ml-4">
                      <img src={imagePreview} alt="프로필" className="w-16 h-16 object-cover rounded-full border-2 border-gray-200" />
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">이름:</span>
                      <span className="ml-2 font-medium">{formData.name || "미입력"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">생년월일:</span>
                      <span className="ml-2 font-medium">
                        {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('ko-KR') : "미입력"}
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {!canSubmit ? "모든 필수 정보를 입력해주세요" : "발급 요청하기"}
            </button>
            
            {!canSubmit && (
              <div className="mt-3 text-sm text-gray-500 text-center">
                <span className="text-red-500">*</span> 표시된 항목들을 모두 입력해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}