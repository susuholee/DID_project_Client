'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/Store/userStore';
import UserSidebar from '@/components/layout/Sidebar';

export default function ProfilePage() {
  const { user, isLoggedIn } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // 로그인 체크
    if (!isLoggedIn || !user) {
      router.push('/');
      return;
    }
  }, [isLoggedIn, user, router]);

  // 로그인하지 않은 경우 로딩 표시
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">내 프로필</h1>
            <p className="text-gray-600">Sealium에서 사용하는 내 계정 정보입니다.</p>
          </div>

          {/* 프로필 카드 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 프로필 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <div className="flex items-center space-x-6">
                <div className="relative">
                                     <img
                     src={user?.imgPath || '/images/default.png'}
                     alt="프로필"
                     className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                   />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
                <div>
                                     <h2 className="text-2xl font-bold mb-1">
                     {user?.nickName || user?.userName || '사용자'}
                   </h2>
                   <p className="text-blue-100 mb-2">
                     {user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                   </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-blue-500/30 px-3 py-1 rounded-full">
                      DID 인증 완료
                    </span>
                    <span className="bg-green-500/30 px-3 py-1 rounded-full">
                      활성 계정
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 프로필 정보 */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">👤</span>
                    기본 정보
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">이름</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.name || user?.nickName || '미설정'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">이메일</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.email || '미설정'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">생년월일</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ko-KR') : '미설정'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">주소</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.address || '미설정'}
                       </span>
                    </div>
                  </div>
                </div>

                {/* 계정 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2"></span>
                    계정 정보
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">사용자 ID</span>
                                             <span className="text-gray-800 font-mono text-sm">
                         {user?.id || 'N/A'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">가입일</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">마지막 로그인</span>
                                             <span className="text-gray-800 font-semibold">
                         {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : 'N/A'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">계정 상태</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        활성
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            {/* DID 정보 */}
               {(user?.didAddress || user?.walletAddress) && (
                 <div className="mt-8 pt-8 border-t border-gray-200">
                   <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                     <span className="mr-2"></span>
                     DID 정보
                   </h3>
                   <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                     {user?.didAddress && (
                       <div className="flex flex-col space-y-2">
                         <span className="text-gray-600 font-medium text-sm">DID 주소</span>
                         <div className="bg-white rounded-lg p-3 border border-gray-200">
                           <span className="text-gray-800 font-mono text-sm break-all">
                             {user.didAddress}
                           </span>
                         </div>
                       </div>
                     )}
                     {user?.walletAddress && (
                       <div className="flex flex-col space-y-2">
                         <span className="text-gray-600 font-medium text-sm">지갑 주소</span>
                         <div className="bg-white rounded-lg p-3 border border-gray-200">
                           <span className="text-gray-800 font-mono text-sm break-all">
                             {user.walletAddress}
                           </span>
                         </div>
                       </div>
                     )}
                     <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <span className="text-sm text-green-600 font-medium">DID 인증 완료</span>
                     </div>
                   </div>
                 </div>
               )}

              {/* 액션 버튼 */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <span className="mr-2"></span>
                    정보 수정
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <span className="mr-2"></span>
                    대시보드로 이동
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
