'use client';

import React, { useState, useEffect } from "react";

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  // 서버 사이드 렌더링 중에는 기본값 사용
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-cyan-600" />
            <span className="font-semibold">Sealium</span>
          </div>
          <p className="mt-3 text-sm">
            @ {currentYear} 경일IT게임 아카데미
          </p>
        </div>
        <div className="flex md:justify-end items-center gap-6 text-sm">
          <a href="#" className="hover:text-white">이용약관</a>
          <a href="#" className="hover:text-white">개인정보 처리방침</a>
          <a href="#" className="hover:text-white">고객센터</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;