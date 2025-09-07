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
                     src={user?.imgPath || '/images/default.png'}
                     alt="프로필"
                     className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                   />
                </div>
                <div>
                                     <h2 className="text-2xl font-bold mb-1">
                     {user?.nickName || user?.userName || '사용자'}
                   </h2>
                   <p className="text-cyan-100 mb-2">
                     {user?.type === 'kakao' ? '카카오 계정' : '일반 계정'}
                   </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-emerald-500/30 px-3 py-1 rounded-full">
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                     <div className="flex justify-between items-center py-3 border-b border-gray-100">
                       <span className="text-gray-600 font-medium">가입일</span>
                                              <span className="text-gray-800 font-semibold">
                         {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
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
                       <span className="text-gray-600 font-medium">사용자 ID</span>
                                              <span className="text-gray-800 font-mono text-sm">
                         {user?.id || 'N/A'}
                       </span>
                     </div>
                     <div className="flex justify-between items-center py-3 border-b border-gray-100">
                       <span className="text-gray-600 font-medium">마지막 로그인</span>
                                              <span className="text-gray-800 font-semibold">
                         {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : 'N/A'}
                       </span>
                     </div>
                     {(user?.didAddress || user?.walletAddress) && (
                       <div className="mt-4 pt-4 border-t border-gray-200">
                         <h4 className="text-sm font-semibold text-gray-800 mb-3">DID 정보</h4>
                         <div className="space-y-3">
                           {user?.didAddress && (
                             <div className="flex flex-col space-y-1">
                               <span className="text-gray-600 font-medium text-xs">DID 주소</span>
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
