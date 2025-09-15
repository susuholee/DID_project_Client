"use client";

import React, { useEffect, useRef, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import useUserStore from "@/Store/userStore";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { useLoadingStore } from "@/Store/loadingStore";
import MainPageLoader from "@/components/UI/MainPageLoader";

export default function MainPage() {
  const sectionsRef = useRef([]);
  const router = useRouter();
  const { user, isLoggedIn, setUser, setIsLoggedIn } = useUserStore();
  const { startLoading, stopLoading } = useLoadingStore();

  useEffect(() => {
    startLoading("로딩 중...", "lg");
    
    const timer = setTimeout(() => {
      stopLoading();
    }, 3000);

    return () => clearTimeout(timer);
  }, [startLoading, stopLoading]);

  useEffect(() => {
    const handleScroll = () => {
      const triggerPoint = window.innerHeight * 0.8;
      sectionsRef.current.forEach((sec) => {
        if (sec) {
          const rect = sec.getBoundingClientRect();
          if (rect.top < triggerPoint && rect.bottom > 0) {
            sec.classList.add("section-visible");
            sec.classList.remove("section-hidden");
          } else {
            sec.classList.remove("section-visible");
            sec.classList.add("section-hidden");
          }
        }
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sectionProps = (index, extraClass = "") => ({
    ref: (el) => (sectionsRef.current[index] = el),
    className: `snap-start min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${extraClass} section-hidden`,
  });

  return (
    <>
      <MainPageLoader />
      <div className="min-h-screen bg-neutral-100 text-gray-900 flex flex-col animate-none">
      <main className="flex-1">
        <section
          {...sectionProps(0)}
          className="relative w-full h-screen section-hidden overflow-hidden"
        >
         <div className="absolute inset-0 z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-75 scale-110"
        style={{
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      >
        <source src="/images/sealium_background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
              
            
              <div className="absolute inset-0 z-1 bg-gradient-to-br from-cyan-900/20 via-transparent to-blue-900/20"></div>
              <div className="relative z-10 w-full h-full pt-8 pb-4 px-3 sm:pt-12 sm:pb-6 sm:px-6 md:pt-16 md:pb-8 md:px-8 flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-16 xl:gap-20 items-center justify-center text-white">
                
              
                <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-cyan-500/20 border border-cyan-400/30 rounded-full px-3 sm:px-5 py-2 sm:py-3 mb-3 sm:mb-5 lg:mb-6 hidden lg:inline-flex">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm  text-cyan-300">블록체인 기반 수료증 플랫폼</span>
                  </div>
                  
                  <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold mb-3 lg:mb-4 drop-shadow-lg text-white/90 animate-fade-in-up animation-delay-200 hidden lg:block">
                    검증 가능한 수료증 발급 플랫폼
                  </p>
                  
  
                  <div className="flex flex-col items-center lg:items-start gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6 animate-fade-in-up animation-delay-400 relative z-10">
                    <img 
                      src="/icons/sealium_logo.png" 
                      alt="Sealium" 
                      className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 flex-shrink-0 drop-shadow-lg" 
                    />
                    <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-cyan-400 drop-shadow-lg text-center lg:text-left">
                      Sealium
                    </h1>
                  </div>
                  
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow-lg text-gray-200 mb-4 sm:mb-6 lg:mb-8 animate-fade-in-up animation-delay-600 px-2">
                    디지털 수료증명 발급, 검증, 공유를 모두 하나의 지갑에서 안전하게.
                    <span className="text-cyan-300"> 블록체인 기반으로 신뢰성을 보장합니다.</span>
                  </p>
                  
               
                  <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-800 hidden lg:flex">
                    <div className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border border-white/20">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-white/90">자동 발급</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border border-white/20">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-white/90">즉시 검증</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border border-white/20">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-white/90">보안 보장</span>
                      </div>
                    </div>
                  </div>
            </div>
                
              
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl animate-fade-in-up animation-delay-1000">
              {isLoggedIn && user ? (
                    <div className="bg-cyan-500/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl border border-cyan-400/30">
                  <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="relative">
                    <img
                      src={user.imgPath || '/images/default.png'}
                      alt="프로필"
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
                    />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    환영합니다, {user.nickName}님!
                  </h3>
                      <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">
                    이미 로그인되어 있습니다.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                        className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg border border-white/30 hover:shadow-xl text-sm sm:text-base"
                  >
                    대시보드로 이동
                  </button>
                </div>
              ) : (
                  <LoginForm />
                  )}
                </div>
              </div>
        </section>

    
        <section {...sectionProps(1, "bg-gray-50")}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20">
              
            
              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md lg:max-w-lg">
                  <div className="absolute -inset-4 bg-cyan-400/20 rounded-3xl blur-2xl"></div>
                  
                  <div className="relative transform hover:scale-105 transition-all duration-500 group">
                    <img
                      src="/images/vc_example.jpg"
                      alt="Sealium 수료증 샘플"
                      className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200 group-hover:shadow-cyan-500/25 transition-shadow duration-500"
                    />
                    
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
                  </div>
                </div>
              </div>


              <div className="flex-1 text-center lg:text-left">
                <div className="space-y-4 sm:space-y-6">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-cyan-100 text-cyan-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    자동화 시스템
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    디지털 수료증명 발급 및 관리
                    <span className="block text-cyan-500 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                      자동화
                    </span>
                </h2>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white/60 rounded-xl sm:rounded-2xl border border-gray-200/50">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-base sm:text-lg text-gray-700  mb-1 sm:mb-2">블록체인 인증 기반 시스템</p>
                        <p className="text-sm sm:text-base text-gray-600">과정 종료 시 자동으로 디지털 수료증명이 발급됩니다.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white/60 rounded-xl sm:rounded-2xl border border-gray-200/50">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-sm"></div>
                      </div>
                      <div>
                        <p className="sm:text-lg mb-1 sm:mb-2">효율적인 관리</p>
                        <p className="text-sm sm:text-base text-gray-600">관리자는 운영 부담을 줄이고, 사용자는 즉시 디지털 수료증명을 확인할 수 있습니다.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 sm:pt-4">
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center gap-2 sm:gap-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      <span>지금 시작하기</span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

    
        <section {...sectionProps(2, "bg-white")}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-cyan-100 text-cyan-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm mb-4 sm:mb-6">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                초고속 검증
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                <span className="text-cyan-500">
                  1초 만에 끝나는
                </span>
                <br />
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">신뢰 검증</span>
            </h2>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
                링크 하나로 즉시 디지털 수료증 검증
                <span className=""> 블록체인 기반 데이터로 위조를 방지하고 불필요한 확인 절차를 없앱니다.</span>
              </p>
            </div>

         
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              
            
              <div className="group relative bg-white/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-lg"></div>
                </div>
                
                <div className="text-center pt-3 sm:pt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">디지털 수료증 발급</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    블록체인 기반 검증 가능한 수료증을 안전하고 신속하게 발급받을 수 있습니다.
                  </p>
                </div>
              </div>

            
              <div className="group relative bg-white/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full"></div>
                </div>
                
                <div className="text-center pt-3 sm:pt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">링크 공유</h3>
                  <p className="text-sm sm:text-base  leading-relaxed">
                    간단한 링크 하나로 디지털 수료증명을 안전하게 공유하고 검증할 수 있습니다.
                  </p>
                </div>
              </div>

            
              <div className="group relative bg-white/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-sm"></div>
                </div>
                
                <div className="text-center pt-3 sm:pt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">블록체인 보안</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    블록체인 기반 암호화로 위조와 변조를 완전히 차단하여 신뢰성을 보장합니다.
                  </p>
                </div>
              </div>
            </div>

          
            <div className="text-center mt-12 sm:mt-16">
              <div className="inline-flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 sm:gap-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <span>무료로 시작하기</span>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                  </div>
                </button>
                
                <a 
                  href="https://vc.sealiumback.store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 sm:gap-3 bg-white hover:bg-gray-50 text-cyan-600 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm sm:text-base border-2 border-cyan-500"
                >
                  <span>수료증 검증하기</span>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full"></div>
                  </div>
                </a>
                
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}