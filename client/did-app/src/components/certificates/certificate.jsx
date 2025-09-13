'use client';

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useQuery } from '@tanstack/react-query';
import { useCertInfoStore } from "@/Store/certStore";
import useUserStore from "@/Store/userStore";
import { toPng } from "html-to-image";
import api from '@/lib/axios';



const Certificate = ({ certificateId, certInfo: propCertInfo, onError }) => {
  const certificateRef = useRef();
  const { certInfo, setCertInfo } = useCertInfoStore();
  const { user, isLoggedIn } = useUserStore();
  
  const date = Number(Date.now().toString().slice(-6));

  // TanStack Query로 수료증 데이터 가져오기
  const { 
    data: certificateData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ['certificate', certificateId, user?.userId],
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

      // 일반 수료증과 폐기된 수료증을 병렬로 가져오기
      const [activeResponse, revokedResponse] = await Promise.allSettled([
        // 일반 수료증
        api.get(`/user/vc/${userId}`),
        // 폐기된 수료증
        api.get(`/admin/vcrequestlogs`)
      ]);

      let foundCertificate = null;
      let certificateType = 'active';

      // 일반 수료증에서 찾기
      if (activeResponse.status === 'fulfilled') {
        const response = activeResponse.value;
        if (Array.isArray(response.data)) {
          foundCertificate = response.data.find(item => {
            const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                                   item.message?.verifiableCredential?.credentialSubject;
            return credentialSubject?.id === certificateId;
          });

          if (foundCertificate) {
            certificateType = 'active';
          }
        }
      }

      // 폐기된 수료증에서 찾기 (일반 수료증에서 못 찾은 경우)
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

      // 데이터 정규화
      if (certificateType === 'active') {
        // 일반 수료증 처리
        const credentialSubject = foundCertificate.message?.payload?.vc?.credentialSubject || 
                               foundCertificate.message?.verifiableCredential?.credentialSubject;
        
        // 디버깅을 위한 로그
        console.log('Certificate 컴포넌트 - 일반 수료증 원본 데이터:', foundCertificate);
        console.log('Certificate 컴포넌트 - 일반 수료증 credentialSubject:', credentialSubject);
        
        const normalizedData = {
          vc: {
            credentialSubject: {
              id: credentialSubject.id,
              certificateName: credentialSubject.certificateName,
              issuer: credentialSubject.issuer,
              issueDate: credentialSubject.issueDate || 
                       foundCertificate.message?.payload?.issuseDate || 
                       foundCertificate.message?.payload?.issuanceDate ||
                       foundCertificate.message?.verifiableCredential?.issuanceDate ||
                       new Date().toISOString().split('T')[0], // 기본값으로 현재 날짜
              status: credentialSubject.status === 'approved' ? '유효' : '폐기',
              ImagePath: credentialSubject.ImagePath,
              userName: credentialSubject.userName,
              userId: credentialSubject.userId,
              description: credentialSubject.description,
              userDid: credentialSubject.userDid,
              issuerId: credentialSubject.issuerId,
              DOB: credentialSubject.DOB,
              requestDate: credentialSubject.requestDate,
              request: credentialSubject.request,
            }
          }
        };
        
        console.log('Certificate 컴포넌트 - 일반 수료증 정규화된 데이터:', normalizedData);
        return normalizedData;
      } else {
        // 폐기된 수료증 처리
        console.log('Certificate 컴포넌트 - 폐기된 수료증 원본 데이터:', foundCertificate);
        
        const normalizedData = {
          vc: {
            credentialSubject: {
              id: foundCertificate.id,
              certificateName: foundCertificate.certificateName,
              issuer: foundCertificate.issuer || '발급기관 정보 없음',
              issueDate: foundCertificate.createdAt,
              status: '폐기',
              ImagePath: foundCertificate.ImagePath,
              userName: foundCertificate.userName,
              userId: foundCertificate.userId,
              description: foundCertificate.description,
              userDid: null,
              issuerId: null,
              DOB: foundCertificate.DOB,
              requestDate: foundCertificate.createdAt,
              request: foundCertificate.request,
            }
          }
        };
        
        console.log('Certificate 컴포넌트 - 폐기된 수료증 정규화된 데이터:', normalizedData);
        return normalizedData;
      }
    },
    enabled: !!certificateId && !!user && isLoggedIn && !propCertInfo, // propCertInfo가 없을 때만 API 호출
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    cacheTime: 10 * 60 * 1000, // 10분간 메모리에 유지
  });

  // 데이터가 로드되면 certInfo에 저장
  useEffect(() => {
    if (certificateData) {
      setCertInfo(certificateData);
    }
  }, [certificateData, setCertInfo]);

  // 에러 처리
  useEffect(() => {
    if (queryError) {
      console.error('수료증 로드 실패:', queryError);
      if (onError) {
        onError(queryError.message || '수료증을 불러오는데 실패했습니다.');
      }
    }
  }, [queryError, onError]);

  // 에러 상태 계산
  const error = queryError?.message || null;

  // credentialSubject에서 데이터 추출 (propCertInfo 우선, certificateData, certInfo 순)
  const credentialSubject = propCertInfo?.vc?.credentialSubject || 
                           certificateData?.vc?.credentialSubject || 
                           certInfo?.vc?.credentialSubject || {};
  
  // 디버깅을 위한 로그
  console.log('Certificate 렌더링 - propCertInfo:', propCertInfo);
  console.log('Certificate 렌더링 - certificateData:', certificateData);
  console.log('Certificate 렌더링 - certInfo:', certInfo);
  console.log('Certificate 렌더링 - credentialSubject:', credentialSubject);
  
  // 발급일은 다른 위치에서 가져오기
  const rawIssueDate = credentialSubject.issueDate || 
    propCertInfo?.payload?.issuseDate || 
    propCertInfo?.payload?.issuanceDate ||
    propCertInfo?.verifiableCredential?.issuanceDate ||
    certificateData?.payload?.issuseDate || 
    certificateData?.payload?.issuanceDate ||
    certificateData?.verifiableCredential?.issuanceDate ||
    certInfo?.payload?.issuseDate || 
    certInfo?.payload?.issuanceDate ||
    certInfo?.verifiableCredential?.issuanceDate;

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // 유효하지 않은 날짜면 원본 반환
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.warn('날짜 포맷팅 오류:', error);
      return dateString;
    }
  };

  const issueDate = formatDate(rawIssueDate);

  // 표시할 필드들 정의 (순서대로)
  const certificateFields = [
    {
      key: 'userId',
      label: '사용자',
      value: credentialSubject.userId,
      className: 'font-mono break-all'
    },
    {
      key: 'certificateName',
      label: '수료증 이름',
      value: credentialSubject.certificateName,
      className: 'break-words'
    },
    {
      key: 'issuerId',
      label: '발급자',
      value: credentialSubject.issuerId,
      className: 'font-mono break-all'
    },
    {
      key: 'issueDate',
      label: '발급 날짜',
      value: issueDate,
      className: ''
    }
  ];


  // 로딩 상태
  if (loading) {
    return (
      <div className="font-noto-serif min-h-screen p-4 px-6 sm:p-8 sm:px-12">
        <div className="max-w-4xl mx-auto mt-20 sm:mt-15">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">수료증을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="font-noto-serif min-h-screen p-4 px-6 sm:p-8 sm:px-12">
        <div className="max-w-4xl mx-auto mt-20 sm:mt-15">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">수료증을 불러올 수 없습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-noto-serif min-h-screen p-4 px-6 sm:p-8 sm:px-12">
      <div className="max-w-4xl mx-auto mt-20 sm:mt-15">
        <div ref={certificateRef} className="bg-white rounded-lg p-4 px-6 sm:p-9 sm:px-16 backdrop-blur-sm shadow-blue-500/20 min-h-[480px] sm:min-h-[550px] overflow-hidden">
          {/* Certificate Header */}
          <h1 className="text-2xl sm:text-4xl font-semibold mb-6 sm:mb-8 w-fit mx-auto">수 료 증</h1>

          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-2xl font-semibold">
              경일 게임IT 아카데미
            </h2>
            <Image src="/images/jungbu.png" alt="jungbu" width={60} height={60} className="sm:w-[80px] sm:h-[80px]" />
            <div className="text-sm sm:text-base w-auto sm:w-[211px] flex justify-end">제: 2025-{date} 호</div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col items-center lg:items-start">
              <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border-2 border-gray-300 mb-6 sm:mb-8 overflow-hidden bg-gradient-to-br flex items-center justify-center">
                <img
                  src={credentialSubject.ImagePath}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 break-words">
                이름 : {credentialSubject.userName || '홍길동'}
              </h3>
              <h4 className="text-base sm:text">생년월일 : {credentialSubject.DOB}</h4>
            </div>
            
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="gap-2 border-b-1 border-gray-300 pb-3 sm:pb-4 space-y-2">
                {certificateFields.map((field, i) => (
                  <div key={field.key || i}>
                    <label className="text-sm sm:text-md font-bold">{field.label}</label>
                    <p className={field.className}>{field.value || '발급자 없음'}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 sm:mt-4 space-y-2 text-sm sm:text-md">
                <div className="flex justify-between">
                  <span className="font-bold">검증 결과:</span>
                  <span className="text-green-500 font-bold">검증 완료</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 py-4 w-full sm:w-150 mx-auto rounded-lg px-1">
            <p className="leading-relaxed text-base sm:text-2xl font-noto-serif font-bold text-center">
              위 사람은 경일 게임IT 아카데미에서 {credentialSubject.certificateName} 과정을 수료하였으므로 이 증서를 수여합니다.
            </p>
          </div>
          
          <div className="mt-8 h-15 flex justify-center md:justify-end items-center">
            <Image src="/images/stamp.png" alt="certificate" width={70} height={0} className="sm:w-[80px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;