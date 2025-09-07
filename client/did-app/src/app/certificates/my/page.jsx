// src/app/certificates/my/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MyCertificatesPage() {
  const router = useRouter();

  // 헤더용 사용자
  const [user, setUser] = useState(null);
  useEffect(() => {
    const cu = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (cu) setUser(cu);
  }, []);
  const displayName = useMemo(
    () => (user?.isKakaoUser ? user?.nickname : user?.name) || '사용자',
    [user]
  );

  // 알림 (헤더에 주입) - 로컬스토리지 연동
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('notifications') || '[]');
    if (Array.isArray(saved) && saved.length) setNotifications(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  const pushNotif = (title, message) =>
    setNotifications((prev) => [
      { id: Date.now(), title, message, ts: Date.now(), read: false },
      ...prev,
    ]);

  // 더미 수료증 데이터 (유효/폐기만)
  const [allCerts] = useState([
    { id: 1,  title: '블록체인 기초 과정 수료증', issuer: '경일IT게임아카데미', issueDate: '2025-01-15', status: '유효',   imageUrl: '/images/dummy_certificate.jpg' },
    { id: 2,  title: '스마트컨트랙트 개발 심화',   issuer: '크로스허브',         issueDate: '2024-05-20', status: '폐기',   imageUrl: '/images/dummy_certificate2.jpg' },
    { id: 3,  title: 'DID 인증 시스템 실습',      issuer: '경일IT게임아카데미', issueDate: '2025-03-02', status: '유효',   imageUrl: '/images/dummy_certificate3.png' },
    { id: 4,  title: '웹3 서비스 아키텍처',       issuer: '크로스허브',         issueDate: '2024-11-30', status: '유효',   imageUrl: '/images/dummy_certificate.jpg' },
    { id: 5,  title: '인증 배지 운영 가이드',     issuer: '경일IT게임아카데미', issueDate: '2025-02-18', status: '유효',   imageUrl: '/images/dummy_certificate2.jpg' },
    { id: 6,  title: '암호학 개론',               issuer: '크로스허브',         issueDate: '2024-09-10', status: '유효',   imageUrl: '/images/dummy_certificate3.png' },
    { id: 7,  title: 'NFT 개발 실습',             issuer: '크로스허브',         issueDate: '2024-08-15', status: '유효',   imageUrl: '/images/dummy_certificate3.png' },
    { id: 8,  title: 'DeFi 프로토콜 분석',        issuer: '경일IT게임아카데미', issueDate: '2024-07-20', status: '폐기',   imageUrl: '/images/dummy_certificate3.png' },
    { id: 9,  title: '솔리디티 프로그래밍',       issuer: '크로스허브',         issueDate: '2024-06-10', status: '유효',   imageUrl: '/images/dummy_certificate3.png' },
    { id: 10, title: '토큰이코노믹스 설계',       issuer: '경일IT게임아카데미', issueDate: '2024-05-05', status: '유효',   imageUrl: '/images/dummy_certificate3.png' },
  ]);

  // 검색/정렬/상태필터/페이지
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date_desc');       // date_desc | date_asc | title | issuer
  const [status, setStatus] = useState('all');         // all | 유효 | 폐기
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // 필터링 + 정렬
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    let arr = allCerts.filter((c) => {
      // 제목과 기관명 모두에서 검색
      const matchText = !text || 
        c.title.toLowerCase().includes(text) || 
        c.issuer.toLowerCase().includes(text);
      
      const matchStatus = status === 'all' ? true : c.status === status;
      return matchText && matchStatus;
    });

    // 정렬
    arr = [...arr].sort((a, b) => {
      if (sort === 'date_desc') return b.issueDate.localeCompare(a.issueDate);
      if (sort === 'date_asc')  return a.issueDate.localeCompare(b.issueDate);
      if (sort === 'title')     return a.title.localeCompare(b.title, 'ko');
      if (sort === 'issuer')    return a.issuer.localeCompare(b.issuer, 'ko');
      return 0;
    });

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
    if (s === '폐기')   return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-600';
  };

  // 검색 타입에 따른 placeholder 텍스트
  const getPlaceholder = () => {
    return '수료증명 또는 기관명 검색';
  };

  // 상세 페이지로 이동
  const handleCertificateClick = (cert) => {
    // 수료증 데이터를 세션스토리지에 저장
    sessionStorage.setItem('selectedCertificate', JSON.stringify(cert));
    
    // 상세 페이지로 이동
     router.push(`/certificates/detail?id=${cert.id}`);
  };

  // 액션 핸들러들
  const handleShare = async (cert, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    try {
      // DID 기반 공유 링크 생성
      const shareData = {
        did: cert.holderDID || 'did:example:1234567890abcdef',
        title: cert.title,
        issuer: cert.issuer,
        vcHash: cert.vcHash || 'hash_' + cert.id,
        publicKey: cert.publicKey || '0x1234567890abcdef'
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
      
      // 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      pushNotif('폐기 요청 완료', `"${cert.title}" 폐기 요청이 관리자에게 전송되었습니다.`);
    } catch (error) {
      console.error('폐기 요청 실패:', error);
      pushNotif('폐기 요청 실패', '폐기 요청 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = (cert, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    // 더미 다운로드 동작
    pushNotif('다운로드 시작', `"${cert.title}" 다운로드를 시작합니다.`);
  };

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
                  {opt.label}
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

          {/* 목록(카드형) */}
          {pageData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl text-gray-400">📄</span>
              </div>
              <p className="text-gray-600">조건에 맞는 수료증이 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.map((c) => (
                <article
                  key={c.id}
                  onClick={() => handleCertificateClick(c)}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    {/* 발급 기관 */}
                    <p className="text-sm font-medium text-cyan-600">
                      {c.issuer}
                    </p>
                    {/* 상태 뱃지 */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeOf(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                    {c.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    {/* 발급일 */}
                    <p className="text-sm text-gray-500">
                      발급일: {c.issueDate}
                    </p>
                    
                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleDownload(c, e)}
                        className="text-xs font-medium text-gray-500 hover:text-cyan-600 transition-colors"
                      >
                        다운로드
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={(e) => handleShare(c, e)}
                        className="text-xs font-medium text-gray-500 hover:text-cyan-600 transition-colors"
                      >
                        공유
                      </button>
                    </div>
                  </div>
                </article>
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