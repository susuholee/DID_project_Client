// src/app/dashboard/page.jsx
"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useUserStore from "@/Store/userStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

// Suspense로 감쌀 메인 대시보드 컴포넌트
function DashboardContent() {
  const searchParams = useSearchParams();
  
  // 전역 상태에서 사용자 정보 가져오기
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  // 사용자 더미 데이터 (지갑 정보 등 추가 데이터)
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    console.log("대시보드 useEffect 실행:", { user, isLoggedIn });
    if (!user || !isLoggedIn) {
      console.log("사용자 정보 또는 로그인 상태 없음");
      return;
    }
    
    console.log("userData 설정 중...");
    setUserData({
      ...user,
      did: user.did || "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
      wallet: user.wallet || "0x7474cd35c569c0532fe5b966f37daf59c145b5cf",
      stats: { totalVCs: 3, verified: 2, pending: 1, onChain: 3 },
      // 관리자 승인 후 발급된 인증서들 (verified 상태만)
      certificates: [
        {
          id: 1,
          title: "블록체인 개발자 자격증",
          issuer: "경일IT게임아카데미",
          date: "2024-03-15",
          status: "verified",
          approvedAt: "2024-03-15T10:30:00"
        },
        {
          id: 2,
          title: "웹 개발 전문가 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-03-10",
          status: "verified",
          approvedAt: "2024-03-10T14:20:00"
        },
        {
          id: 3,
          title: "게임 개발 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-03-08",
          status: "verified",
          approvedAt: "2024-03-08T09:15:00"
        },
        {
          id: 4,
          title: "데이터 분석 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-03-05",
          status: "verified",
          approvedAt: "2024-03-05T16:45:00"
        },
        {
          id: 5,
          title: "AI/ML 개발 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-03-01",
          status: "verified",
          approvedAt: "2024-03-01T11:30:00"
        },
        {
          id: 6,
          title: "모바일 앱 개발 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-02-25",
          status: "verified",
          approvedAt: "2024-02-25T13:20:00"
        },
        {
          id: 7,
          title: "클라우드 컴퓨팅 수료증",
          issuer: "경일IT게임아카데미",
          date: "2024-02-20",
          status: "verified",
          approvedAt: "2024-02-20T16:45:00"
        }
      ],
    });
  }, [user, isLoggedIn]);

  console.log("대시보드 렌더링 조건 확인:", { user: !!user, isLoggedIn, userData: !!userData });
  
  if (!user || !isLoggedIn || !userData) {
    console.log("로딩 중... 조건:", { user: !!user, isLoggedIn, userData: !!userData });
    return <p className="text-center mt-10">로딩 중...</p>;
  }

  const displayName = user.nickName || user.name || user.userName;
  const certs = Array.isArray(userData?.certificates) ? userData.certificates : [];
  const pendingApps = Array.isArray(userData?.pendingApplications) ? userData.pendingApplications : [];

  // 차트 데이터 생성 함수 (더미 데이터 포함)
  const generateChartData = () => {
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    
    // 더미 데이터로 차트를 풍부하게 만들기
    const dummyData = [2, 5, 3, 8, 6, 4, 1]; // 각 요일별 더미 발급 수
    
    return daysOfWeek.map((day, index) => {
      // 실제 데이터와 더미 데이터 합산
      const actualIssued = certs.filter(cert => {
        const certDate = new Date(cert.approvedAt);
        return certDate.getDay() === index;
      }).length;
      
      return {
        name: day,
        issued: actualIssued + dummyData[index]
      };
    });
  };

  const chartData = generateChartData();

  // 파이 차트 데이터 (수료증 유형별 통계)
  const pieData = [
    { name: '블록체인 개발', value: 2, color: '#06B6D4' },
    { name: '웹 개발', value: 2, color: '#22D3EE' },
    { name: '데이터 분석', value: 1, color: '#67E8F9' },
    { name: '게임 개발', value: 1, color: '#A5F3FC' },
    { name: 'AI/ML', value: 1, color: '#CFFAFE' }
  ];

  // 라인 차트 데이터 (월별 발급 추이)
  const lineData = [
    { month: '1월', issued: 2 },
    { month: '2월', issued: 4 },
    { month: '3월', issued: 6 },
    { month: '4월', issued: 8 },
    { month: '5월', issued: 5 },
    { month: '6월', issued: 7 }
  ];

  // 최근 발급된 인증서 (관리자 승인 후 발급) - 최신 5개만
  const recentIssuedCerts = certs
    .filter(cert => cert.status === "verified") // 발급 완료된 것만
    .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt)) // 승인일 기준 최신순
    .slice(0, 5); // 상위 5개만

  // 통계 계산 (더미 데이터 포함)
  const stats = {
    todayIssued: certs.filter(cert => {
      const today = new Date().toDateString();
      return new Date(cert.approvedAt).toDateString() === today;
    }).length + 3, // 더미 데이터 추가
    last30Days: certs.filter(cert => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(cert.approvedAt) >= thirtyDaysAgo;
    }).length + 15, // 더미 데이터 추가
    totalIssued: certs.length + 25, // 더미 데이터 추가
    pendingCount: pendingApps.length + 2 // 더미 데이터 추가
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
      <main className="min-h-screen bg-gray-50 lg:ml-64">
        <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
          {/* 헤더 섹션 */}
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    안녕하세요, {displayName}님
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    수료증 관리 대시보드에 오신 것을 환영합니다.
                  </p>
                </div>
                <div className="flex items-center justify-between lg:justify-end lg:space-x-6">
                  <div className="text-center lg:text-right">
                    <p className="text-sm text-gray-500 mb-1">총 발급된 수료증</p>
                    <p className="text-2xl lg:text-3xl font-bold text-cyan-500">{stats.totalIssued}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* 메인 콘텐츠 */}
            <section className="col-span-1 xl:col-span-8 space-y-6">

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">오늘 발급</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.todayIssued}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">30일간 발급</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.last30Days}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">총 발급</p>
                      <p className="text-3xl font-bold text-cyan-500">{stats.totalIssued}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">승인 대기</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pendingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수료증 발급 현황 차트 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">수료증 발급 현황</h2>
                    <p className="text-sm text-gray-500">요일별 발급된 수료증 수</p>
                  </div>
                  <div className="hidden lg:flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">오늘 발급</p>
                      <p className="text-lg font-bold text-cyan-500">{stats.todayIssued}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">30일간 총 발급</p>
                      <p className="text-lg font-bold text-cyan-500">{stats.last30Days}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">전체 발급</p>
                      <p className="text-lg font-bold text-gray-900">{stats.totalIssued}개</p>
                    </div>
                  </div>
                </div>
                
                {/* Recharts 바 차트 */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}개`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                {`${payload[0].value}개 발급`}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="issued" 
                        fill="#06B6D4" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 최근 발급된 VC 목록 (관리자 승인 후) */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">발급된 수료증</h2>
                    <p className="text-sm text-gray-500">최근 발급된 수료증 목록입니다</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/certificates/issue"
                      className="px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      새 발급 요청
                    </Link>
                  </div>
                </div>

                {recentIssuedCerts.length > 0 ? (
                  <div className="space-y-3">
                    {recentIssuedCerts.map((cert, idx) => (
                      <div
                        key={cert.id || idx}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* 왼쪽: 아이콘과 기본 정보 */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <div className="w-5 h-5 bg-green-500 rounded"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                                {cert.title}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                <span className="font-medium">{cert.issuer}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{cert.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* 오른쪽: 상태와 액션 */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              발급 완료
                            </div>                      
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto mb-6 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-400 rounded"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      아직 발급된 수료증이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      블록체인 기반의 안전하고 신뢰할 수 있는 수료증을 발급받아보세요.
                    </p>
                    <Link
                      href="/certificates/issue"
                      className="inline-flex items-center px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      발급 요청하기
                    </Link>
                  </div>
                )}
              </div>

            </section>

            {/* 사이드 패널 */}
            <aside className="col-span-1 xl:col-span-4 space-y-6">
              {/* 사용자 & 지갑 통합 카드 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* 사용자 프로필 헤더 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {user?.imgPath || user?.kakaoData?.profile_image ? (
                      <img
                        src={user.imgPath || user.kakaoData?.profile_image}
                        alt="프로필"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-xl font-bold">
                        {displayName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {displayName || '사용자'}
                    </h3>
                    <p className="text-sm text-gray-500">Sealium 사용자</p>
                    <div className="flex items-center gap-2 mt-1">
                    </div>
                  </div>
                </div>

                {/* 지갑 정보 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">지갑 정보</p>
                    <span className="text-xs text-gray-500">Avalanche C-Chain</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono text-gray-900 font-medium">
                            {userData.walletAddress?.slice(0, 7)}...{userData.walletAddress?.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">지갑 주소</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(userData.walletAddress)}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                        title="전체 주소 복사"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* 수료증 유형별 통계 (파이 차트) */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">수료증 유형별 통계</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                {data.name}: {data.value}개
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: item.color}}></div>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.value}개</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 월별 발급 추이 (라인 차트) */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 발급 추이</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}개`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                {label}: {payload[0].value}개 발급
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="issued" 
                        stroke="#06B6D4" 
                        strokeWidth={3}
                        dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#06B6D4', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

  
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// Loading fallback 컴포넌트
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
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