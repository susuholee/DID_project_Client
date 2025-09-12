'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/Store/userStore';
import UserSidebar from '@/components/layout/Sidebar';

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoggedIn } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  


  // 안전한 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!mounted || !dateString) return '미설정';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch (error) {
      return '미설정';
    }
  };

  // 서버 사이드 렌더링 중에는 로딩 표시
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 로딩 표시
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                <span className="ml-3 text-lg text-gray-600">로그인 확인 중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
          </div>

          {/* 프로필 카드 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 프로필 헤더 */}
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-8 text-white">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={user?.profileImage || user?.imgPath || '/images/default.png'}
                    alt="프로필"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  {/* 카카오 계정 표시 */}
                  {user?.kakaoId && (
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1">
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.199 0 4.535-4.701 8.199-10.5 8.199-1.6 0-3.1-.3-4.4-.8l-3.1 1.4c-.4.2-.9-.1-.8-.6l.6-2.9C2.6 15.4 1.5 13.9 1.5 11.2 1.5 6.664 6.201 3 12 3z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {user?.userName || user?.nickName || '사용자'}
                  </h2>
                  <p className="text-cyan-100 mb-2">
                    {user?.kakaoId ? '카카오 계정' : user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                    {user?.nickname && user?.userName !== user?.nickname && (
                      <span className="ml-2 text-sm">• 카카오 닉네임: {user.nickname}</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-emerald-500/30 px-3 py-1 rounded-full">
                      활성 계정
                    </span>
                    {user?.kakaoId && (
                      <span className="bg-yellow-400/30 px-3 py-1 rounded-full">
                        카카오 연동
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 프로필 정보 */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    기본 정보
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">이름</span>
                      <span className="text-gray-800 font-semibold">
                        {user?.userName || '미설정'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">닉네임</span>
                      <span className="text-gray-800 font-semibold">
                        {user?.nickname || user?.nickName || '미설정'}
                      </span>
                    </div>
                
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">생년월일</span>
                      <span className="text-gray-800 font-semibold">
                        {formatDate(user?.birthDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">주소</span>
                      <span className="text-gray-800 font-semibold">
                        {user?.address || '미설정'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">가입일</span>
                      <span className="text-gray-800 font-semibold">
                        {formatDate(user?.createdAt) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 계정 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    계정 정보
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">계정 유형</span>
                      <span className="text-gray-800 font-semibold">
                         {user?.kakaoId ? '카카오 계정' : user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                      </span>
                    </div>
                    
                
                    
                    {(user?.didAddress || user?.walletAddress) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">DID 정보</h4>
                        <div className="space-y-3">
                          {user?.didAddress && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-gray-600 font-medium text-xs">DID 계정 주소</span>
                              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                <span className="text-gray-800 font-mono text-xs break-all">
                                  {user.didAddress}
                                </span>
                              </div>
                            </div>
                          )}
                          {user?.walletAddress && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-gray-600 font-medium text-xs">지갑 주소</span>
                              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                <span className="text-gray-800 font-mono text-xs break-all">
                                  {user.walletAddress}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}