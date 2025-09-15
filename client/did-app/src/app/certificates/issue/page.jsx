"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";


const FIXED_ISSUER = "경일IT게임아카데미";

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


const REQUEST_REASONS = [
  { value: "기업/회사", label: "기업/회사" },
  { value: "면접", label: "면접" },
  { value: "학교", label: "학교" },
  { value: "학원", label: "학원" },
  { value: "기타", label: "기타" }
];

const fetchUserCertificates = async (userId) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`, {
      withCredentials: true,
    });
    
    
    if (response.data.state === 200 && response.data.data) {
      const allRequests = response.data.data;
     
      const userAllIssueRequests = allRequests
        .filter(log => {
          const isCurrentUser = log.userId === userId;
          const isIssueRequest = log.request === 'issue';
          const isValidStatus = log.status === 'pending' || log.status === 'approved';
          return isCurrentUser && isIssueRequest && isValidStatus;
        })
        .map(log => ({
          certificateName: log.certificateName,
          status: log.status,
          request: log.request,
          requestedAt: log.createdAt,
          id: log.id
        }));
        
     
      
      const pendingRequests = userAllIssueRequests.filter(req => req.status === 'pending');
      
      return {
        allRequests: userAllIssueRequests,
        pendingRequests: pendingRequests
      };
    } else {
      console.error('예상과 다른 응답 구조:', response.data);
      return {
        allRequests: [],
        pendingRequests: []
      };
    }
  } catch (error) {
    throw error;
  }
};


const requestCertificate = async (requestData) => {
  const formDataToSend = new FormData();
  
  formDataToSend.append('userName', requestData.userName.trim());
  formDataToSend.append('userId', requestData.userId.toString());
  formDataToSend.append('certificateName', requestData.certificateName.trim());
  formDataToSend.append('description', requestData.description.trim());
  formDataToSend.append('requestDate', requestData.requestDate);
  formDataToSend.append('request', requestData.request);
  formDataToSend.append('DOB', requestData.DOB);
  
  if (requestData.imageFile) {
    formDataToSend.append('file', requestData.imageFile);
  }

  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`, formDataToSend, {
    withCredentials: true,
  });

  return response.data;
};

export default function IssueCertificatePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { user } = useUserStore();

  const { data: certificateData = { allRequests: [], pendingRequests: [] }, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['userCertificates', user?.userId],
    queryFn: () => fetchUserCertificates(user?.userId),
    enabled: !!(user?.userId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
    },
    refetchInterval: 3 * 60 * 1000, 
    refetchIntervalInBackground: true 
  });

  const getAllRequestedCertificateNames = useMemo(() => {
    if (!certificateData.allRequests || !Array.isArray(certificateData.allRequests)) return new Set();
   
    
    const allCerts = certificateData.allRequests.map(cert => cert.certificateName);
  
    return new Set(allCerts);
  }, [certificateData.allRequests]);

  const getPendingCertificateNames = useMemo(() => {
    if (!certificateData.pendingRequests || !Array.isArray(certificateData.pendingRequests)) return new Set();
    
    
    
    const pendingCerts = certificateData.pendingRequests.map(cert => cert.certificateName);
    
    return new Set(pendingCerts);
  }, [certificateData.pendingRequests]);


  const availableCertificateOptions = useMemo(() => {
    return CERTIFICATE_OPTIONS.filter(option => 
      !getAllRequestedCertificateNames.has(option.value)
    );
  }, [getAllRequestedCertificateNames]);


  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  const certificateMutation = useMutation({
    mutationFn: requestCertificate,
    onSuccess: async (data) => {


      setModalMessage("수료증 발급 요청이 성공적으로 제출되었습니다!");
      setModalType("success");
      setShowModal(true);


      await queryClient.invalidateQueries({
        queryKey: ['userCertificates', user?.userId]
      });
      
   
      await queryClient.invalidateQueries({
        queryKey: ['certificates', user?.userId]
      });

    
      setTimeout(() => {
        setShowModal(false);
        router.push("/certificates/request");
      }, 2000);
    },
    onError: (error) => {
      console.error("발급 요청 실패:", error);
      
      let errorMessage = "요청 처리 중 오류가 발생했습니다.";
      
      if (error.response) {
        const serverMessage = error.response.data?.message || error.response.data?.error;
        if (serverMessage) {
          errorMessage = `발급 요청 실패: ${serverMessage}`;
        } else {
          errorMessage = "서버 오류가 발생했습니다.";
        }
      } else if (error.request) {
        errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
      }
      
      setModalMessage(errorMessage);
      setModalType("error");
      setShowModal(true);
    }
  });

  const [formData, setFormData] = useState({
    certificateName: "",
    reason: "",
  });


  const [imageFile, setImageFile] = useState(null);


  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
  
      if (file.size > 5 * 1024 * 1024) {
        setModalMessage("파일 크기는 5MB 이하여야 합니다.");
        setModalType("error");
        setShowModal(true);
        return;
      }

  
      if (!file.type.startsWith('image/')) {
        setModalMessage("이미지 파일만 업로드할 수 있습니다.");
        setModalType("error");
        setShowModal(true);
        return;
      }

     
      setImageFile(file);
      
   
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

 
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

 
    if (!formData.certificateName.trim() || !formData.reason.trim() || !imageFile) {

      setModalMessage("모든 필수 정보를 입력해주세요. (수료증 이름, 발급 용도, 프로필 이미지)");
      setModalType("error");
      setShowModal(true);
      return;
    }

   
    if (getAllRequestedCertificateNames.has(formData.certificateName.trim())) {
    
    
      const issuedCert = certificateData.allRequests.find(cert => cert.certificateName === formData.certificateName.trim());
      let errorMessage = "이미 발급 요청한 이력이 있는 수료증입니다.";
      
      if (issuedCert) {
        if (issuedCert.status === 'approved') {
          errorMessage = "이미 발급받은 수료증입니다. 각 수료증은 한 번만 발급받을 수 있습니다.";
        } else if (issuedCert.status === 'pending') {
          errorMessage = "현재 승인 대기 중인 수료증입니다. 승인 완료 후 다시 시도해주세요.";
        }
      }
      
      setModalMessage(errorMessage);
      setModalType("error");
      setShowModal(true);
      return;
    }

   

  
    setModalMessage("수료증 발급 요청을 처리하고 있습니다...");
    setModalType("loading");
    setShowModal(true);


    const requestData = {
      userName: user.userName,
      userId: user.userId || user.id,
      certificateName: formData.certificateName.trim(),
      description: formData.reason,
      requestDate: new Date().toISOString().split('T')[0],
      request: 'issue',
      DOB: user.birthDate,
      imageFile: imageFile
    };

    
    try {
      await certificateMutation.mutateAsync(requestData);
    } catch (error) {
    }
  };

 
  const canSubmit = formData.certificateName.trim() && 
        formData.reason.trim() &&
        imageFile &&
        !certificateMutation.isPending &&
        availableCertificateOptions.length > 0;

  
  const hasCache = queryClient.getQueryData(['userCertificates', user?.userId]);
  
 
  if (certificatesLoading && !hasCache) {
    return (
      <div className="min-h-screen  flex">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
              <p>수료증 발급 내역을 확인하고 있습니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            
         
            {availableCertificateOptions.length === 0 && (
              <div className="mb-6 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-cyan-500 rounded mr-3"></div>
                  <div>
                    <h3 className="text-sm">발급 가능한 수료증이 없습니다</h3>
                    <p className="text-sm mt-1">모든 수료증을 이미 요청했거나 발급받으셨습니다. 하나의 수료증당 1개씩만 발급 가능합니다.</p>
                  </div>
                </div>
              </div>
            )}

         
            {getAllRequestedCertificateNames.size > 0 && (
              <div className="mb-6 bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <div className="w-4 h-4 bg-white rounded"></div>
                  </div>
                  <h3 className="text-base sm:text-lg">
                    수료증 발급 내역 ({getAllRequestedCertificateNames.size}개)
                  </h3>
                </div>

            
                {getPendingCertificateNames.size > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-cyan-300 rounded-full mr-2"></div>
                      <h4 className="text-sm">승인 대기 중 ({getPendingCertificateNames.size}개)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(getPendingCertificateNames).map((certName, index) => (
                        <span key={`pending-${certName}-${index}`} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs  bg-gradient-to-r from-cyan-400 to-cyan-800 text-white shadow-sm">
                          <div className="w-3 h-3 mr-1 flex-shrink-0 bg-white rounded"></div>
                          <span className="truncate max-w-[120px] sm:max-w-none">{certName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

            
                {(getAllRequestedCertificateNames.size > getPendingCertificateNames.size) && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                      <h4 className="text-sm">발급 완료 ({getAllRequestedCertificateNames.size - getPendingCertificateNames.size}개)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {certificateData.allRequests
                        .filter(cert => cert.status === 'approved')
                        .map((cert, index) => (
                          <span key={`approved-${cert.certificateName}-${index}`} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs  bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-sm">
                            <div className="w-3 h-3 mr-1 flex-shrink-0 bg-white rounded"></div>
                            <span className="truncate max-w-[120px] sm:max-w-none">{cert.certificateName}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/70 rounded-lg p-3 border border-cyan-200/50">
                  <div className="text-xs sm:text-sm flex items-start">
                    <div className="w-4 h-4 mr-2 bg-cyan-600 rounded flex-shrink-0 mt-0.5"></div>
                    <span>위 수료증들은 이미 요청했거나 발급받았으므로 중복 신청할 수 없습니다. 각 수료증은 한 번만 발급 가능합니다.</span>
                  </div>
                </div>
              </div>
            )}
      
            <form className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 space-y-8">
   
              <div className="space-y-6">
                <h2 className="text-xl border-b border-gray-200 pb-2">수료증 정보</h2>
            
  
                <div>
                  <label className="block mb-2 text-sm">
                    수료증 이름 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="certificateName"
                    value={formData.certificateName}
                    onChange={handleChange}
                    required
                    disabled={availableCertificateOptions.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {availableCertificateOptions.length === 0 
                        ? "발급 가능한 수료증이 없습니다" 
                        : "수료증을 선택해주세요"
                      }
                    </option>
                    {availableCertificateOptions.map((certificate) => (
                      <option key={certificate.value} value={certificate.value}>
                        {certificate.label}
                      </option>
                    ))}
                  </select>
                  {availableCertificateOptions.length === 0 && (
                    <p className="mt-1 text-sm">
                      모든 수료증을 이미 요청하셨습니다. 하나의 수료증당 1개씩만 발급 가능합니다.
                    </p>
                  )}
                </div>

        
                <div>
                  <label className="block mb-2 text-sm">
                    발급 기관
                  </label>
                  <input
                    type="text"
                    value={FIXED_ISSUER}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                    readOnly
                  />
                </div>

           
                <div>
                  <label className="block mb-2 text-sm">
                    발급 용도 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    disabled={availableCertificateOptions.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white appearance-none"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1em'
                    }}
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

           
              <div className="space-y-6">
                <h2 className="text-xl border-b border-gray-200 pb-2">프로필 사진</h2>
                
                <div>
                  <label className="block mb-2 text-sm">
                    프로필 사진 업로드 <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm mb-4">수료증에 사용될 프로필 사진을 업로드해주세요. (JPG, PNG, 5MB 이하)</p>
                  
                  <div className="flex items-start space-x-6">
                 
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
                            <div className="w-12 h-12 mx-auto mb-2 bg-gray-400 rounded flex items-center justify-center">
                              <div className="w-8 h-8 bg-gray-300 rounded"></div>
                            </div>
                            <p className="text-xs">미리보기</p>
                          </div>
                        )}
                      </div>
                    </div>

                  
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={availableCertificateOptions.length === 0}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={availableCertificateOptions.length === 0}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors flex flex-col items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded mb-2 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded"></div>
                        </div>
                        <span className="text-sm">클릭하여 이미지 선택</span>
                        <span className="text-xs mt-1">JPG, PNG 파일 (최대 5MB)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

         
              {(formData.certificateName || formData.reason || imagePreview) && (
                <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
                  <h3 className="text-lg  mb-4">요청 정보 미리보기</h3>
                  <div className="bg-white rounded-lg p-6 border space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg">{formData.certificateName || "수료증 이름 미입력"}</h4>
                        <p className="text-sm mt-1">발급기관: {FIXED_ISSUER}</p>
                        <p className="text-sm">발급 용도: {formData.reason || "미입력"}</p>
                      </div>
                      {imagePreview && (
                        <div className="ml-4">
                          <img src={imagePreview} alt="프로필" className="w-16 h-16 object-cover rounded-full border-2 border-gray-200" />
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="text-sm  mb-3">수료자 정보</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-xs">이름</span>
                          <span className="text-base">{user?.userName || "미입력"}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-xs">생년월일</span>
                          <span className="text-base">
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

              
              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-4 px-6 rounded-lg transition-all duration-200 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg transform hover:-translate-y-0.5"
                >
                  {availableCertificateOptions.length === 0 
                    ? "발급 가능한 수료증이 없습니다" 
                    : !canSubmit 
                    ? "모든 필수 항목을 입력해주세요" 
                    : "발급 요청하기"}
                </button>
                
                {availableCertificateOptions.length > 0 && !canSubmit && (
                  <div className="mt-3 text-sm text-center">
                    <span className="text-red-500">*</span> 수료증 이름, 발급 용도, 프로필 이미지를 모두 입력해주세요.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

     
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => !certificateMutation.isPending && setShowModal(false)}
            title={
              modalType === "loading" ? "발급 요청 처리 중" :
              modalType === "success" ? "발급 요청 성공" : 
              modalType === "error" ? "발급 요청 실패" : 
              "처리 중"
            }
          >
            <div className="text-center">
              <div className="mb-4">
                {modalType === "loading" ? (
                  <div className="w-12 h-12 mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : modalType === "success" ? (
                  <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded"></div>
                  </div>
                ) : modalType === "error" ? (
                  <div className="w-12 h-12 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded"></div>
                  </div>
                ) : (
                  <div className="w-12 h-12 mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              <p className="text-lg  mb-2">
                {modalMessage || (
                  modalType === "loading" ? "요청을 처리하고 있습니다..." :
                  modalType === "success" ? "요청이 성공적으로 처리되었습니다!" : 
                  modalType === "error" ? "요청 처리 중 오류가 발생했습니다." : 
                  "처리 중입니다..."
                )}
              </p>
              
              {modalType === "loading" && (
                <p className="text-sm">잠시만 기다려주세요...</p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}