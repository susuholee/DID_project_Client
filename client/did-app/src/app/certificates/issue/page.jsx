"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Modal from "@/components/UI/Modal";

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
  });

  // 실제 파일 객체를 저장할 상태 추가
  const [imageFile, setImageFile] = useState(null);

  // 이미지 미리보기 URL
  const [imagePreview, setImagePreview] = useState(null);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // success, error, loading

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
    if (!formData.certificateId || !formData.name.trim() || !formData.reason.trim() || !formData.dateOfBirth) {
      setModalMessage("모든 필수 정보를 입력해주세요.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // 로딩 모달 표시
    setModalMessage("수료증 발급 요청을 처리하고 있습니다...");
    setModalType("loading");
    setShowModal(true);

    // FormData 객체 생성
    const formDataToSend = new FormData();
    
    // 필수 필드들 추가
    formDataToSend.append('userName', formData.name.trim());
    formDataToSend.append('userId', user.id.toString());
    formDataToSend.append('certificateName', selectedCertificate?.name || '');
    formDataToSend.append('description', formData.reason.trim());
    formDataToSend.append('requestDate', new Date().toISOString());
    formDataToSend.append('request', '발급 요청');
    formDataToSend.append('DOB', formData.dateOfBirth);
    
    // 이미지 파일이 있으면 추가
    if (imageFile) {
      console.log("이미지 파일 추가:", imageFile.name, imageFile.size, imageFile.type);
      formDataToSend.append('imagefile', imageFile);
    } else {
      console.log("이미지 파일이 없습니다.");
    }

    // FormData 내용 확인을 위한 디버깅
    console.log("FormData 내용:");
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    console.log("발급 요청 데이터:", {
      userName: formData.name,
      userId: user.id,
      certificateName: selectedCertificate?.name,
      description: formData.reason,
      requestDate: new Date().toISOString(),
      request: "발급 요청",
      DOB: formData.dateOfBirth,
      hasImage: !!imageFile,
      imageFileName: imageFile?.name,
      imageFileSize: imageFile?.size
    });

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`, formDataToSend, {
        withCredentials: true,
        // Content-Type을 명시하지 않으면 브라우저가 자동으로 multipart/form-data와 boundary를 설정합니다
      });
      console.log(process.env.NEXT_PUBLIC_API_URL);

      console.log("서버 응답:", response.data);

      // 알림 추가
      const newNotification = {
        id: Date.now(),
        title: "수료증 발급 요청",
        message: `${selectedCertificate?.name} 발급 요청이 제출되었습니다.`,
        ts: Date.now(),
        read: false,
      };

      addNotification(user.id, newNotification);

      // 발급 요청 저장 (로컬 백업)
      const existingRequests = JSON.parse(localStorage.getItem("certificate_requests") || "[]");
      const requestData = {
        userName: formData.name,
        userId: user.id,
        certificateName: selectedCertificate?.name,
        description: formData.reason,
        requestDate: new Date().toISOString(),
        request: "발급 요청",
        DOB: formData.dateOfBirth,
        hasImage: !!imageFile,
        id: Date.now(),
        requestedAt: new Date().toISOString(),
        status: "pending",
      };
      const updatedRequests = [requestData, ...existingRequests];
      localStorage.setItem("certificate_requests", JSON.stringify(updatedRequests));

      setModalMessage("수료증 발급 요청이 성공적으로 제출되었습니다!");
       setModalType("success");
       setShowModal(true);
       
       // 성공 시 잠시 후 페이지 이동
       setTimeout(() => {
         setShowModal(false);
         router.push("/certificates/request");
       }, 2000);
    } catch (error) {
      console.error("발급 요청 실패:", error);
      
      // 서버 응답 상세 정보 확인
      if (error.response) {
        console.error("서버 응답 상태:", error.response.status);
        console.error("서버 응답 데이터:", error.response.data);
        console.error("서버 응답 헤더:", error.response.headers);
        
        // 서버에서 보낸 오류 메시지가 있으면 사용
        const serverMessage = error.response.data?.message || error.response.data?.error || "서버 오류가 발생했습니다.";
        setModalMessage(`발급 요청 실패: ${serverMessage}`);
      } else if (error.request) {
        console.error("요청 전송 실패:", error.request);
        setModalMessage("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
      } else {
        console.error("요청 설정 오류:", error.message);
        setModalMessage("요청 처리 중 오류가 발생했습니다.");
      }
      
      setModalType("error");
      setShowModal(true);
    }
  };

  const canSubmit = formData.certificateId && 
        formData.issuer && 
        formData.reason.trim() &&
        formData.dateOfBirth &&
        formData.name.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
      
            <form className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 space-y-8">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 개인 정보 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">개인 정보</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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

          {/* 선택된 수료증 미리보기 */}
          {selectedCertificate && (
            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
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
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg transform hover:-translate-y-0.5"
            >
              {!canSubmit ? "모든 필수 정보를 입력해주세요" : "발급 요청하기"}
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
          isOpen={showModal}
          onClose={() => modalType !== "loading" && setShowModal(false)}
          title={
            modalType === "success" ? "성공" : 
            modalType === "error" ? "오류" : 
            "처리 중"
          }
        >
        <div className="p-6">
          <div className={`text-center ${
            modalType === "success" ? "text-green-600" : 
            modalType === "error" ? "text-red-600" : 
            "text-blue-600"
          }`}>
            <div className="mb-4">
              {modalType === "success" ? (
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
            <p className="text-lg font-medium">{modalMessage}</p>
          </div>
          {modalType !== "loading" && (
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
