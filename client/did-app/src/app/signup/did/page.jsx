"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { useQuery, useMutation } from "@tanstack/react-query";
import useUserStore from "@/Store/userStore";
import useModal from "@/hooks/useModal";
import axios from "axios";

const DIDSignupPage = () => {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const detailRef = useRef(null);
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const { setUser } = useUserStore();

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
      
      console.log('=== 모달 열기 시도 ===');
      console.log('openModal 함수:', openModal);
      
      // 성공 모달 표시 후 대시보드로 이동
      try {
        openModal({
          title: "가입 완료",
          content: "DID 계정이 성공적으로 생성되었습니다! 대시보드로 이동합니다.",
          onConfirm: () => {
            console.log('=== 모달 확인 버튼 클릭 ===');
            closeModal();
            router.push('/dashboard');
          }
        });
        console.log('=== openModal 호출 완료 ===');
      } catch (modalError) {
        console.error('=== 모달 열기 에러 ===', modalError);
        // 모달이 안되면 직접 이동
        alert('DID 계정이 성공적으로 생성되었습니다!');
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      console.log('=== DID 생성 실패 (onError 호출됨) ===');
      console.error('에러 전체:', error);
      console.error('에러 메시지:', error.message);
      console.error('응답 상태:', error.response?.status);
      console.error('응답 데이터:', error.response?.data);
      
      try {
        openModal({
          title: "가입 실패",
          content: error.response?.data?.message || error.message || "가입 중 오류가 발생했습니다.",
          onConfirm: () => {
            closeModal();
          }
        });
      } catch (modalError) {
        console.error('=== 에러 모달 열기 실패 ===', modalError);
        alert(error.response?.data?.message || error.message || "가입 중 오류가 발생했습니다.");
      }
    }
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-gray-600">카카오 사용자 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 text-center">
          <p className="text-red-500 mb-4">사용자 정보를 불러오는데 실패했습니다.</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </main>
    );
  }

  const openAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      openModal({
        title: "주소 검색 오류",
        content: "주소검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        onConfirm: () => {
          closeModal();
        }
      });
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">DID 정보 입력</h1>
        
        {kakaoUserInfo && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              {kakaoUserInfo.properties?.profile_image && (
                <img 
                  src={kakaoUserInfo.properties.profile_image}
                  alt="카카오 프로필"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
              )}
              <div>
                <p className="font-semibold text-lg">{kakaoUserInfo.properties?.nickname || '사용자'}</p>
                <p className="text-sm text-gray-600">카카오 로그인</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름(실명)"
            required
          />
          <Input
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Input value={address} placeholder="주소" readOnly required />
            <Button type="button" onClick={openAddressSearch}>
              주소 검색
            </Button>
          </div>
          <Input
            ref={detailRef}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세주소"
          />

          <Button
            type="submit"
            className="w-full bg-rose-400 text-black py-3 rounded cursor-pointer"
            disabled={!name || !birth || !address || didCreateMutation.isPending}
          >
            {didCreateMutation.isPending ? "DID 생성 중..." : "DID 생성"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default DIDSignupPage;