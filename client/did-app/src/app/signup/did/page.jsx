"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import useUserStore from "@/Store/userStore";
import axios from "axios";

export default function DIDSignupPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const detailRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [error, setError] = useState(null);

  // 카카오 추가 정보 가져오기
  const getKakaoAdditionalInfo = async () => {
    if (!user || user.provider !== 'kakao') return;
    
    setKakaoLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/additional-info`, {
        withCredentials: true
      });
      
      if (res.data.name) setName(res.data.name);
      if (res.data.birth) setBirth(res.data.birth);
      if (res.data.address) setAddress(res.data.address);
      
    } catch (error) {
      console.error('카카오 추가 정보 가져오기 실패:', error);
      alert('카카오에서 추가 정보를 가져올 수 없습니다.');
    } finally {
      setKakaoLoading(false);
    }
  };

  // 다음 주소검색 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkUserAuth = async () => {
      console.log("checkUserAuth 실행, user:", user);
      
      if (!user) {
        try {
          console.log("사용자 정보 API 호출 시작");
          
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/oauth`, { 
            withCredentials: true,
            timeout: 10000
          });
          
          console.log("API 응답:", res.data);
          
          if (!mounted) return;
          
          const userData = {
            id: res.data.id,
            nickname: res.data.properties.nickname,
            profile: res.data.properties.profile_image,
            thumbnailImage: res.data.properties.thumbnail_image,
            provider: 'kakao'
          };
          
          setUser(userData);
          setLoading(false);
          
          if (userData.name) setName(userData.name);
          if (userData.address) setAddress(userData.address);
          if (userData.birth) setBirth(userData.birth);
          
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          
          if (!mounted) return;
          
          setLoading(false);
          setError('사용자 정보를 가져올 수 없습니다.');
          
          setTimeout(() => {
            if (mounted) {
              router.replace('/login?error=auth_required');
            }
          }, 3000);
        }
      } else {
        console.log("기존 user 존재:", user);
        setLoading(false);
        
        if (user.name) setName(user.name);
        if (user.address) setAddress(user.address);
        if (user.birth) setBirth(user.birth);
      }
    };

    checkUserAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 다음 주소검색 팝업 열기
  const openAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        let addr = '';
        let extraAddr = '';

        if (data.userSelectedType === 'R') {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        if(data.userSelectedType === 'R'){
          if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
            extraAddr += data.bname;
          }
          if(data.buildingName !== '' && data.apartment === 'Y'){
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if(extraAddr !== ''){
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        setAddress(addr + extraAddr);
        
        if (detailRef.current) {
          detailRef.current.focus();
        }
      }
    }).open();
  };


  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = {
      ...user,
      name,
      birth,
      address: `${address} ${detail}`.trim(),
    };

    setUser(updatedUser);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/register`,
        {
          name,
          birth,
          address: `${address} ${detail}`.trim(),
        },
        { withCredentials: true }
      );

      router.replace("/dashboard");
    } catch (error) {
      console.error('DID 정보 저장 실패:', error);
      alert('정보 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로그인 정보를 확인 중...</p>
          {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
          )}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-500">사용자 정보를 찾을 수 없습니다.</p>
          <p className="text-gray-500 mt-2">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">DID 정보 입력</h1>

        <div className="mb-5 flex items-center gap-3">
          {user.profile ? (
            <img
              src={user.profile}
              alt="프로필"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
              {(user.nickname ?? user.name ?? "유")[0]}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">연동된 소셜 정보</p>
            <p className="text-sm font-medium text-gray-900">
              {user.nickname ?? user.name ?? "사용자"}
            </p>
          </div>
        </div>

        {user.provider === 'kakao' && (
          <div className="mb-4">
            <Button
              type="button"
              onClick={getKakaoAdditionalInfo}
              disabled={kakaoLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 text-sm disabled:opacity-50"
            >
              {kakaoLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  정보 가져오는 중...
                </span>
              ) : (
                '카카오에서 정보 자동 입력'
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              카카오에 등록된 추가 정보를 가져올 수 있어요
            </p>
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
            <Button type="button" onClick={openAddressSearch}>주소 검색</Button>
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
            disabled={!name || !birth || !address}
          >
            DID 생성
          </Button>
        </form>
      </div>
    </main>
  );
}