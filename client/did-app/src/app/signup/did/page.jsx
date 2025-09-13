"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import Modal from "@/components/UI/Modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import useUserStore from "@/Store/userStore";
import axios from "axios";

const DIDSignupPage = () => {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const detailRef = useRef(null);
  const router = useRouter();
  const { setUser } = useUserStore();
  
  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  // 다음 주소 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 카카오 사용자 정보 가져오기
  const { data: kakaoUserInfo, isLoading, error, isSuccess } = useQuery({
    queryKey: ['kakaoUserInfo'],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/oauth`,
        { withCredentials: true }
      );
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // 이미 DID 계정이 있는지 확인
  useEffect(() => {
    const checkExistingUser = async () => {
      if (!kakaoUserInfo?.id) return;
      
      try {
        console.log('기존 사용자 확인 중... userId:', kakaoUserInfo.id);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${kakaoUserInfo.id}`,
          { withCredentials: true }
        );
        
        if (response.data.state === 200 && response.data.data && response.data.data.length > 0) {
          // 이미 DID 계정이 존재함
          const existingUser = response.data.data[0];
          console.log('기존 DID 계정 발견:', existingUser);
          
          // DID 정보가 있는지 확인
          if (existingUser.walletAddress && existingUser.didAddress) {
            // 완전한 사용자 정보를 Zustand에 저장
            const completeUserInfo = {
              id: existingUser.id,
              userName: existingUser.userName,
              userId: existingUser.userId,
              nickName: existingUser.nickName,
              password: existingUser.password,
              birthDate: existingUser.birthDate,
              address: existingUser.address,
              imgPath: existingUser.imgPath,
              
              // DID 정보
              walletAddress: existingUser.walletAddress,
              didAddress: existingUser.didAddress,
              
              // 시스템 정보
              createdAt: existingUser.createdAt,
              updatedAt: existingUser.updatedAt,
              
              // 카카오 계정 타입
              type: 'kakao',
              isLoggedIn: true
            };
            
            console.log('기존 사용자 정보 저장 후 대시보드로 이동');
            setUser(completeUserInfo);
            router.push('/dashboard');
            return;
          } else {
            console.log('사용자는 존재하지만 DID 정보가 없음 - DID 생성 필요');
          }
        }
      } catch (error) {
        // 404 또는 사용자 없음 - 신규 사용자이므로 DID 생성 페이지 계속 표시
        console.log('신규 사용자 - DID 생성 필요:', error.response?.status);
      }
    };
    
    // 카카오 사용자 정보 로딩이 완료된 후에만 확인
    if (isSuccess && kakaoUserInfo) {
      checkExistingUser();
    }
  }, [isSuccess, kakaoUserInfo, router, setUser]);

  // DID 생성 요청 - 서버에서 모든 DID 처리 완료
  const didCreateMutation = useMutation({
    mutationFn: async (userData) => {
      console.log('=== API 요청 시작 ===');
      console.log('요청 URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/register`);
      console.log('요청 데이터:', userData);
      
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/register`,
          userData,
          { withCredentials: true }
        );
        
        console.log('=== API 응답 성공 ===');
        console.log('응답 상태:', response.status);
        console.log('응답 데이터:', response.data);
        
        return response.data;
      } catch (error) {
        console.log('=== API 요청 실패 ===');
        console.log('에러:', error);
        console.log('응답 상태:', error.response?.status);
        console.log('응답 데이터:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('=== DID 생성 완료 (onSuccess 호출됨) ===');
      console.log('서버 응답:', data);
      
      // 서버에서 DID 생성이 완료되었으므로, 입력한 정보로 사용자 정보 구성
      const userInfo = {
        userName: name.trim(),
        birthDate: birth,
        address: `${address.trim()} ${detail.trim()}`.trim(),
        userId: kakaoUserInfo?.id?.toString(),
        nickName: kakaoUserInfo?.properties?.nickname,
        imgPath: kakaoUserInfo?.properties?.profile_image,
        type: 'kakao',
        isLoggedIn: true
      };
      
      console.log('=== 사용자 정보 저장 ===');
      console.log('userInfo:', userInfo);
      
      // Zustand에 저장
      setUser(userInfo);
      
      console.log('=== 모달 표시 ===');
      
      // 성공 모달 표시
      setModalMessage("DID 계정이 성공적으로 생성되었습니다! 대시보드로 이동합니다.");
      setModalType("success");
      setShowModal(true);
    },
    onError: (error) => {
      console.log('=== DID 생성 실패 (onError 호출됨) ===');
      console.error('에러 전체:', error);
      console.error('에러 메시지:', error.message);
      console.error('응답 상태:', error.response?.status);
      console.error('응답 데이터:', error.response?.data);
      
      // 에러 모달 표시
      setModalMessage(error.response?.data?.message || error.message || "가입 중 오류가 발생했습니다.");
      setModalType("error");
      setShowModal(true);
    }
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-cyan-500 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">카카오 사용자 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-500 mb-3 text-sm">사용자 정보를 불러오는데 실패했습니다.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
          >
            다시 시도
          </Button>
        </div>
      </main>
    );
  }

  const openAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      setModalMessage("주소검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        let addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        setAddress(addr);
        if (detailRef.current) detailRef.current.focus();
      },
    }).open();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== 폼 제출 시작 ===');
    console.log('name:', name);
    console.log('birth:', birth);
    console.log('address:', address);
    console.log('detail:', detail);
    console.log('kakaoUserInfo:', kakaoUserInfo);
    
    const userData = {
      userName: name.trim(),
      birthDate: birth,
      address: `${address.trim()} ${detail.trim()}`.trim(),
      kakaoId: kakaoUserInfo?.id,
      nickname: kakaoUserInfo?.properties?.nickname
    };

    console.log('DID 생성 요청 데이터:', userData);
    console.log('=== Mutation 실행 ===');
    
    didCreateMutation.mutate(userData);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-4 text-white">
          <h1 className="text-lg sm:text-xl font-bold mb-1">DID 정보 입력</h1>
          <p className="text-cyan-100 text-xs">DID 계정 생성을 위한 정보를 입력해주세요</p>
        </div>
        
        <div className="p-4 sm:p-6">
          {kakaoUserInfo && (
            <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {kakaoUserInfo.properties?.profile_image && (
                  <img 
                    src={kakaoUserInfo.properties.profile_image}
                    alt="카카오 프로필"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {kakaoUserInfo.properties?.nickname || '사용자'}
                  </p>
                  <p className="text-xs text-gray-600">카카오 로그인</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4" noValidate>
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">이름 (실명)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="실명을 입력해주세요"
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">생년월일</label>
              <Input
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">주소</label>
              <div className="flex gap-2">
                <Input 
                  value={address} 
                  placeholder="주소를 검색해주세요" 
                  readOnly 
                  required 
                  className="flex-1 text-sm"
                />
                <Button 
                  type="button" 
                  onClick={openAddressSearch}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-xs"
                >
                  주소 검색
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">상세주소</label>
              <Input
                ref={detailRef}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="상세주소를 입력해주세요 (선택사항)"
                className="w-full text-sm"
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2.5 sm:py-3 rounded-lg font-medium shadow-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                disabled={!name || !birth || !address || didCreateMutation.isPending}
              >
                {didCreateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    DID 생성 중...
                  </span>
                ) : (
                  'DID 계정 생성하기'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            if (modalType === "success") {
              router.push('/dashboard');
            }
          }}
          title={
            modalType === "success" ? "가입 완료" : 
            modalType === "error" ? "가입 실패" : 
            "알림"
          }
        >
          <div className="text-center px-2">
            <div className="mb-6">
              {modalType === "success" ? (
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : modalType === "error" ? (
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
              )}
            </div>
            
            <p className="text-base sm:text-lg font-medium text-gray-900 mb-2 leading-relaxed">
              {modalMessage}
            </p>
          </div>
        </Modal>
      )}
    </main>
  );
};

export default DIDSignupPage;