'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useUserStore from '@/Store/userStore';
import api from '@/lib/axios';


const processCertificateData = (item, index, user, type = 'active') => {

  
 
  const credentialSubject = item.message?.payload?.vc?.credentialSubject || 
                        item.message?.verifiableCredential?.credentialSubject ||
                        item.verifiableCredential?.credentialSubject ||
                        item.credentialSubject ||
                        item.vc?.credentialSubject ||
                        item;
  
  
  let certificateName = '제목 없음';
  let issuer = '발급기관 없음';
  let userName = user?.userName || '사용자';
  let issueDate = null;
  let imagePath = null;
  let status = type === 'revoked' ? '폐기' : '유효';
  

  if (credentialSubject?.certificateName) {
    certificateName = credentialSubject.certificateName;
  } else if (item.certificateName) {
    certificateName = item.certificateName;
  } else if (credentialSubject?.name) {
    certificateName = credentialSubject.name;
  } else if (credentialSubject?.title) {
    certificateName = credentialSubject.title;
  }
  

  if (credentialSubject?.issuer) {
    issuer = credentialSubject.issuer;
  } else if (item.issuer) {
    issuer = item.issuer;
  } else if (credentialSubject?.issuerName) {
    issuer = credentialSubject.issuerName;
  }
  
 
  if (credentialSubject?.userName) {
    userName = credentialSubject.userName;
  } else if (credentialSubject?.name && credentialSubject.name !== certificateName) {
    userName = credentialSubject.name;
  } else if (item.userName) {
    userName = item.userName;
  }
  

  if (credentialSubject?.issueDate) {
    issueDate = credentialSubject.issueDate;
  } else if (item.issueDate) {
    issueDate = item.issueDate;
  } else if (item.message?.payload?.nbf) {
    issueDate = new Date(item.message.payload.nbf * 1000).toISOString();
  } else if (item.createdAt) {
    issueDate = item.createdAt;
  }
  

  if (credentialSubject?.ImagePath) {
    imagePath = credentialSubject.ImagePath;
  } else if (credentialSubject?.imagePath) {
    imagePath = credentialSubject.imagePath;
  } else if (item.imagePath || item.ImagePath) {
    imagePath = item.imagePath || item.ImagePath;
  }
  

  const requestType = credentialSubject?.requestType || item.requestType || item.request;
  const statusValue = credentialSubject?.status || item.status;
  

  
  if (type === 'revoked') {
    status = '폐기';
  } else if (requestType === 'revoke' || requestType === 'cancel') {
    status = '폐기';
  } else if (statusValue === 'revoked' || statusValue === 'cancelled' || statusValue === 'revoke') {
    status = '폐기';
  } else if (statusValue === 'approved' || statusValue === 'active') {
    status = '유효';
  }
  
  if (certificateName === '제목 없음' && issuer === '발급기관 없음' && !imagePath) {
    return null;
  }
  


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
  const { user, isLoggedIn } = useUserStore();


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
      
      
      const [activeResponse, revokedResponse] = await Promise.allSettled([
   
        api.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/${user.userId}`,
          { withCredentials: true }
        ),
        api.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`,
          { withCredentials: true }
        )
      ]);

      let activeCerts = [];
      if (activeResponse.status === 'fulfilled') {
        const response = activeResponse.value;
    
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          activeCerts = response.data.map((item, index) => {
            return processCertificateData(item, index, user, 'active');
          }).filter(Boolean);
        }
      }

   
      let revokedCerts = [];
      if (revokedResponse.status === 'fulfilled') {
        const response = revokedResponse.value;
   
        
        if (response.data?.data && Array.isArray(response.data.data)) {
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

 
      const allCertsData = [...activeCerts, ...revokedCerts];
      
      
      return allCertsData;
    },
    enabled: !!isLoggedIn && !!user?.userId,
    staleTime: 2 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      if (error?.response?.status === 401) {
      }
    },
  
    refetchInterval: 3 * 60 * 1000,
    refetchIntervalInBackground: true 
  });


  useEffect(() => {
    if (user?.userId) {
      const cachedData = queryClient.getQueryData(['certificates', user.userId]);
      if (cachedData && cachedData.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['certificates', user.userId],
          refetchType: 'none'
        });
      }
    }
  }, [user?.userId, queryClient]);

 

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

 
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    
    let arr = allCerts.filter((c) => {
      if (!c.certificateName || c.certificateName === '제목 없음') {
        return false;
      }
      
    
      const matchText = !text || 
        (c.certificateName || '').toLowerCase().includes(text) || 
        (c.issuer || '').toLowerCase().includes(text);
      
     
      const certStatus = c.status || '유효';
      const matchStatus = status === 'all' ? true : certStatus === status;
      

      
      return matchText && matchStatus;
    });

    
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
    return arr;
  }, [allCerts, q, sort, status]);


  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);


  useEffect(() => setPage(1), [q, sort, status]);

  const badgeOf = (s) => {
    if (s === '유효') return 'bg-green-100 text-green-700';
    if (s === '폐기') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

 
  const handleCertificateClick = (cert) => {
    router.push(`/certificates/detail?id=${cert.id}`);
  };


  const handleManualRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['certificates', user?.userId],
    });
  };


  const hasCache = queryClient.getQueryData(['certificates', user?.userId]);
  if (loading && !hasCache) {
    return (
      <main className="min-h-screen  lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p>수료증을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }


  if (error && error?.response?.status === 401) {
    return (
      <main className="min-h-screen  lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="w-8 h-8 bg-yellow-500 rounded"></div>
            </div>
            <h2 className="text-lg font-semibold mb-2">로그인이 필요합니다</h2>
            <p className="mb-4">수료증을 확인하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </main>
    );
  }


  if (error && error?.response?.status !== 401) {
    return (
      <main className="min-h-screen  lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500 rounded"></div>
            </div>
            <h2 className="text-lg font-semibold mb-2">오류 발생</h2>
            <p className="mb-4">{error.message || '수료증 조회 중 오류가 발생했습니다.'}</p>
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
    <main className="min-h-screen lg:ml-64">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">내 수료증</h1>
            <p className="mt-1">총 {total}개</p>
          </div>

       
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
            
          
            <div className="flex-1 min-w-[240px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="수료증명 또는 기관명 검색"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
            
         
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
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>

     
        {(q || status !== 'all') && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
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
              className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              초기화
            </button>
          </div>
        )}

        {/* 목록(카드 형태) */}
        {pageData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2">수료증이 없습니다</h3>
            <p>
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
                              <div class="w-8 h-8 bg-cyan-600 rounded"></div>
                            </div>
                            <p class="text-sm text-gray-500">수료증</p>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-100 flex items-center justify-center">
                        <div className="w-8 h-8 bg-cyan-600 rounded"></div>
                      </div>
                      <p className="text-sm">수료증</p>
                    </div>
                  )}
                  
          
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs  ${badgeOf(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

       
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                    {c.certificateName}
                  </h3>
                  
              
                  <p className="text-sm mb-3">
                    {c.issuer}
                  </p>
                  
                  {/* 수료자 정보 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs">
                        {c.userName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm">{c.userName}</p>
                      <p className="text-xs">수료자</p>
                    </div>
                  </div>
                  
                  {/* 발급일 */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span>발급일</span>
                    <span className="">
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
              className="px-4 h-10 rounded-xl border border-gray-200 bg-white text-sm  hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              이전
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({length: totalPages}, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`
                    w-10 h-10 rounded-xl text-sm transition-colors
                    ${page === p 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
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
              className="px-4 h-10 rounded-xl border border-gray-200 bg-white text-sm  hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </main>
  );
}