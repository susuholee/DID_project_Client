// src/app/certificates/my/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useUserStore from '@/Store/userStore';

export default function MyCertificatesPage() {
  const router = useRouter();
  const { user, isLoggedIn, addNotification } = useUserStore();

  // TanStack Query로 수료증 데이터 가져오기
  const { 
    data: allCerts = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['certificates', user?.userId],
   // queryFn 내부를 다음과 같이 수정해주세요
queryFn: async () => {
  if (!user?.userId) {
    throw new Error('사용자 정보가 없습니다.');
  }
  
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/${user.userId}`,
    { withCredentials: true }
  );
  
  // 🔍 전체 API 응답 구조 먼저 로그
  console.log('=== API 전체 응답 ===', response.data);
  
  // VC 형태의 복잡한 응답 구조에서 데이터 추출
  if (Array.isArray(response.data)) {
    console.log(`총 ${response.data.length}개의 아이템 발견`);
    
    return response.data.map((item, index) => {
      console.log(`\n=== 아이템 ${index + 1} 전체 구조 ===`);
      console.log('Raw item:', JSON.stringify(item, null, 2));
      
      // 각 VC에서 credentialSubject 정보 추출
      const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                            item.message?.verifiableCredential?.credentialSubject ||
                            item.credentialSubject ||  // 직접 접근 시도
                            item;  // 전체가 credentialSubject인 경우
      
      console.log(`아이템 ${index + 1} credentialSubject:`, credentialSubject);
      
      if (!credentialSubject) {
        console.warn(` 아이템 ${index + 1}: credentialSubject를 찾을 수 없음`);
        return null;
      }

      //  모든 가능한 상태/타입 필드 확인
      console.log(`\n=== 아이템 ${index + 1} 상태 관련 필드들 ===`);
      console.log('credentialSubject.status:', credentialSubject.status);
      console.log('credentialSubject.state:', credentialSubject.state);
      console.log('credentialSubject.requestType:', credentialSubject.requestType);
      console.log('credentialSubject.request:', credentialSubject.request);
      console.log('item.status:', item.status);
      console.log('item.state:', item.state);
      console.log('item.requestType:', item.requestType);
      console.log('item.request:', item.request);
      
      // message 레벨에서도 확인
      if (item.message) {
        console.log('item.message.status:', item.message.status);
        console.log('item.message.requestType:', item.message.requestType);
        if (item.message.payload) {
          console.log('item.message.payload.status:', item.message.payload.status);
          console.log('item.message.payload.requestType:', item.message.payload.requestType);
        }
      }

      // 모든 가능한 위치에서 requestType과 status 찾기
      const requestType = credentialSubject.requestType || 
                         credentialSubject.request ||
                         item.requestType ||
                         item.request ||
                         item.message?.requestType ||
                         item.message?.payload?.requestType;
                         
      const statusValue = credentialSubject.status || 
                         credentialSubject.state ||
                         item.status ||
                         item.state ||
                         item.message?.status ||
                         item.message?.payload?.status;

      console.log(`\n=== 아이템 ${index + 1} 최종 추출된 값들 ===`);
      console.log('추출된 requestType:', requestType);
      console.log('추출된 status:', statusValue);

      // 상태 결정 로직 - 더 포괄적으로
      let certificateStatus = '알 수 없음'; // 기본값 변경
      
      // 1. requestType 확인 (최우선)
      if (requestType === 'revoke' || requestType === 'cancel') {
        certificateStatus = '폐기';
        console.log(`아이템 ${index + 1}: requestType "${requestType}"으로 인해 폐기 처리`);
      }
      // 2. status 값 확인
      else if (statusValue) {
        if (statusValue === 'approved' || statusValue === 'active' || statusValue === 'valid') {
          certificateStatus = '유효';
          console.log(` ${index + 1}: status "${statusValue}"으로 인해 유효 처리`);
        } else if (statusValue === 'revoked' || statusValue === 'cancelled' || statusValue === 'inactive') {
          certificateStatus = '폐기';
          console.log(`아이템 ${index + 1}: status "${statusValue}"으로 인해 폐기 처리`);
        } else {
          certificateStatus = statusValue; // 원본 값 그대로 사용
          console.log(`아이템 ${index + 1}: 알 수 없는 status "${statusValue}" 그대로 사용`);
        }
      }
      // 3. 기본값 처리
      else {
        certificateStatus = '유효'; // status가 없으면 유효로 간주
        console.log(`아이템 ${index + 1}: status 정보가 없어 기본값 '유효'로 설정`);
      }
      
      console.log(`아이템 ${index + 1} 최종 상태: "${certificateStatus}"\n`);

      // Certificate 컴포넌트와 동일한 구조로 정규화
      const processedItem = {
        id: credentialSubject.id || `temp-id-${index}`,
        certificateName: credentialSubject.certificateName || credentialSubject.title || '제목 없음',
        issuer: credentialSubject.issuer || '발급기관 없음',
        // 발급일은 여러 위치에서 확인
        issueDate: credentialSubject.issueDate || 
        item.message?.payload?.issuseDate || 
        item.message?.payload?.issuanceDate ||
        item.message?.verifiableCredential?.issuanceDate,
        status: certificateStatus, // 최종 결정된 상태
        imagePath: credentialSubject.ImagePath || credentialSubject.imagePath,
        userName: credentialSubject.userName,
        userId: credentialSubject.userId,
        description: credentialSubject.description,
        userDid: credentialSubject.userDid,
        issuerId: credentialSubject.issuerId,
        DOB: credentialSubject.DOB,
        requestDate: credentialSubject.requestDate,
        request: credentialSubject.request,
        requestType: requestType, // 추출된 requestType
        originalStatus: statusValue, // 원본 status 보관
        // Certificate 컴포넌트에서 사용하는 전체 구조 보관
        rawData: item,
        // Certificate 스토어에서 기대하는 구조
        vc: {
          credentialSubject: credentialSubject
        },
        jwt: item.message?.jwt || item.message?.payload?.jwt
      };
      
      return processedItem;
    }).filter(Boolean); // null 값 제거
  }
  
  return [];
},
    enabled: !!isLoggedIn && !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    cacheTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnMount: false, // 마운트 시 자동 refetch 안함
    retry: 2,
    onError: (error) => {
      console.error('수료증 조회 실패:', error);
    }
  });

  // 알림 추가 함수
  const pushNotif = (title, message) => {
    if (user?.id || user?.userId) {
      addNotification(user.id || user.userId, {
        id: Date.now(),
        title,
        message,
        ts: Date.now(),
        read: false,
      });
    }
  };

  // 검색/정렬/상태필터/페이지
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date_desc');       // date_desc | date_asc | title | issuer
  const [status, setStatus] = useState('all');         // all | 유효 | 폐기
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // 필터링 + 정렬
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    
    // 모든 수료증의 상태 현황 로깅
    const statusCounts = allCerts.reduce((acc, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {});
    console.log('전체 수료증 상태 현황:', statusCounts);
    
    let arr = allCerts.filter((c) => {
      // 제목과 기관명 모두에서 검색
      const matchText = !text || 
        (c.certificateName || c.title || '').toLowerCase().includes(text) || 
        (c.issuer || '').toLowerCase().includes(text);
      
      // 상태 필터링 - null/undefined 체크 강화
      const certStatus = c.status || '알 수 없음';
      const matchStatus = status === 'all' ? true : certStatus === status;
      
      // 디버깅: 폐기 상태 수료증이 필터링되는지 확인
      if (certStatus === '폐기') {
        console.log('폐기 수료증 필터링 확인:', {
          name: c.certificateName,
          certStatus,
          currentFilter: status,
          willShow: matchText && matchStatus
        });
      }
      
      return matchText && matchStatus;
    });

    // 정렬
    arr = [...arr].sort((a, b) => {
      const aDate = a.issueDate || a.requestDate || a.createdAt || '1970-01-01';
      const bDate = b.issueDate || b.requestDate || b.createdAt || '1970-01-01';
      const aTitle = a.certificateName || a.title || '';
      const bTitle = b.certificateName || b.title || '';
      const aIssuer = a.issuer || '';
      const bIssuer = b.issuer || '';

      if (sort === 'date_desc') return bDate.localeCompare(aDate);
      if (sort === 'date_asc')  return aDate.localeCompare(bDate);
      if (sort === 'title')     return aTitle.localeCompare(bTitle, 'ko');
      if (sort === 'issuer')    return aIssuer.localeCompare(bIssuer, 'ko');
      return 0;
    });

    console.log(`필터링 결과: ${arr.length}개 (전체: ${allCerts.length}개)`);
    return arr;
  }, [allCerts, q, sort, status]);

  // 페이지 데이터
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // 검색/정렬/상태 바뀌면 첫 페이지로
  useEffect(() => setPage(1), [q, sort, status]);

  const badgeOf = (s) => {
    if (s === '유효')   return 'bg-green-100 text-green-700';
    if (s === '폐기')   return 'bg-red-100 text-red-600'; // 폐기는 빨간색으로
    return 'bg-gray-100 text-gray-600';
  };

  // 검색 타입에 따른 placeholder 텍스트
  const getPlaceholder = () => {
    return '수료증명 또는 기관명 검색';
  };

  // 상세 페이지로 이동
  const handleCertificateClick = (cert) => {
    
    // 상세 페이지로 이동
     router.push(`/certificates/detail?id=${cert.id}`);
  };

  // 액션 핸들러들
  const handleShare = async (cert, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    try {
      // 원본 데이터에서 DID 정보 추출
      const rawData = cert.rawData;
      const userDid = cert.userDid || rawData?.message?.payload?.sub || 'did:example:1234567890abcdef';
      const jwt = rawData?.message?.jwt || '';
      
      // DID 기반 공유 링크 생성
      const shareData = {
        did: userDid,
        title: cert.certificateName || cert.title,
        issuer: cert.issuer,
        jwt: jwt,
        certificateId: cert.id
      };
      
      const encoded = btoa(JSON.stringify(shareData));
      const url = `${window.location.origin}/verify/${encoded}`;
      
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      pushNotif('공유 링크 복사', '수료증 검증 링크가 클립보드에 복사되었습니다.');
    } catch {
      pushNotif('공유 링크 복사 실패', '브라우저 보안 정책으로 복사에 실패했습니다.');
    }
  };

  const handleRevoke = async (cert, reason, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    try {
      console.log('폐기 요청:', { certId: cert.id, reason });
      
      const formData = new FormData();
      
      // 폐기 요청 데이터 추가
      formData.append('userName', cert.userName);
      formData.append('userId', user.userId || user.id);
      formData.append('certificateName', cert.certificateName);
      formData.append('description', reason.trim());
      formData.append('request', 'revoke');
      formData.append('DOB', cert.DOB);
      
      // 이미지 파일이 있으면 추가
      if (cert.imagePath) {
        try {
          const response = await fetch(cert.imagePath);
          const blob = await response.blob();
          const file = new File([blob], 'certificate-image.jpg', { type: blob.type });
          formData.append('file', file);
        } catch (error) {
          console.warn('이미지 파일 변환 실패:', error);
        }
      }
      
      // 폐기 API 요청
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/request`,
        formData,
      );
      
      // 성공 시 데이터 다시 가져오기
      refetch();
      
      pushNotif('폐기 요청 완료', `"${cert.certificateName || cert.title}" 폐기 요청이 관리자에게 전송되었습니다.`);
    } catch (error) {
      console.error('폐기 요청 실패:', error);
      pushNotif('폐기 요청 실패', '폐기 요청 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = (cert, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    // 실제 다운로드 로직 구현
    try {
      // PDF 다운로드 또는 이미지 다운로드
      const link = document.createElement('a');
      link.href = cert.imagePath || cert.downloadUrl || '#';
      link.download = `${cert.certificateName || cert.title || '수료증'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      pushNotif('다운로드 시작', `"${cert.certificateName || cert.title}" 다운로드를 시작합니다.`);
    } catch (error) {
      console.error('다운로드 실패:', error);
      pushNotif('다운로드 실패', '다운로드 중 오류가 발생했습니다.');
    }
  };



  // 로딩 상태
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">수료증을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl text-red-500"></span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error.message || '수료증 조회 중 오류가 발생했습니다.'}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* 상단 */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">내 수료증</h1>
              <p className="text-gray-600 mt-1">총 {total}개</p>
            </div>

            {/* 검색/정렬 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 검색 입력 */}
              <div className="flex-1 min-w-[240px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
              
              {/* 정렬 선택 */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
              >
                <option value="date_desc">최신순</option>
                <option value="date_asc">오래된순</option>
                <option value="title">제목순</option>
                <option value="issuer">기관순</option>
              </select>
            </div>
          </div>

          {/* 상태 필터 바 */}
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: '유효', label: '유효' },
              { key: '폐기', label: '폐기' },
            ].map((opt) => {
              const active = status === opt.key;
              
              // 각 상태별 개수 계산
              const count = opt.key === 'all' 
                ? allCerts.length 
                : allCerts.filter(c => c.status === opt.key).length;
              
              return (
                <button
                  key={opt.key}
                  onClick={() => setStatus(opt.key)}
                  className={`h-9 px-3 rounded-full border text-sm ${
                    active
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>

          {/* 현재 검색 조건 표시 */}
          {(q || status !== 'all') && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>검색 조건:</span>
              {q && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  검색어: "{q}"
                </span>
              )}
              {status !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  상태: {status}
                </span>
              )}
              <button
                onClick={() => {
                  setQ('');
                  setStatus('all');
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                초기화
              </button>
            </div>
          )}

          {/* 목록(카드 형태) */}
          {pageData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-gray-600">조건에 맞는 수료증이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => handleCertificateClick(c)}
                >
                  {/* 썸네일 이미지 */}
                  <div className="relative h-48 bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center overflow-hidden">
                    {c.imagePath ? (
                      <img 
                        src={c.imagePath} 
                        alt={c.certificateName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-100 flex items-center justify-center">
                          <span className="text-2xl text-cyan-600">📜</span>
                        </div>
                        <p className="text-sm text-gray-500">수료증</p>
                      </div>
                    )}
                    
                    {/* 상태 배지 */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeOf(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* 카드 내용 */}
                  <div className="p-6">
                    {/* 수료증 제목 */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                      {c.certificateName}
                    </h3>
                    
                    {/* 발급기관 */}
                    <p className="text-sm text-gray-600 mb-3">
                      {c.issuer}
                    </p>
                    
                    {/* 수료자 정보 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {c.userName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.userName}</p>
                        <p className="text-xs text-gray-500">수료자</p>
                      </div>
                    </div>
                    
                    {/* 발급일 */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>발급일</span>
                      <span className="font-medium">
                        {c.issueDate ? new Date(c.issueDate).toLocaleDateString('ko-KR') : 'N/A'}
                      </span>
                    </div>
                    
            
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                이전
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({length: totalPages}, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`
                      w-10 h-10 rounded-xl text-sm font-medium transition-colors
                      ${page === p 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}