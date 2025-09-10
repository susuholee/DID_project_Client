'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useUserStore from '@/Store/userStore';

// API 함수
const fetchVCRequestLogs = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs`, {
    });
    
    console.log('VC Request Logs 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('VC Request Logs 조회 실패:', error);
    throw new Error(`요청 현황 조회 실패: ${error.message}`);
  }
};

export default function CertificateRequestsPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useUserStore();

  // TanStack Query로 요청 현황 데이터 조회
  const { 
    data: requestLogs, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery({
    queryKey: ['vcRequestLogs'],
    queryFn: fetchVCRequestLogs,
    enabled: !!isLoggedIn && !!user,
    staleTime: 30 * 1000, // 30초간 캐시 유지 (실시간성 중요)
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // 탭 상태
  const [activeTab, setActiveTab] = useState('all'); // all | issue | revoke
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | approved | rejected

  // UI 상태들
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [issuerFilter, setIssuerFilter] = useState('all');
  
  const itemsPerPage = 5;

  // 취소 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // 경고 모달 상태
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const displayName = user?.nickName || user?.name || user?.userName || '사용자';

  // 로그인 체크
  useEffect(() => {
    if (!isLoggedIn || !user) {
      router.push('/');
      return;
    }
  }, [isLoggedIn, user, router]);

  // 서버 데이터 처리 및 분류
  const processedRequests = useMemo(() => {
    if (!requestLogs || !Array.isArray(requestLogs)) return [];
    
    return requestLogs.map(log => ({
      id: log.id,
      certificateName: log.certificateName || '수료증',
      issuer: log.issuer || '발급기관',
      reason: log.description || log.reason || '사유 없음',
      requestedAt: log.createdAt || log.requestedAt || new Date().toISOString(),
      status: log.status || 'pending', // pending, approved, rejected
      adminNote: log.adminNote || log.note,
      requestType: log.request === 'issue' ? 'issue' : 'revoke', // issue 또는 revoke
      userId: log.userId,
      userName: log.userName,
    }));
  }, [requestLogs]);

  // 현재 사용자의 요청만 필터링
  const userRequests = useMemo(() => {
    if (!user?.userId) return [];
    return processedRequests.filter(req => req.userId === user.userId);
  }, [processedRequests, user?.userId]);

  // 현재 탭에 따른 데이터
  const currentRequests = useMemo(() => {
    if (activeTab === 'all') {
      return userRequests;
    } else if (activeTab === 'issue') {
      return userRequests.filter(req => req.requestType === 'issue');
    } else {
      return userRequests.filter(req => req.requestType === 'revoke');
    }
  }, [activeTab, userRequests]);

  // 발급기관 목록 (필터용)
  const issuers = [...new Set(currentRequests.map(req => req.issuer))];

  // 필터링 및 정렬
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = currentRequests.filter(req => {
      const matchesSearch = req.certificateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           req.issuer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesIssuer = issuerFilter === 'all' || req.issuer === issuerFilter;
      
      // 날짜 필터링
      if (dateRange.start || dateRange.end) {
        const reqDate = new Date(req.requestedAt);
        if (dateRange.start && reqDate < new Date(dateRange.start)) return false;
        if (dateRange.end && reqDate > new Date(dateRange.end)) return false;
      }
      
      return matchesSearch && matchesStatus && matchesIssuer;
    });

    return filtered.sort((a, b) => {
      const aValue = new Date(a.requestedAt);
      const bValue = new Date(b.requestedAt);
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [currentRequests, searchTerm, statusFilter, issuerFilter, dateRange, sortOrder]);

  // 페이지네이션을 위한 데이터 처리
  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage);
  const paginatedRequests = filteredAndSortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 통계 계산
  const stats = useMemo(() => {
    const total = userRequests.length;
    const pending = userRequests.filter(req => req.status === 'pending').length;
    const approved = userRequests.filter(req => req.status === 'approved').length;
    const rejected = userRequests.filter(req => req.status === 'rejected').length;
    
    // 탭별 카운트
    const issueCount = userRequests.filter(req => req.requestType === 'issue').length;
    const revokeCount = userRequests.filter(req => req.requestType === 'revoke').length;
    
    return { total, pending, approved, rejected, issueCount, revokeCount };
  }, [userRequests]);

  // 상태별 스타일
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-cyan-100 text-cyan-700`;
      case 'approved':
        return `${baseClasses} bg-emerald-100 text-emerald-700`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  // 요청 타입별 배지 스타일
  const getRequestTypeBadge = (requestType) => {
    switch (requestType) {
      case 'issue':
        return 'bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-xs font-medium';
      case 'revoke':
        return 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium';
    }
  };

  const getRequestTypeText = (requestType) => {
    switch (requestType) {
      case 'issue': return '발급';
      case 'revoke': return '폐기';
      default: return '기타';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거절됨';
      default: return '알 수 없음';
    }
  };

  // 취소 모달 열기
  const openCancelModal = (request) => {
    setRequestToCancel(request);
    setShowCancelModal(true);
  };

  // 취소 모달 닫기
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setRequestToCancel(null);
    setCancelReason('');
  };

  // 경고 모달 표시 함수
  const showWarning = (message) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  // 경고 모달 닫기
  const closeWarningModal = () => {
    setShowWarningModal(false);
    setWarningMessage('');
  };

  // 요청 취소 확정 (실제 API 호출 필요)
  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    
    if (!cancelReason.trim()) {
      showWarning('취소 사유를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 취소 API 호출
      // await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/vcrequestlogs/${requestToCancel.id}`, {
      //   data: { reason: cancelReason },
      //   withCredentials: true
      // });

      // 데이터 새로고침
      refetch();
      closeCancelModal();
      
      // 임시 알림 (추후 전역 알림 시스템으로 대체)
      alert(`${requestToCancel.certificateName} 요청이 성공적으로 취소되었습니다.`);
    } catch (error) {
      console.error('요청 취소 실패:', error);
      showWarning('요청 취소 중 오류가 발생했습니다.');
    }
  };

  // 스켈레톤 로더
  const RequestSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="h-16 bg-gray-200 rounded-lg"></div>
    </div>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="flex-1 flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-600">요청 현황을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="flex-1 flex items-center justify-center py-8 px-4">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-red-500 rounded"></div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 실패</h2>
              <p className="text-gray-600 mb-4">{error?.message || '요청 현황을 불러오는 중 오류가 발생했습니다.'}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-6xl">
              {/* 상단 헤더 */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">요청 현황</h1>
                <p className="text-gray-600">수료증 발급 및 폐기 요청 현황을 확인하세요.</p>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-500">전체 요청</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-cyan-600">{stats.pending}</div>
                  <div className="text-sm text-gray-500">대기중</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
                  <div className="text-sm text-gray-500">승인됨</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-500">거절됨</div>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="mb-6">
                <div className="border-b border-gray-200 bg-white rounded-t-xl">
                  <nav className="-mb-px flex px-6">
                    <button
                      onClick={() => {
                        setActiveTab('all');
                        setCurrentPage(1);
                      }}
                      className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'all'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      전체 요청 ({stats.total})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('issue');
                        setCurrentPage(1);
                      }}
                      className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'issue'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      발급 요청 ({stats.issueCount})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('revoke');
                        setCurrentPage(1);
                      }}
                      className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'revoke'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      폐기 요청 ({stats.revokeCount})
                    </button>
                  </nav>
                </div>
              </div>

              {/* 검색 및 필터 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-4">
                  {/* 검색 및 액션 */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="수료증명 또는 발급기관 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          showFilters ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        필터
                      </button>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {sortOrder === 'asc' ? '오래된순' : '최신순'}
                      </button>
                      <button
                        onClick={() => refetch()}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        새로고침
                      </button>
                    </div>
                  </div>

                  {/* 확장 필터 */}
                  {showFilters && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">발급기관</label>
                          <select
                            value={issuerFilter}
                            onChange={(e) => setIssuerFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="all">전체 기관</option>
                            {issuers.map(issuer => (
                              <option key={issuer} value={issuer}>{issuer}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상태 필터 태그 */}
                  <div className="flex flex-wrap gap-2 mt-4 -mb-2">
                    {[
                      { key: 'all', label: '전체', count: stats.total },
                      { key: 'pending', label: '대기중', count: stats.pending },
                      { key: 'approved', label: '승인됨', count: stats.approved },
                      { key: 'rejected', label: '거절됨', count: stats.rejected },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setStatusFilter(filter.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          statusFilter === filter.key
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 요청 목록 */}
              {paginatedRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    요청 내역이 없습니다
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? '검색 조건에 맞는 요청이 없어요.'
                      : `아직 ${activeTab === 'all' ? '' : activeTab === 'issue' ? '발급' : '폐기'} 요청이 없어요.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.certificateName}
                            </h3>
                            {activeTab === 'all' && (
                              <span className={getRequestTypeBadge(request.requestType)}>
                                {getRequestTypeText(request.requestType)}
                              </span>
                            )}
                            <span className={getStatusBadge(request.status)}>
                              {getStatusText(request.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">발급기관:</span>
                              <span className="ml-2 text-gray-900 font-medium">{request.issuer}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">요청일:</span>
                              <span className="ml-2 text-gray-900 font-medium">
                                {new Date(request.requestedAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-gray-500 text-sm">요청 사유:</span>
                            <p className="mt-1 text-gray-900 text-sm">{request.reason}</p>
                          </div>

                          {request.adminNote && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 text-sm">관리자 메모:</span>
                              <p className="mt-1 text-gray-900 text-sm">{request.adminNote}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-6">
                          {request.status === 'pending' && (
                            <button 
                              onClick={() => openCancelModal(request)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              요청 취소
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    이전
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 border rounded-lg text-sm ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    다음
                  </button>
                </div>
              )}

              {/* 정보 표시 */}
              {filteredAndSortedRequests.length > 0 && (
                <div className="text-center mt-4">
                  <p className="text-gray-500 text-sm">
                    총 {filteredAndSortedRequests.length}개 중 {Math.min(currentPage * itemsPerPage, filteredAndSortedRequests.length)}개 표시 중
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40"
            onClick={closeCancelModal}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">요청 취소</h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  취소 사유를 입력해주세요
                </p>
                
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="예) 오타가 있어요 / 정보 변경 필요 / 분실"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={4}
                />
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeCancelModal}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmCancelRequest}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg font-medium"
                  >
                    취소 확정
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 경고 모달 */}
      {showWarningModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-50"
            onClick={closeWarningModal}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">알림</h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-6 text-center">
                  {warningMessage}
                </p>
                
                <button
                  onClick={closeWarningModal}
                  className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}