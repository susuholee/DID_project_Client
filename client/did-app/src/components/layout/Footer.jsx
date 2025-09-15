'use client';

import React, { useState, useEffect } from "react";

const Footer = () => {
  const [mounted, setMounted] = useState(false);
 

  return (
    <footer className="bg-gradient-to-r from-cyan-900 via-cyan-800 to-cyan-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1">
          <div className="flex justify-center gap-2">
            <img 
              src="/icons/sealium_logo.png" 
              alt="Sealium" 
              className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 drop-shadow-lg" 
            />
            <span className="text-lg sm:text-xl text-cyan-100">Sealium</span>
          </div>
        </div>
        <div className="flex flex-wrap md:justify-end items-center gap-4 md:gap-6 text-sm">
          <a href="#" className="hover:text-cyan-300 transition-colors text-cyan-100">이용약관</a>
          <a href="#" className="hover:text-cyan-300 transition-colors text-cyan-100">개인정보 처리방침</a>
          <a href="#" className="hover:text-cyan-300 transition-colors text-cyan-100">고객센터</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;