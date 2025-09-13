'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useUserStore from '@/Store/userStore';

// 수료증 데이터 처리 함수
const processCertificateData = (item, index, user, type = 'active') => {
  console.log(`\n=== ${type} 아이템 ${index + 1} 전체 구조 ===`);
  console.log('Raw item:', JSON.stringify(item, null, 2));
  
  // credentialSubject 찾기 (간소화)
  const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                        item.message?.verifiableCredential?.credentialSubject ||
                        item.verifiableCredential?.credentialSubject ||
                        item.credentialSubject ||
                        item.vc?.credentialSubject ||
                        item;
  
  // 기본값들 설정
  let certificateName = '제목 없음';
  let issuer = '발급기관 없음';
  let userName = user?.userName || '사용자';
  let issueDate = null;
  let imagePath = null;
  let status = type === 'revoked' ? '폐기' : '유효';
  
  // 간소화된 데이터 추출
  // 수료증명
  if (credentialSubject?.certificateName) {
    certificateName = credentialSubject.certificateName;
  } else if (item.certificateName) {
    certificateName = item.certificateName;
  } else if (credentialSubject?.name) {
    certificateName = credentialSubject.name;
  } else if (credentialSubject?.title) {
    certificateName = credentialSubject.title;
  }
  
  // 발급기관
  if (credentialSubject?.issuer) {
    issuer = credentialSubject.issuer;
  } else if (item.issuer) {
    issuer = item.issuer;
  } else if (credentialSubject?.issuerName) {
    issuer = credentialSubject.issuerName;
  }
  
  // 사용자명
  if (credentialSubject?.userName) {
    userName = credentialSubject.userName;
  } else if (credentialSubject?.name && credentialSubject.name !== certificateName) {
    userName = credentialSubject.name;
  } else if (item.userName) {
    userName = item.userName;
  }
  
  // 발급일
  if (credentialSubject?.issueDate) {
    issueDate = credentialSubject.issueDate;
  } else if (item.issueDate) {
    issueDate = item.issueDate;
  } else if (item.message?.payload?.nbf) {
    issueDate = new Date(item.message.payload.nbf * 1000).toISOString();
  } else if (item.createdAt) {
    issueDate = item.createdAt;
  }
  
  // 이미지 경로
  if (credentialSubject?.ImagePath) {
    imagePath = credentialSubject.ImagePath;
  } else if (credentialSubject?.imagePath) {
    imagePath = credentialSubject.imagePath;
  } else if (item.imagePath || item.ImagePath) {
    imagePath = item.imagePath || item.ImagePath;
  }
  
  // 상태 처리 - 간소화
  const requestType = credentialSubject?.requestType || item.requestType || item.request;
  const statusValue = credentialSubject?.status || item.status;
  
  console.log(`${type} 아이템 ${index + 1} 상태 정보:`, {
    requestType,
    statusValue,
    credentialSubjectStatus: credentialSubject?.status,
    itemStatus: item.status,
    type
  });
  
  if (type === 'revoked') {
    status = '폐기';
  } else if (requestType === 'revoke' || requestType === 'cancel') {
    status = '폐기';
  } else if (statusValue === 'revoked' || statusValue === 'cancelled' || statusValue === 'revoke') {
    status = '폐기';
  } else if (statusValue === 'approved' || statusValue === 'active') {
    status = '유효';
  }
  
  // 401 에러나 빈 데이터 필터링
  if (certificateName === '제목 없음' && issuer === '발급기관 없음' && !imagePath) {
    console.log(`${type} 아이템 ${index + 1}: 유효하지 않은 데이터로 판단하여 제외`);
    return null;
  }
  
  console.log(`${type} 아이템 ${index + 1} 최종 데이터:`, {
    certificateName,
    issuer,
    userName,
    issueDate,
    status,
    imagePath
  });

  return {
    id: credentialSubject?.id || item.id || `${type}-cert-${index}`,
    certificateName,
    issuer,
    issueDate,
    status,
    imagePath,
    userName,
    userId: credentialSubject?.userId || item.userId || user.userId,
    description: credentialSubject?.description || item.description || '',
    userDid: credentialSubject?.userDid || credentialSubject?.did,
    issuerId: credentialSubject?.issuerId,
    DOB: credentialSubject?.DOB || credentialSubject?.birthDate || item.DOB || user?.birthDate,
    requestDate: credentialSubject?.requestDate || item.createdAt,
    request: credentialSubject?.request || item.request,
    requestType: requestType,
    originalStatus: statusValue,
    rawData: item,
    vc: { credentialSubject: credentialSubject },
    jwt: item.message?.jwt || item.message?.payload?.jwt
  };
};

export default function MyCertificatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, addNotification } = useUserStore();

  // TanStack Query로 수료증 데이터 가져오기 - 캐시 우선 사용 설정
  const { 
    data: allCerts = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['certificates', user?.userId],
    queryFn: async () => {
      if (!user?.userId) {
        throw new Error('사용자 정보가 없습니다.');
      }
      
      // 일반 수료증과 폐기된 수료증을 병렬로 가져오기
      const [activeResponse, revokedResponse] = await Promise.allSettled([
        // 일반 수료증
        axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/${user.userId}`,
          { withCredentials: true }
        ),
        // 폐기된 수료증 (request: revoke, status: approved)
        axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`,
          { withCredentials: true }
        )
      ]);

      // 일반 수료증 데이터 처리
      let activeCerts = [];
      if (activeResponse.status === 'fulfilled') {
        const response = activeResponse.value;
        console.log('=== 일반 수료증 API 응답 ===', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          activeCerts = response.data.map((item, index) => {
            return processCertificateData(item, index, user, 'active');
          }).filter(Boolean);
        }
      }

      // 폐기된 수료증 데이터 처리
      let revokedCerts = [];
      if (revokedResponse.status === 'fulfilled') {
        const response = revokedResponse.value;
        console.log('=== 폐기된 수료증 API 응답 ===', response.data);
        
        if (response.data?.data && Array.isArray(response.data.data)) {
          // 해당 사용자의 폐기된 수료증만 필터링
          const userRevokedCerts = response.data.data.filter(
            item => item.userId === user.userId && 
                   item.request === 'revoke' && 
                   item.status === 'approved'
          );
          
          revokedCerts = userRevokedCerts.map((item, index) => {
            return processCertificateData(item, index, user, 'revoked');
          }).filter(Boolean);
        }
      }

      // 두 데이터를 합치기
      const allCertsData = [...activeCerts, ...revokedCerts];
      console.log(`=== 최종 수료증 데이터 === 총 ${allCertsData.length}개 (일반: ${activeCerts.length}, 폐기: ${revokedCerts.length})`);
      
      return allCertsData;
    },
    enabled: !!isLoggedIn && !!user?.userId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh (캐시 우선 사용)
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (cacheTime → gcTime)
    refetchOnMount: 'always', // 마운트 시 항상 refetch (캐시가 있어도)
    refetchOnWindowFocus: true, // 윈도우 포커스 시 refetch (최신 데이터 보장)
    retry: (failureCount, error) => {
      // 401/403 에러는 재시도하지 않음
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      console.error('수료증 조회 실패:', error);
      if (error?.response?.status === 401) {
        console.log('인증 오류 - 로그인 필요');
      }
    },
    // 백그라운드에서 자동 refetch 설정
    refetchInterval: 3 * 60 * 1000, // 3분마다 백그라운드 업데이트
    refetchIntervalInBackground: true // 백그라운드에서도 업데이트
  });

  // 캐시에서 기존 데이터 즉시 가져오기 및 백그라운드 업데이트
  useEffect(() => {
    if (user?.userId) {
      const cachedData = queryClient.getQueryData(['certificates', user.userId]);
      if (cachedData && cachedData.length > 0) {
        console.log('캐시에서 데이터 발견:', cachedData.length, '개');
        // 캐시된 데이터가 있으면 백그라운드에서 업데이트
        queryClient.invalidateQueries({
          queryKey: ['certificates', user.userId],
          refetchType: 'none' // UI는 업데이트하지 않고 백그라운드에서만
        });
      }
    }
  }, [user?.userId, queryClient]);

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
  const [sort, setSort] = useState('date_desc');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 6; // 한 페이지에 6개씩 표시

  // 필터링 + 정렬 (메모이제이션 최적화)
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    
    let arr = allCerts.filter((c) => {
      // 유효하지 않은 데이터 추가 필터링
      if (!c.certificateName || c.certificateName === '제목 없음') {
        return false;
      }
      
      // 제목과 기관명 검색
      const matchText = !text || 
        (c.certificateName || '').toLowerCase().includes(text) || 
        (c.issuer || '').toLowerCase().includes(text);
      
      // 상태 필터링
      const certStatus = c.status || '유효';
      const matchStatus = status === 'all' ? true : certStatus === status;
      
      console.log(`필터링 체크 - ${c.certificateName}:`, {
        certStatus,
        filterStatus: status,
        matchStatus,
        matchText,
        willInclude: matchText && matchStatus
      });
      
      return matchText && matchStatus;
    });

    // 정렬
    arr = [...arr].sort((a, b) => {
      const aDate = a.issueDate || a.requestDate || a.createdAt || '1970-01-01';
      const bDate = b.issueDate || b.requestDate || b.createdAt || '1970-01-01';
      const aTitle = a.certificateName || '';
      const bTitle = b.certificateName || '';
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
    if (s === '유효') return 'bg-green-100 text-green-700';
    if (s === '폐기') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  // 상세 페이지로 이동
  const handleCertificateClick = (cert) => {
    router.push(`/certificates/detail?id=${cert.id}`);
  };

  // 수동 새로고침 함수
  const handleManualRefresh = async () => {
    // 캐시를 무효화하고 새로 가져오기
    await queryClient.invalidateQueries({
      queryKey: ['certificates', user?.userId],
    });
    // refetch는 invalidateQueries가 자동으로 트리거하므로 별도 호출 불필요
  };

  // 로딩 상태 (캐시 데이터가 있으면 로딩 표시 안함)
  const hasCache = queryClient.getQueryData(['certificates', user?.userId]);
  if (loading && !hasCache) {
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

  // 에러 상태 (인증 에러는 별도 처리)
  if (error && error?.response?.status === 401) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-4">수료증을 확인하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 기타 에러 상태
  if (error && error?.response?.status !== 401) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl text-red-500">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error.message || '수료증 조회 중 오류가 발생했습니다.'}</p>
            <button
              onClick={handleManualRefresh}
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:ml-64">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* 상단 */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">내 수료증</h1>
            <p className="text-gray-600 mt-1">총 {total}개</p>
          </div>

          {/* 검색/정렬 + 새로고침 버튼 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 새로고침 버튼 */}
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
            
            {/* 검색 입력 */}
            <div className="flex-1 min-w-[240px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="수료증명 또는 기관명 검색"
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
            
            const count = opt.key === 'all' 
              ? allCerts.length 
              : allCerts.filter(c => {
                const certStatus = c.status || '유효';
                return certStatus === opt.key;
              }).length;
            
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl text-gray-400">📜</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">수료증이 없습니다</h3>
            <p className="text-gray-600">
              {q || status !== 'all' ? '조건에 맞는 수료증이 없습니다.' : '아직 발급받은 수료증이 없습니다.'}
            </p>
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-100 flex items-center justify-center">
                              <span class="text-2xl text-cyan-600">📜</span>
                            </div>
                            <p class="text-sm text-gray-500">수료증</p>
                          </div>
                        `;
                      }}
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
  );
}