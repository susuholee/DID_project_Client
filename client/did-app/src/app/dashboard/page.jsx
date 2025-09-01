// src/app/dashboard/page.jsx
"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Suspense로 감쌀 메인 대시보드 컴포넌트
function DashboardContent() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // 사용자 더미 데이터
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) return;
    setUser({
      ...currentUser,
      did: currentUser.did || "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
      wallet: currentUser.wallet || "0x7474cd35c569c0532fe5b966f37daf59c145b5cf",
      stats: { totalVCs: 3, verified: 2, pending: 1, onChain: 3 },
      // 관리자 승인 후 발급된 인증서들 (verified 상태만)
      certificates: [
        // {
        //   id: 1,
        //   title: "블록체인 개발자 자격증",
        //   issuer: "한국블록체인협회",
        //   date: "2024-03-15",
        //   status: "verified",
        //   approvedAt: "2024-03-15T10:30:00"
        // },
        // {
        //   id: 2,
        //   title: "컴퓨터공학 학사",
        //   issuer: "한국대학교",
        //   date: "2023-02-28",
        //   status: "verified",
        //   approvedAt: "2024-03-10T14:20:00"
        // },
        // {
        //   id: 3,
        //   title: "한식 수료증",
        //   issuer: "수호 아카데미",
        //   date: "2024-01-28",
        //   status: "verified",
        //   approvedAt: "2024-03-08T09:15:00"
        // },
        // {
        //   id: 4,
        //   title: "일식 수료증",
        //   issuer: "수호 아카데미",
        //   date: "2024-01-27",
        //   status: "verified",
        //   approvedAt: "2024-03-05T16:45:00"
        // },
        // {
        //   id: 5,
        //   title: "중식 수료증",
        //   issuer: "수호 아카데미",
        //   date: "2024-01-26",
        //   status: "verified",
        //   approvedAt: "2024-03-01T11:30:00"
        // }
      ],
      // 대기 중인 신청서들 (별도 관리)
      pendingApplications: [
        {
          id: 101,
          title: "파이썬 프로그래밍 수료증",
          issuer: "코딩아카데미",
          requestedAt: "2024-03-18",
          status: "pending"
        },
        {
          id: 102,
          title: "웹 디자인 수료증",
          issuer: "디자인스쿨",
          requestedAt: "2024-03-17",
          status: "pending"
        }
      ]
    });

    // 알림 로딩 추가
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(savedNotifications);
  }, []);

  // 로컬스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      setNotifications(savedNotifications);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 알림 상태 변경 시 로컬스토리지에 저장
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  if (!user) return <p className="text-center mt-10">로딩 중...</p>;

  const displayName = user.isKakaoUser ?? user.name ?? user.userName;
  const certs = Array.isArray(user?.certificates) ? user.certificates : [];
  const pendingApps = Array.isArray(user?.pendingApplications) ? user.pendingApplications : [];

  // 최근 발급된 인증서 (관리자 승인 후 발급) - 최신 5개만
  const recentIssuedCerts = certs
    .filter(cert => cert.status === "verified") // 발급 완료된 것만
    .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt)) // 승인일 기준 최신순
    .slice(0, 5); // 상위 5개만

  // 통계 계산
  const stats = {
    todayIssued: certs.filter(cert => {
      const today = new Date().toDateString();
      return new Date(cert.approvedAt).toDateString() === today;
    }).length,
    last30Days: certs.filter(cert => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(cert.approvedAt) >= thirtyDaysAgo;
    }).length,
    totalIssued: certs.length,
    pendingCount: pendingApps.length
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
          {/* 환영 */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              환영합니다, {user.userName ?? user.name}님
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              분산 신원 증명(DID) 기반 수료증 관리 플랫폼입니다. 블록체인으로 안전하게
              보호된 당신의 자격증명을 관리하세요.
            </p>
          </div>

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* VC 목록 */}
            <section className="col-span-1 lg:col-span-8 space-y-4 lg:space-y-6">

              {/* 인증서 발급 통계 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">인증서 발급 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">오늘 발급 건수</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.todayIssued}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">지난 30일간 발급 건수</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.last30Days}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">총 발급 건수</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalIssued}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">승인 대기 중</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingCount}</p>
                  </div>
                </div>
              </div>

              {/* 최근 발급된 VC 목록 (관리자 승인 후) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">최근 발급된 VC 목록</h2>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/certificates/issue"
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-rose-500 text-sm font-medium"
                    >
                      발급 요청
                    </Link>
                  </div>
                </div>

                {recentIssuedCerts.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {recentIssuedCerts.map((cert, idx) => (
                      <div
                        key={cert.id || idx}
                        className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-medium bg-green-100 border-2 border-green-300 text-green-700">
                              발급됨
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {cert.title}
                              </h3>
                              <div className="mt-1 space-y-0.5 sm:space-y-1">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  <span className="font-medium">발급기관:</span> {cert.issuer}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  <span className="font-medium">발급일:</span> {cert.date}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  <span className="font-medium">승인일:</span> {formatDate(cert.approvedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Link
                    href="/certificates/issue"
                    className="group relative block border-2 border-double border-gray-300 rounded-2xl p-8 sm:p-10 text-center hover:border-rose-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="mx-auto mb-4 px-5 py-3 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <span className="text-xl sm:text-2xl font-bold text-rose-500">발급하기</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-rose-500 transition-colors">
                      첫 수료증을 발급해보세요
                    </p>
                    <p className="text-sm text-gray-600 mt-2 group-hover:text-gray-800 transition-colors">
                      클릭하여 수료증 발급 요청이 시작됩니다.
                    </p>
                  </Link>
                )}
              </div>

            </section>

            {/* 사이드 패널 */}
            {/* <aside className="col-span-1 lg:col-span-4 space-y-4 lg:space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  DID 신원 정보
                </h3>

                <div className="text-center mb-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    {user?.profile ? (
                      <img
                        src={user.profile}
                        alt="프로필"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-lg sm:text-xl font-bold">
                        {displayName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{user.userName ?? user.name}</h4>
                  <div className="flex items-center justify-center gap-2 mt-2">
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      DID 식별자
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <p className="text-xs font-mono text-gray-700 break-all flex-1">
                        {user.did}
                      </p>
                      <button
                        onClick={() => copyToClipboard(user.did)}
                        className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-600 hover:text-gray-800"
                        title="복사"
                      >
                        복사
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      지갑 주소
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <p className="text-xs font-mono text-gray-700 break-all flex-1">
                        {user.wallet}
                      </p>
                      <button
                        onClick={() => copyToClipboard(user.wallet)}
                        className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-600 hover:text-gray-800"
                        title="복사"
                      >
                        복사
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      연결된 네트워크
                    </label>
                    <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">아발란체</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside> */}
          </div>
        </div>
      </main>
    </>
  );
}

// Loading fallback 컴포넌트
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">대시보드를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 대시보드 페이지 컴포넌트
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function NotificationBell({ notifications, setNotifications }) {
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [open, setOpen] = useState(false);

  // 안 읽은 개수
  const unread = notifications.filter((n) => !n.read).length;

  // 바깥 클릭 닫기
  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const withinBtn = btnRef.current && btnRef.current.contains(e.target);
      const withinPop = popRef.current && popRef.current.contains(e.target);
      if (!withinBtn && !withinPop) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleOneRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 relative"
        aria-label="알림"
      >
        <Image src="/icons/bell.png" width={20} height={20} alt="알림" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-semibold">알림</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  모두 읽음
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  전체 삭제
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">새 알림이 없습니다.</div>
          ) : (
            <ul className="max-h-[60vh] overflow-auto divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-amber-50" : ""
                    }`}
                  onClick={() => toggleOneRead(n.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-sm text-gray-700 mt-0.5 break-words">{n.message}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{formatRelativeTime(n.ts)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* 유틸: 상대 시간 포맷 */
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = Math.floor(hr / 24);
  return `${d}일 전`;
}