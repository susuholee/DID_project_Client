"use client";

import React, { useEffect, useRef } from "react";
import LoginForm from "@/components/auth/LoginForm";
import useUserStore from "@/Store/userStore";

export default function MainPage() {
  const sectionsRef = useRef([]);
  const user = useUserStore((state) => state.user);
  console.log("누구야",user)
  const isLoggedIn = !!user;

  // 섹션 스크롤 애니메이션
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
    <div className="min-h-screen bg-neutral-100 text-gray-900 flex flex-col animate-none">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          {...sectionProps(0)}
          className="relative w-full h-screen flex items-center justify-center section-hidden overflow-hidden"
        >
          <div
            className="absolute inset-0 z-0 bg-black/50"
            style={{
              backgroundImage: "url('/images/sealiumbg.gif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.8)",
              transform: "scale(1.1)",
            }}
          />
          <div className="relative z-5 w-full h-full p-4 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-20 items-center justify-center text-white">
            <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none">
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 lg:mb-4 drop-shadow-lg text-white/90">
                당신의 신뢰를 봉인하는
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight text-rose-500 mb-4 lg:mb-5 drop-shadow-lg">
                Sealium
              </h1>
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow-lg text-gray-200">
                수료증 발급, 검증, 공유를 모두 하나의 DID 지갑에서 안전하게.
                블록체인 기반으로 신뢰성을 보장합니다.
              </p>
            </div>
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl animate-none">
              {!isLoggedIn && <LoginForm />}
            </div>
          </div>
        </section>

        {/* 수료증 발급 자동화 */}
        <section {...sectionProps(1, "bg-gray-50")}>
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* 수료증 이미지 */}
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-md lg:max-w-lg">
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <img 
                      src="/images/preview_vc.jpg" 
                      alt="Sealium 수료증 샘플" 
                      className="w-full h-auto rounded-lg shadow-2xl border border-gray-200"
                    />
                  </div>
                </div>
              </div>
              
              {/* 설명 텍스트 */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 text-rose-500">
                  수료증 발급 · 관리 자동화
                </h2>
                <div className="space-y-4">
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-800">DID 인증 기반 시스템</span>으로 과정 종료 시 자동으로 수료증이 발급됩니다.
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    관리자는 <span className="text-rose-500 font-medium">운영 부담을 줄이고</span>, 학습자는 <span className="text-rose-500 font-medium">즉시 성과를 확인</span>할 수 있습니다.
                  </p>
                  <div className="pt-4">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 초고속 검증 */}
        <section {...sectionProps(2, "bg-white")}>
          <div className="mx-auto max-w-4xl lg:max-w-6xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 text-rose-500">
              1초 만에 끝나는 신뢰 검증
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto lg:mx-0">
              QR 코드 또는 링크 하나면 즉시 검증.
              DID 기반 데이터로 위조를 방지하고 불필요한 확인 절차를 없앱니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}