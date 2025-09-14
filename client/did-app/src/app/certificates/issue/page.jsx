"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import Modal from "@/components/UI/Modal";
import useUserStore from "@/Store/userStore";
import { useWebSocket } from "@/Store/socketStore";



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

// 사용자의 모든 수료증 요청 내역을 가져오는 API 함수 (중복 방지용)
const fetchUserCertificates = async (userId) => {
  console.log('🔍 VC 요청 로그 데이터 요청 시작 - userId:', userId);
  
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`, {
      withCredentials: true,
    });
    
    console.log('✅ API 응답 성공:', response.data);
    
    // API 응답 구조: { state: 200, message: "...", data: [...] }
    if (response.data.state === 200 && response.data.data) {
      const allRequests = response.data.data;
      console.log('📄 전체 요청 로그 개수:', allRequests.length);
      
      // 현재 사용자의 모든 발급 요청 (pending, approved 모두 포함)
      const userAllIssueRequests = allRequests
        .filter(log => {
          const isCurrentUser = log.userId === userId;
          const isIssueRequest = log.request === 'issue';
          // rejected는 제외, pending과 approved만 포함
          const isValidStatus = log.status === 'pending' || log.status === 'approved';
          
          console.log(`\n=== 요청 ${log.id} 상세 분석 ===`);
          console.log(`수료증명: ${log.certificateName}`);
          console.log(`log.userId: "${log.userId}" (타입: ${typeof log.userId})`);
          console.log(`현재 userId: "${userId}" (타입: ${typeof userId})`);
          console.log(`userId 일치: ${isCurrentUser}`);
          console.log(`log.request: "${log.request}"`);
          console.log(`request === 'issue': ${isIssueRequest}`);
          console.log(`log.status: "${log.status}"`);
          console.log(`유효한 상태 (pending/approved): ${isValidStatus}`);
          console.log(`최종 필터링: ${isCurrentUser && isIssueRequest && isValidStatus}`);
          console.log('================================\n');
          
          return isCurrentUser && isIssueRequest && isValidStatus;
        })
        .map(log => ({
          certificateName: log.certificateName,
          status: log.status,
          request: log.request,
          requestedAt: log.createdAt,
          id: log.id
        }));
        
      console.log('📄 처리된 유효한 요청 (pending + approved):', userAllIssueRequests);
      
      // pending 상태만 별도로 분리 (UI 표시용)
      const pendingRequests = userAllIssueRequests.filter(req => req.status === 'pending');
      console.log('⏳ pending 상태 요청:', pendingRequests);
      
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
    console.error('❌ API 요청 실패:', error);
    throw error;
  }
};

// 수료증 발급 요청 API 함수
const requestCertificate = async (requestData) => {
  const formDataToSend = new FormData();
  
  // 필수 필드들 추가 - userId 사용
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

export default function IssueCertificatePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();


  // zustand store 연결 (addNotification 제거)
  const { user } = useUserStore();
  const {socket} = useWebSocket();
  // 사용자의 기존 수료증 내역 조회 - 모든 상태 포함
  const { data: certificateData = { allRequests: [], pendingRequests: [] }, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['userCertificates', user?.userId],
    queryFn: () => fetchUserCertificates(user?.userId),
    enabled: !!(user?.userId),
    staleTime: 2 * 60 * 1000, // 2분간 fresh (캐시 우선 사용)
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnMount: 'always', // 마운트 시 항상 refetch (최신 데이터 보장)
    refetchOnWindowFocus: true, // 윈도우 포커스 시 refetch
    retry: (failureCount, error) => {
      // 401/403 에러는 재시도하지 않음
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      console.error('수료증 내역 조회 실패:', error);
      if (error?.response?.status === 401) {
        console.log('인증 오류 - 로그인 필요');
      }
    },
    // 백그라운드에서 자동 refetch 설정
    refetchInterval: 3 * 60 * 1000, // 3분마다 백그라운드 업데이트
    refetchIntervalInBackground: true // 백그라운드에서도 업데이트
  });

  // 모든 발급 요청된 수료증 이름들 (pending + approved)
  const getAllRequestedCertificateNames = useMemo(() => {
    if (!certificateData.allRequests || !Array.isArray(certificateData.allRequests)) return new Set();
    
    console.log('🔍 모든 수료증 데이터 (pending + approved):', certificateData.allRequests);
    
    const allCerts = certificateData.allRequests.map(cert => cert.certificateName);
    
    console.log('🚫 발급 불가능한 수료증 목록 (이미 요청했거나 발급받음):', allCerts);
    return new Set(allCerts);
  }, [certificateData.allRequests]);

  // pending 상태의 수료증 이름들 (UI 표시용)
  const getPendingCertificateNames = useMemo(() => {
    if (!certificateData.pendingRequests || !Array.isArray(certificateData.pendingRequests)) return new Set();
    
    console.log('🔍 pending 수료증 데이터:', certificateData.pendingRequests);
    
    const pendingCerts = certificateData.pendingRequests.map(cert => cert.certificateName);
    
    console.log('⏳ 승인 대기 중인 수료증 목록:', pendingCerts);
    return new Set(pendingCerts);
  }, [certificateData.pendingRequests]);

  // 사용 가능한 수료증 옵션 (모든 요청 이력 제외)
  const availableCertificateOptions = useMemo(() => {
    return CERTIFICATE_OPTIONS.filter(option => 
      !getAllRequestedCertificateNames.has(option.value)
    );
  }, [getAllRequestedCertificateNames]);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  // useMutation 설정 (알림 기능 제거)
  const certificateMutation = useMutation({
    mutationFn: requestCertificate,
    onSuccess: async (data) => {
      console.log("서버 응답:", data);

      // 성공 모달 표시
      setModalMessage("수료증 발급 요청이 성공적으로 제출되었습니다!");
      setModalType("success");
      setShowModal(true);

      // 관련 캐시 무효화하여 최신 데이터 반영
      await queryClient.invalidateQueries({
        queryKey: ['userCertificates', user?.userId]
      });
      
      // 수료증 목록 캐시도 무효화 (다른 페이지에서도 최신 데이터 반영)
      await queryClient.invalidateQueries({
        queryKey: ['certificates', user?.userId]
      });

      // 성공 시 잠시 후 페이지 이동 (setTimeout 추가)
      setTimeout(() => {
        setShowModal(false);
        router.push("/certificates/request");
      }, 2000);
    },
    onError: (error) => {
      console.error("발급 요청 실패:", error);
      
      // 간단한 에러 처리
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

  // 실제 파일 객체를 저장할 상태 추가
  const [imageFile, setImageFile] = useState(null);

  // 이미지 미리보기 URL
  const [imagePreview, setImagePreview] = useState(null);

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
    console.log(socket, 'socket')
    socket.emit("sendNotification", {
      id: user.userId, 
      title : '수료증 발급',  
      message: "Hello from frontend!",
      ts: Date.now() - 1000 * 60 * 5,
      read : false
     });

    console.log("🚀 handleSubmit 시작");
    console.log("🔍 사용자 정보:", user);
    console.log("🔍 폼 데이터:", formData);
    console.log("🔍 이미지 파일:", imageFile);

    if (!user) {
      console.log("❌ 사용자 정보 없음");
      setModalMessage("로그인이 필요합니다.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // 필수 필드 검증 (프로필 이미지 추가)
    if (!formData.certificateName.trim() || !formData.reason.trim() || !imageFile) {
      console.log("❌ 필수 필드 누락:", {
        certificateName: formData.certificateName.trim(),
        reason: formData.reason.trim(),
        imageFile: !!imageFile
      });
      setModalMessage("모든 필수 정보를 입력해주세요. (수료증 이름, 발급 용도, 프로필 이미지)");
      setModalType("error");
      setShowModal(true);
      return;
    }

    // 강화된 중복 수료증 검증 (pending + approved 모두 확인)
    if (getAllRequestedCertificateNames.has(formData.certificateName.trim())) {
      console.log("❌ 중복 수료증:", formData.certificateName.trim());
      console.log("❌ 이미 요청된 수료증 목록:", Array.from(getAllRequestedCertificateNames));
      
      // 더 구체적인 에러 메시지 제공
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

    console.log("✅ 모든 검증 통과, API 요청 시작");

    // 로딩 모달 표시
    setModalMessage("수료증 발급 요청을 처리하고 있습니다...");
    setModalType("loading");
    setShowModal(true);
    
    // 요청 데이터 준비 - userId 우선 사용
    const requestData = {
      userName: user.userName,
      userId: user.userId || user.id, // userId 우선, 없으면 id 사용
      certificateName: formData.certificateName.trim(),
      description: formData.reason,
      requestDate: new Date().toISOString().split('T')[0],
      request: 'issue',
      DOB: user.birthDate,
      imageFile: imageFile
    };

    // 디버깅용 로그 추가
    console.log("🔍 요청 데이터:", {
      ...requestData,
      imageFile: requestData.imageFile ? `파일명: ${requestData.imageFile.name}, 크기: ${requestData.imageFile.size}` : '파일 없음'
    });

    try {
      console.log("📡 API 요청 전송 중...");
      // useMutation 실행
      await certificateMutation.mutateAsync(requestData);
      console.log("✅ API 요청 성공");
    } catch (error) {
      console.error("❌ API 요청 실패:", error);
      // 에러는 onError에서 처리됨
    }
  };

  // 제출 가능 조건 (프로필 이미지 추가)
  const canSubmit = formData.certificateName.trim() && 
        formData.reason.trim() &&
        imageFile && // 프로필 이미지 필수
        !certificateMutation.isPending &&
        availableCertificateOptions.length > 0;

  // 캐시된 데이터가 있으면 로딩 표시 안함
  const hasCache = queryClient.getQueryData(['userCertificates', user?.userId]);
  
  // 로딩 중일 때 표시 (캐시 데이터가 없을 때만)
  if (certificatesLoading && !hasCache) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
              <p className="text-gray-600">수료증 발급 내역을 확인하고 있습니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            
            {/* 사용 가능한 수료증이 없을 때 알림 */}
            {availableCertificateOptions.length === 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">발급 가능한 수료증이 없습니다</h3>
                    <p className="text-sm text-yellow-700 mt-1">모든 수료증을 이미 요청했거나 발급받으셨습니다. 하나의 수료증당 1개씩만 발급 가능합니다.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 수료증 요청 내역 통합 표시 */}
            {getAllRequestedCertificateNames.size > 0 && (
              <div className="mb-6 bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-cyan-800">
                    수료증 발급 내역 ({getAllRequestedCertificateNames.size}개)
                  </h3>
                </div>

                {/* 승인 대기 중인 수료증 */}
                {getPendingCertificateNames.size > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-cyan-300 rounded-full mr-2"></div>
                      <h4 className="text-sm font-medium text-gray-700">승인 대기 중 ({getPendingCertificateNames.size}개)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(getPendingCertificateNames).map((certName, index) => (
                        <span key={`pending-${certName}-${index}`} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-400 to-cyan-800 text-white shadow-sm">
                          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate max-w-[120px] sm:max-w-none">{certName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 이미 발급받은 수료증 */}
                {(getAllRequestedCertificateNames.size > getPendingCertificateNames.size) && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                      <h4 className="text-sm font-medium text-gray-700">발급 완료 ({getAllRequestedCertificateNames.size - getPendingCertificateNames.size}개)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {certificateData.allRequests
                        .filter(cert => cert.status === 'approved')
                        .map((cert, index) => (
                          <span key={`approved-${cert.certificateName}-${index}`} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-sm">
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate max-w-[120px] sm:max-w-none">{cert.certificateName}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* 안내 메시지 */}
                <div className="bg-white/70 rounded-lg p-3 border border-cyan-200/50">
                  <p className="text-xs sm:text-sm text-cyan-700 flex items-start">
                    <svg className="w-4 h-4 mr-2 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>위 수료증들은 이미 요청했거나 발급받았으므로 중복 신청할 수 없습니다. 각 수료증은 한 번만 발급 가능합니다.</span>
                  </p>
                </div>
              </div>
            )}
      
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
                    <p className="mt-1 text-sm text-gray-500">
                      모든 수료증을 이미 요청하셨습니다. 하나의 수료증당 1개씩만 발급 가능합니다.
                    </p>
                  )}
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

              {/* 프로필 사진 섹션 */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">프로필 사진</h2>
                
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    프로필 사진 업로드 <span className="text-red-500">*</span>
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
                        disabled={availableCertificateOptions.length === 0}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={availableCertificateOptions.length === 0}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors flex flex-col items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
              {(formData.certificateName || formData.reason || imagePreview) && (
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
                  {availableCertificateOptions.length === 0 
                    ? "발급 가능한 수료증이 없습니다" 
                    : !canSubmit 
                    ? "모든 필수 항목을 입력해주세요" 
                    : "발급 요청하기"}
                </button>
                
                {availableCertificateOptions.length > 0 && !canSubmit && (
                  <div className="mt-3 text-sm text-gray-500 text-center">
                    <span className="text-red-500">*</span> 수료증 이름, 발급 용도, 프로필 이미지를 모두 입력해주세요.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* 모달 */}
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
              
              <p className="text-lg font-medium text-gray-900 mb-2">
                {modalMessage || (
                  modalType === "loading" ? "요청을 처리하고 있습니다..." :
                  modalType === "success" ? "요청이 성공적으로 처리되었습니다!" : 
                  modalType === "error" ? "요청 처리 중 오류가 발생했습니다." : 
                  "처리 중입니다..."
                )}
              </p>
              
              {modalType === "loading" && (
                <p className="text-sm text-gray-600">잠시만 기다려주세요...</p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}