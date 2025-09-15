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

  



  const formatDate = (dateString) => {
    if (!mounted || !dateString) return '미설정';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch (error) {
      return '미설정';
    }
  };

  
  if (!mounted) {
    return (
      <div className="min-h-screen">
        <UserSidebar />
        <div className="lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                <span className="ml-3 text-lg">로딩 중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen">
        <UserSidebar />
        <div className="lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                <span className="ml-3 text-lg">로그인 확인 중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <UserSidebar />
      <div className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
          </div>

        
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
           
            <div className="relative bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 p-8 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <img
                    src={user?.profileImage || user?.imgPath || '/images/default.png'}
                    alt="프로필"
                    className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl"
                  />
                  {/* 카카오 계정 표시 */}
                  {user?.kakaoId && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-2 shadow-lg">
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.199 0 4.535-4.701 8.199-10.5 8.199-1.6 0-3.1-.3-4.4-.8l-3.1 1.4c-.4.2-.9-.1-.8-.6l.6-2.9C2.6 15.4 1.5 13.9 1.5 11.2 1.5 6.664 6.201 3 12 3z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl  mb-2">
                    {user?.userName || user?.nickName || '사용자'}
                  </h2>
                  <p className="text-cyan-100 mb-3 text-lg">
                    {user?.kakaoId ? '카카오 계정' : user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                    {user?.nickname && user?.userName !== user?.nickname && (
                      <span className="ml-2 text-sm block sm:inline">• 카카오 닉네임: {user.nickname}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <span className="bg-emerald-500/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                      활성 계정
                    </span>
                    {user?.kakaoId && (
                      <span className="bg-yellow-400/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                        카카오 연동
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 프로필 정보 */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 기본 정보 */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-cyan-600 rounded"></div>
                    </div>
                    <h3 className="text-xl">기본 정보</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">이름</span>
                        <span>
                          {user?.userName || '미설정'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">닉네임</span>
                        <span>
                          {user?.nickname || user?.nickName || '미설정'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">생년월일</span>
                        <span>
                          {formatDate(user?.birthDate)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">주소</span>
                        <span>
                          {user?.address || '미설정'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">가입일</span>
                        <span>
                          {formatDate(user?.createdAt) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

       
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-cyan-600 rounded"></div>
                    </div>
                    <h3 className="text-xl">계정 정보</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-700">계정 유형</span>
                        <span>
                          {user?.kakaoId ? '카카오 계정' : user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                        </span>
                      </div>
                    </div>
                    
                    {(user?.didAddress || user?.walletAddress) && (
                      <div className="mt-6 pt-6 border-t border-cyan-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                            <div className="w-3 h-3 bg-cyan-600 rounded"></div>
                          </div>
                          <h4 className="text-lg">DID 정보</h4>
                        </div>
                        <div className="space-y-4">
                          {user?.didAddress && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <span className="text-sm block mb-2">DID 계정 주소</span>
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <span className="text-xs break-all">
                                  {user.didAddress}
                                </span>
                              </div>
                            </div>
                          )}
                          {user?.walletAddress && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <span className="text-sm block mb-2">지갑 주소</span>
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <span className="text-xs break-all">
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