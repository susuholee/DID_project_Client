'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUserStore from '@/Store/userStore';
import Certificate from '@/components/certificates/certificate';
import Modal from '@/components/UI/Modal';
import api from '@/lib/axios';
import axios from 'axios';


const fetchVCRequestLogs = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`, {
      withCredentials: true
    });
    
    if (response.data.state === 200 && response.data.data) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('VC Request Logs 조회 실패:', error);
    return [];
  }
};


function CertificateDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateId = searchParams.get('id');
  const { user, isLoggedIn } = useUserStore();
  const queryClient = useQueryClient();

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const showMessage = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };


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

   
      const [activeResponse, revokedResponse] = await Promise.allSettled([
 
        api.get(`user/vc/${userId}`),

        api.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`, {
          withCredentials: true
        })
      ]);

      let foundCertificate = null;
      let certificateType = 'active';

      if (activeResponse.status === 'fulfilled') {
        const response = activeResponse.value;
        if (Array.isArray(response.data)) {
          const validItems = response.data.filter(item => 
            item.state === 200 && item.message && typeof item.message === 'object'
          );

          foundCertificate = validItems.find(item => {
            const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                                   item.message?.verifiableCredential?.credentialSubject;
            return credentialSubject?.id == certificateId;
          });

          if (foundCertificate) {
            certificateType = 'active';
          }
        }
      }

      if (!foundCertificate && revokedResponse.status === 'fulfilled') {
        const response = revokedResponse.value;
        if (response.data?.data && Array.isArray(response.data.data)) {
          const userRevokedCerts = response.data.data.filter(
            item => item.userId === userId && 
                   item.request === 'revoke' && 
                   item.status === 'approved'
          );

          foundCertificate = userRevokedCerts.find(item => 
            item.id == certificateId || 
            `${item.certificateName}-${item.id}` === certificateId ||
            `revoked-cert-${userRevokedCerts.indexOf(item)}` === certificateId
          );

          if (foundCertificate) {
            certificateType = 'revoked';
          }
        }
      }

      if (!foundCertificate) {
        throw new Error('해당 수료증을 찾을 수 없습니다.');
      }

      if (certificateType === 'active') {
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
          certificateType: 'active'
        };
      } else {
        return {
          id: foundCertificate.id,
          title: foundCertificate.certificateName,
          certificateName: foundCertificate.certificateName,
          issuer: foundCertificate.issuer || '경일IT게임아카데미',
          issueDate: foundCertificate.createdAt,
          status: '폐기',
          imageUrl: foundCertificate.ImagePath,
          imagePath: foundCertificate.ImagePath,
          userName: foundCertificate.userName,
          userId: foundCertificate.userId,
          description: foundCertificate.description,
          userDid: null,
          issuerId: null,
          DOB: foundCertificate.DOB,
          requestDate: foundCertificate.createdAt,
          request: foundCertificate.request,
          publicKey: null,
          rawData: foundCertificate,
          certificateType: 'revoked'
        };
      }
    },
    enabled: !!certificateId && !!user && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  
  const { data: requestLogs = [] } = useQuery({
    queryKey: ['vcRequestLogs'],
    queryFn: fetchVCRequestLogs,
    enabled: !!user && !!certificate,
    staleTime: 30 * 1000,
  });

  const hasPendingRevokeRequest = requestLogs.some(log => {
    return log.userId === user?.userId &&
           log.certificateName === certificate?.certificateName &&
           log.request === 'revoke' &&
           log.status === 'pending';
  });


  const revokeMutation = useMutation({
    mutationFn: async ({ userId, vcId, reason }) => {
      const formData = new FormData();
 
      formData.append('userName', certificate.userName);
      formData.append('userId', userId);
      formData.append('certificateName', certificate.certificateName);
      formData.append('description', reason.trim());
      formData.append('request', 'revoke');
      formData.append('DOB', certificate.DOB);
      
  
      if (certificate.imagePath) {
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
    onSuccess: async (data) => {
      showMessage('폐기 요청이 완료되었습니다!');
      
      await queryClient.invalidateQueries({
        queryKey: ['certificates', user?.userId]
      });
      await queryClient.invalidateQueries({
        queryKey: ['certificate-detail', certificateId, user?.userId]
      });
      await queryClient.invalidateQueries({
        queryKey: ['vcRequestLogs']
      });
      
      setRevokeModalOpen(false);
      setRevokeReason('');
    },
    onError: (error) => {
      console.error('폐기 요청 실패:', error);
      showMessage('폐기 요청 중 오류가 발생했습니다.');
    }
  });

  useEffect(() => {
    if (!isLoggedIn || !user) {
      router.push('/');
      return;
    }
  }, [isLoggedIn, user, router]);

  const getStatusBadge = (status) => {
    if (status === '유효') return 'bg-cyan-100 text-cyan-700 border-cyan-300';
    if (status === '폐기') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status === '만료') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status === '대기중') return 'bg-cyan-50 text-cyan-600 border-cyan-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

 
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
      showMessage('링크가 복사되었습니다!');
    } catch {
      showMessage('복사에 실패했습니다.');
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

    if (hasPendingRevokeRequest) {
      showMessage('이미 해당 수료증에 대한 폐기 요청이 진행 중입니다.');
      return;
    }

    const userId = user.userId || user.id;
    if (!userId) {
      showMessage('사용자 ID를 찾을 수 없습니다.');
      return;
    }

    revokeMutation.mutate({
      userId,
      vcId: certificate.id,
      reason: revokeReason
    });
  };

  const openRevokeModal = () => {
    if (hasPendingRevokeRequest) {
      showMessage('이미 해당 수료증에 대한 폐기 요청이 진행 중입니다.');
      return;
    }
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const closeRevokeModal = () => {
    setRevokeModalOpen(false);
    setRevokeReason('');
  };

 
  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p>수료증을 불러오는 중...</p>
        </div>
      </div>
    );
  }

 
  if (error) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-500 rounded"></div>
          </div>
          <h2 className="text-lg font-semibold mb-2">오류 발생</h2>
          <p className="mb-4">{error.message || '수료증을 불러오는데 실패했습니다.'}</p>
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

  if (!certificate) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded"></div>
          </div>
          <h2 className="text-lg font-semibold mb-2">수료증을 찾을 수 없습니다</h2>
          <p className="mb-4">요청하신 수료증이 존재하지 않습니다.</p>
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
      <main className="min-h-screen ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm  bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-cyan-600 focus:z-10 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 group"
            >
              <div className="w-5 h-5 mr-2 bg-gray-400 rounded"></div>
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
                  <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm  border ${getStatusBadge(certificate.status)} bg-white w-fit`}>
                    {certificate.status}
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {certificate.status === '유효' && certificate.certificateType === 'active' && (
                      <>
                        <button
                          onClick={handleShare}
                          className="px-3 sm:px-4 py-2 bg-white text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors  border border-white/50 shadow-sm text-sm sm:text-base"
                        >
                          공유하기
                        </button>

                        {hasPendingRevokeRequest ? (
                          <div className="px-3 sm:px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm sm:text-base w-fit border border-amber-200">
                            폐기 요청 대기중
                          </div>
                        ) : (
                          <button
                            onClick={openRevokeModal}
                            className="px-3 sm:px-4 py-2 bg-white/90 text-red-600 rounded-lg hover:bg-red-50 transition-colors  border border-white/50 shadow-sm text-sm sm:text-base"
                          >
                            폐기 요청
                          </button>
                        )}
                      </>
                    )}

                    {certificate.status === '폐기' && (
                      <div className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base w-fit border border-gray-300">
                        {certificate.certificateType === 'revoked' ? '폐기된 수료증' : '폐기된 수료증'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              {hasPendingRevokeRequest && certificate.status === '유효' && certificate.certificateType === 'active' && (
                <div className="mb-6 bg-cyan-50 border border-cyan-300 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-cyan-600 rounded mr-3"></div>
                    <div>
                      <h3 className="text-sm">폐기 요청 진행 중</h3>
                      <p className="text-sm mt-1">이 수료증에 대한 폐기 요청이 현재 승인 대기 중입니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {certificate.status === '폐기' && certificate.certificateType === 'revoked' && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-500 rounded mr-3"></div>
                    <div>
                      <h3 className="text-sm">폐기된 수료증</h3>
                      <p className="text-sm mt-1">이 수료증은 폐기 처리되었습니다. 공유 및 폐기 요청 기능을 사용할 수 없습니다.</p>
                    </div>
                  </div>
                </div>
              )}

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

      <Modal
        isOpen={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />

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
                <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                  생성된 공유 링크
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-gray-50/50 text-xs sm:text-sm font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-1 sm:p-2 hover:text-gray-700 transition-colors"
                    title="복사"
                  >
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  </button>
                </div>
                <p className="text-xs mt-2">
                  이 링크를 통해 다른 사람들이 수료증을 검증할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={closeShareModal}
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all duration-300  text-sm sm:text-base"
                >
                  닫기
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300  shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  복사하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
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
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50  text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={!revokeReason.trim() || revokeMutation.isPending || hasPendingRevokeRequest}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
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

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p>페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function CertificateDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CertificateDetailContent />
      </Suspense>
  );
}