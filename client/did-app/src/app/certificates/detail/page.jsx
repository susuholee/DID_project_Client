// src/app/certificates/detail/page.jsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUserStore from '@/Store/userStore';
import Certificate from '@/components/certificates/certificate';
import api from '@/lib/axios';
import axios from 'axios';
// Suspense로 감쌀 컴포넌트 분리
function CertificateDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateId = searchParams.get('id');
  const { user, isLoggedIn, addNotification } = useUserStore();
  const queryClient = useQueryClient();

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

const pushNotif = (title, message) => {
    try {
      if (user?.id || user?.userId) {
        // userId 없이 notification 객체만 전달
        addNotification({
          id: Date.now(),
          title,
          message,
          ts: Date.now(),
          read: false,
          userId: user.id || user.userId, // 필요시 notification 안에 userId 포함
        });
      }
    } catch (error) {
      console.error('알림 추가 중 오류:', error);
      // 사용자에게는 브라우저 기본 알림으로 대체
      alert(`${title}: ${message}`);
    }
  };

  // TanStack Query로 수료증 데이터 가져오기
  const { 
    data: certificate, 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['certificate-detail', certificateId, user?.userId],
    queryFn: async () => {
      if (!certificateId) {
        throw new Error('수료증 ID가 제공되지 않았습니다.');
      }

      if (!isLoggedIn || !user) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = user.userId || user.id;
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
      }

      // sessionStorage에서 먼저 확인
      const saved = sessionStorage.getItem('selectedCertificate');
      if (saved) {
        const cert = JSON.parse(saved);
        if (cert.id == certificateId) {
          return cert;
        }
      }

      // API에서 수료증 목록 가져와서 해당 ID 찾기
      const response = await api.get(`user/vc/${userId}`);
      
      if (Array.isArray(response.data)) {
        const foundCertificate = response.data.find(item => {
          const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                                 item.message?.verifiableCredential?.credentialSubject;
          return credentialSubject?.id == certificateId;
        });

        if (!foundCertificate) {
          throw new Error('해당 수료증을 찾을 수 없습니다.');
        }

        // Certificate 컴포넌트와 동일한 구조로 정규화
        const credentialSubject = foundCertificate.message?.payload?.vc?.credentialSubject || 
                               foundCertificate.message?.verifiableCredential?.credentialSubject;
        
        return {
          id: credentialSubject.id,
          title: credentialSubject.certificateName,
          certificateName: credentialSubject.certificateName,
          issuer: credentialSubject.issuer,
          issueDate: credentialSubject.issueDate || 
                   foundCertificate.message?.payload?.issuseDate || 
                   foundCertificate.message?.payload?.issuanceDate ||
                   foundCertificate.message?.verifiableCredential?.issuanceDate,
          status: credentialSubject.status === 'approved' ? '유효' : '폐기',
          imageUrl: credentialSubject.ImagePath,
          imagePath: credentialSubject.ImagePath,
          userName: credentialSubject.userName,
          userId: credentialSubject.userId,
          description: credentialSubject.description,
          userDid: credentialSubject.userDid,
          issuerId: credentialSubject.issuerId,
          DOB: credentialSubject.DOB,
          requestDate: credentialSubject.requestDate,
          request: credentialSubject.request,
          publicKey: credentialSubject.userDid,
          rawData: foundCertificate,
        };
      } else {
        throw new Error('수료증 데이터 형식이 올바르지 않습니다.');
      }
    },
    enabled: !!certificateId && !!user && isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    cacheTime: 10 * 60 * 1000, // 10분간 메모리에 유지
  });

  // 폐기 요청 mutation
  const revokeMutation = useMutation({
    mutationFn: async ({ userId, vcId, reason }) => {
      const formData = new FormData();
      
      // 폐기 요청 데이터 추가
      formData.append('userName', certificate.userName);
      formData.append('userId', userId);
      formData.append('certificateName', certificate.certificateName);
      formData.append('description', reason.trim());
      formData.append('request', 'revoke');
      formData.append('DOB', certificate.DOB);
      
      // 이미지 파일이 있으면 추가
      if (certificate.imagePath) {
        // 이미지 URL을 파일로 변환하거나 기본값 사용
        try {
          const response = await fetch(certificate.imagePath);
          const blob = await response.blob();
          const file = new File([blob], 'certificate-image.jpg', { type: blob.type });
          formData.append('file', file);
        } catch (error) {
          console.warn('이미지 파일 변환 실패:', error);
        }
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`, formData, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      pushNotif('폐기 요청 완료', `"${certificate?.title}" 폐기 요청이 관리자에게 전송되었습니다.`);
      
      // 관련 쿼리들 무효화하여 데이터 새로고침
      queryClient.invalidateQueries(['certificates', user?.userId]);
      queryClient.invalidateQueries(['certificate-detail', certificateId, user?.userId]);
      
      setRevokeModalOpen(false);
      setRevokeReason('');
    },
    onError: (error) => {
      console.error('폐기 요청 실패:', error);
      pushNotif('폐기 요청 실패', '폐기 요청 중 오류가 발생했습니다.');
    }
  });

  // 로그인 체크
  useEffect(() => {
    if (!isLoggedIn || !user) {
      router.push('/');
      return;
    }
  }, [isLoggedIn, user, router]);

  const displayName = user?.isKakaoUser ? user?.nickname : user?.name || '사용자';

  const getStatusBadge = (status) => {
    if (status === '유효') return 'bg-cyan-100 text-cyan-700 border-cyan-300';
    if (status === '폐기') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status === '만료') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status === '대기중') return 'bg-cyan-50 text-cyan-600 border-cyan-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // 액션 핸들러들
  const handleShare = async () => {
    const userId = certificate.userId || certificate.id;
    const certificateName = certificate.certificateName || certificate.title;

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${userId}/${certificateName}`;

    setShareUrl(url);
    setShareModalOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushNotif('링크 복사 완료', '공유 링크가 클립보드에 복사되었습니다.');
    } catch {
      pushNotif('복사 실패', '브라우저 보안 정책으로 복사에 실패했습니다.');
    }
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setShareUrl('');
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      return;
    }

    const userId = user.userId || user.id;
    if (!userId) {
      pushNotif('오류', '사용자 ID를 찾을 수 없습니다.');
      return;
    }

    console.log('폐기 요청 시작:', {
      userId,
      vcId: certificate.id,
      reason: revokeReason,
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`
    });

    revokeMutation.mutate({
      userId,
      vcId: certificate.id,
      reason: revokeReason
    });
  };

  const openRevokeModal = () => {
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const closeRevokeModal = () => {
    setRevokeModalOpen(false);
    setRevokeReason('');
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">수료증을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl text-red-500"></span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error.message || '수료증을 불러오는데 실패했습니다.'}</p>
          <button
            onClick={() => router.push('/certificates/my')}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 수료증이 없는 경우
  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl text-gray-400">📄</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">수료증을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청하신 수료증이 존재하지 않습니다.</p>
          <button
            onClick={() => router.push('/certificates/my')}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-cyan-600 focus:z-10 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 group"
            >
              <svg
                className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              목록으로 돌아가기
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 sm:px-8 py-4 sm:py-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                    {certificate.title}
                  </h1>
                  <p className="text-cyan-100 text-sm sm:text-lg">
                    {certificate.issuer}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border ${getStatusBadge(certificate.status)} bg-white w-fit`}>
                    {certificate.status}
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {certificate.status === '유효' && (
                      <>
                        <button
                          onClick={handleShare}
                          className="px-3 sm:px-4 py-2 bg-white text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors font-medium border border-white/50 shadow-sm text-sm sm:text-base"
                        >
                          공유하기
                        </button>

                        <button
                          onClick={openRevokeModal}
                          className="px-3 sm:px-4 py-2 bg-white/90 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium border border-white/50 shadow-sm text-sm sm:text-base"
                        >
                          폐기 요청
                        </button>
                      </>
                    )}

                    {certificate.status === '폐기' && (
                      <div className="px-3 sm:px-4 py-2 bg-gray-200 text-black rounded-lg text-sm sm:text-base w-fit">
                        폐기된 수료증
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              {/* 전체 수료증 표시 */}
              <div className="mb-4 sm:mb-8">
                <Certificate 
                  certInfo={{
                    vc: {
                      credentialSubject: {
                        id: certificate.id,
                        certificateName: certificate.certificateName,
                        issuer: certificate.issuer,
                        issueDate: certificate.issueDate,
                        status: certificate.status,
                        ImagePath: certificate.imagePath,
                        userName: certificate.userName,
                        userId: certificate.userId,
                        description: certificate.description,
                        userDid: certificate.userDid,
                        issuerId: certificate.issuerId,
                        DOB: certificate.DOB,
                        requestDate: certificate.requestDate,
                        request: certificate.request,
                      }
                    },
                    payload: certificate.rawData?.message?.payload,
                    verifiableCredential: certificate.rawData?.message?.verifiableCredential
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 공유 링크 모달 */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                공유 링크
              </h3>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                  생성된 공유 링크
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-gray-50/50 text-xs sm:text-sm font-mono text-gray-700 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-1 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="복사"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  이 링크를 통해 다른 사람들이 수료증을 검증할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={closeShareModal}
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium text-sm sm:text-base"
                >
                  닫기
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  복사하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 폐기 요청 모달 */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                폐기 요청
              </h3>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                  폐기 사유를 입력해주세요
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  placeholder="예) 오타가 있어요 / 정보 변경 필요 / 분실"
                  className="w-full border-2 border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all duration-300 bg-gray-50/50 text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={closeRevokeModal}
                  disabled={revokeMutation.isPending}
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 font-medium text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={!revokeReason.trim() || revokeMutation.isPending}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  {revokeMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      요청 중...
                    </span>
                  ) : (
                    '폐기 요청'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Loading fallback 컴포넌트
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function CertificateDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CertificateDetailContent />
    </Suspense>
  );
}