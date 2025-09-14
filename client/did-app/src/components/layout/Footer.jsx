'use client';

import React, { useState, useEffect } from "react";

const Footer = () => {
  const [mounted, setMounted] = useState(false);
 

  // 서버 사이드 렌더링 중에는 기본값 사용
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <img src="/icons/sealium_logo.png" alt="Sealium" className="w-7 h-7" />
            <span className="font-semibold">Sealium</span>
          </div>
          <p className="mt-3 text-sm">
            경일IT게임아카데미
          </p>
        </div>
        <div className="flex md:justify-end items-center gap-6 text-sm">
          <a href="#" className="hover:text-white transition-colors">이용약관</a>
          <a href="#" className="hover:text-white transition-colors">개인정보 처리방침</a>
          <a href="#" className="hover:text-white transition-colors">고객센터</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;