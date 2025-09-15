"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useUserStore from "@/Store/userStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import axios from "axios";

const fetchUserVCs = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  
  try {    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/vc/${userId}`, {
      withCredentials: true,
    });
    const data = response.data;

   
    if (data && data.vc && data.vc.credentialSubject) {

      
      const credentialSubject = data.vc.credentialSubject;
      
      
      const normalizedItem = {
        id: credentialSubject.id,
        certificateName: credentialSubject.certificateName,
        issuer: credentialSubject.issuer,
        issueDate: credentialSubject.issueDate || new Date().toISOString(),
        status: credentialSubject.status === 'approved' ? '유효' : '폐기',
        imagePath: credentialSubject.ImagePath,
        userName: credentialSubject.userName,
        userId: credentialSubject.userId,
        description: credentialSubject.description,
        userDid: credentialSubject.userDid,
        issuerId: credentialSubject.issuerId,
        DOB: credentialSubject.DOB,
        requestDate: credentialSubject.requestDate,
        request: credentialSubject.request,
        createdAt: credentialSubject.issueDate || new Date().toISOString(),
        rawData: data,
        vc: {
          credentialSubject: credentialSubject
        }
      };

      return [normalizedItem];
    }
    
  
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return [];
      }

      const processedData = data.map((item, index) => {
        try {
          let credentialSubject = null;
          
          if (item && item.vc && item.vc.credentialSubject) {
            credentialSubject = item.vc.credentialSubject;
          } else if (item && item.message?.payload?.vc?.credentialSubject) {
            credentialSubject = item.message.payload.vc.credentialSubject;
          } else if (item && item.message?.verifiableCredential?.credentialSubject) {
            credentialSubject = item.message.verifiableCredential.credentialSubject;
          }
          
          if (!credentialSubject) {
            console.warn(`아이템 ${index}: credentialSubject를 찾을 수 없음`, item);
            return null;
          }

          return {
            id: credentialSubject.id,
            certificateName: credentialSubject.certificateName,
            issuer: credentialSubject.issuer,
            issueDate: credentialSubject.issueDate || item.issueDate,
            status: credentialSubject.status === 'approved' ? '유효' : '폐기',
            imagePath: credentialSubject.ImagePath,
            userName: credentialSubject.userName,
            userId: credentialSubject.userId,
            description: credentialSubject.description,
            userDid: credentialSubject.userDid,
            issuerId: credentialSubject.issuerId,
            DOB: credentialSubject.DOB,
            requestDate: credentialSubject.requestDate,
            request: credentialSubject.request,
            createdAt: credentialSubject.issueDate || item.issueDate || new Date().toISOString(),
            rawData: item,
            vc: {
              credentialSubject: credentialSubject
            }
          };
        } catch (error) {
          console.error(`아이템 ${index} 처리 중 오류:`, error, item);
          return null;
        }
      }).filter(Boolean);

      return processedData;
    }
    
   
   
    return [];
  } catch (error) {
    throw new Error(`수료증 조회 실패: ${error.message}`);
  }
};


function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

 
  const { 
    data: vcData, 
    isLoading: vcLoading, 
    isError: vcError,
    error,
    refetch: refetchVCs
  } = useQuery({
    queryKey: ['userVCs', user?.userId],
    queryFn: () => fetchUserVCs(user?.userId),
    enabled: !!user?.userId && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });




  useEffect(() => {
    if (!isLoggedIn || !user) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 1500); 
      
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, user, router]);


  if (!user || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4">
          </div>
        </div>
      </div>
    );
  }

  if (vcLoading) {
    return (
      <div className="min-h-screen  lg:ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">수료증 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }


  if (vcError) {
    console.error("VC 데이터 조회 에러:", error);
    return (
      <div className="min-h-screen  lg:ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded"></div>
          </div>
          <p className="text-red-600 mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-gray-500 text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }

  const displayName = user.nickName || user.name || user.userName;
  

  const allVCs = vcData || [];
  

  const issuedCerts = allVCs.filter(vc => vc.request === "issue");


  const generateChartData = () => {
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    
    return daysOfWeek.map((day, index) => {
      const dayIssued = issuedCerts.filter(cert => {
        if (!cert.issueDate && !cert.createdAt) return false;
        const certDate = new Date(cert.issueDate || cert.createdAt);
        return certDate.getDay() === index;
      }).length;
      
      return {
        name: day,
        issued: dayIssued
      };
    });
  };

  const chartData = generateChartData();


  const generatePieData = () => {
    if (issuedCerts.length === 0) return [];
    
    const typeCount = {};
    issuedCerts.forEach(cert => {
      const type = cert.certificateName || '기타';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#CFFAFE'];
    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const pieData = generatePieData();


  const generateLineData = () => {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const currentYear = new Date().getFullYear();
    
    return monthNames.map((month, index) => {
      const monthIssued = issuedCerts.filter(cert => {
        if (!cert.issueDate && !cert.createdAt) return false;
        const certDate = new Date(cert.issueDate || cert.createdAt);
        return certDate.getFullYear() === currentYear && certDate.getMonth() === index;
      }).length;
      
      return {
        month,
        issued: monthIssued
      };
    });
  };

  const lineData = generateLineData();

 
  const recentIssuedCerts = issuedCerts
    .sort((a, b) => {
      const aDate = new Date(a.issueDate || a.createdAt || 0);
      const bDate = new Date(b.issueDate || b.createdAt || 0);
      return bDate - aDate;
    })
    .slice(0, 5);

  
  const calculateStats = () => {
    const today = new Date().toDateString();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const todayIssued = issuedCerts.filter(cert => {
      const certDate = cert.issueDate || cert.createdAt;
      return certDate && new Date(certDate).toDateString() === today;
    }).length;

    const last30Days = issuedCerts.filter(cert => {
      const certDate = cert.issueDate || cert.createdAt;
      return certDate && new Date(certDate) >= thirtyDaysAgo;
    }).length;

    return {
      todayIssued,
      last30Days,
      totalIssued: issuedCerts.length
    };
  };

  const stats = calculateStats();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <main className="min-h-screen  lg:ml-64">
        <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    안녕하세요, {displayName}님
                  </h1>
                  <p className="text-base lg:text-lg">
                    나의 디지털 수료증을 확인해보세요.
                  </p>
                </div>
                <div className="flex items-center justify-between lg:justify-end lg:space-x-6">
                  <div className="text-center lg:text-right">
                    <p className="text-sm mb-1">보유한 수료증</p>
                    <p className="text-2xl lg:text-3xl font-bold text-cyan-500">{stats.totalIssued}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => refetchVCs()}
                      disabled={vcLoading}
                      className="px-4 py-2 bg-cyan-500 text-white text-sm  rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg 
                        className={`w-4 h-4 ${vcLoading ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {vcLoading ? '새로고침 중...' : '새로고침'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="col-span-1 xl:col-span-8 space-y-6">

           
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-2">오늘 획득</p>
                      <p className="text-3xl font-bold">{stats.todayIssued}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-2">30일간 획득</p>
                      <p className="text-3xl font-bold">{stats.last30Days}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-2">총 발급</p>
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
                      <p className="text-sm mb-2">이번 주 획득</p>
                      <p className="text-3xl">{chartData.reduce((sum, day) => sum + day.issued, 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

            
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1">나의 수료증 현황</h2>
                    <p className="text-sm">요일별 발급된 수료증 수</p>
                  </div>
                  <div className="hidden lg:flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm">오늘 획득</p>
                      <p className="text-lg font-bold text-cyan-500">{stats.todayIssued}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">30일간 총 획득</p>
                      <p className="text-lg font-bold text-cyan-500">{stats.last30Days}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">전체 보유</p>
                      <p className="text-lg font-bold">{stats.totalIssued}개</p>
                    </div>
                  </div>
                </div>
                
             
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

          
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1">최근 발급한 수료증</h2>
                    <p className="text-sm">최근에 발급받은 수료증 5개를 확인하세요</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/certificates/issue"
                      className="px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 transition-colors"
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
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {cert.imagePath ? (
                                <img
                                  src={cert.imagePath}
                                  alt={cert.certificateName || '수료증'}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-5 h-5 bg-cyan-500 rounded"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold mb-1 truncate">
                                {cert.certificateName || '수료증'}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                                <span className="">{cert.issuer || '발급기관'}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{formatDate(cert.issueDate || cert.createdAt)}</span>
                                {cert.status && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="text-green-600">{cert.status}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                  
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              발급 완료
                            </div>
                            {cert.id && (
                              <Link
                                href={`/certificates/detail?id=${cert.id}`}
                                className="text-xs text-cyan-600 hover:text-cyan-800 "
                              >
                                상세보기
                              </Link>
                            )}
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
                    <h3 className="text-xl font-semibold mb-4">
                      아직 발급받은 수료증이 없습니다
                    </h3>
                    <p className="mb-8 max-w-md mx-auto">
                      블록체인 기반의 안전하고 신뢰할 수 있는 수료증을 발급받아보세요.
                    </p>
                  </div>
                )}
              </div>

            </section>

            <aside className="col-span-1 xl:col-span-4 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                    <h3 className="text-lg font-semibold">
                      {displayName || '사용자'}
                    </h3>
                    <p className="text-sm">Sealium 사용자</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm">지갑 정보</p>
                    <span className="text-xs">Avalanche C-Chain</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-4 h-4 bg-cyan-300 rounded"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono">
                            {user.walletAddress?.slice(0, 7) || 'Loading'}...{user.walletAddress?.slice(-4) || '****'}
                          </p>
                          <p className="text-xs mt-1">지갑 주소</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

           
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">수료증 유형별 현황</h3>
                
                {pieData.length > 0 ? (
                  <>
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
                            <span>{item.name}</span>
                          </div>
                          <span className="">{item.value}개</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-base mb-2">
                      아직 발급받은 수료증이 없습니다
                    </h4>
                    <p className="text-sm">
                      수료증을 발급받으면 여기에 유형별 현황이 표시됩니다.
                    </p>
                  </div>
                )}
              </div>

             
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">월별 발급 추이</h3>
                
                {stats.totalIssued > 0 ? (
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
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-base mb-2">
                      월별 발급 데이터가 없습니다
                    </h4>
                    <p className="text-sm">
                      수료증을 발급받으면 여기에 월별 발급 추이가 표시됩니다.
                    </p>
                  </div>
                )}
              </div>

            </aside>
          </div>
        </div>
      </main>
    </>
  );
}


function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-600">대시보드를 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}


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