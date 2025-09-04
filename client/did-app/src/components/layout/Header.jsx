'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useRef, useEffect } from 'react';
import useUserStore from '@/Store/userStore';
import NotificationBell from '@/components/UI/NotificationBell';

export default function Header() {
  const pathname = usePathname();
  const { user, userType, isLoggedIn, logout } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const closeTimerRef = useRef(null);
  const menuWrapperRef = useRef(null);

  // hydration 완료 체크
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAppRoute = useMemo(
    () =>
      pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/certificates') ||
      pathname?.startsWith('/requests') ||
      pathname?.startsWith('/profile'),
    [pathname]
  );

  // 로그인 타입에 따른 사용자 이름 표시
  const displayName = useMemo(() => {
    if (!user) return '사용자';
    
    // 카카오 로그인 사용자 (store 구조에 맞게 수정)
    if (userType === 'kakao') {
      return user.nickName || user.kakaoData?.nickname || '카카오 사용자';
    }
    
    // 일반 로그인 사용자
    return user.nickName || user.userName || '사용자';
  }, [user, userType]);

  // 로그인 타입에 따른 프로필 이미지
  const profileImage = useMemo(() => {
    if (!user) return '/images/default.png';
    
    // 카카오 로그인 사용자 (store 구조에 맞게 수정)
    if (userType === 'kakao') {
      return user.imgPath || user.kakaoData?.profile_image || '/images/default.png';
    }
    
    // 일반 로그인 사용자
    return user.imgPath || '/images/default.png';
  }, [user, userType]);

  // 로그아웃
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // 메뉴 열고 닫기
  const scheduleClose = () =>
    (closeTimerRef.current = setTimeout(() => setMenuOpen(false), 120));
  const cancelClose = () =>
    closeTimerRef.current && clearTimeout(closeTimerRef.current);
  const handleBlur = (e) => {
    if (!menuWrapperRef.current?.contains(e.relatedTarget)) setMenuOpen(false);
  };

  // 스크롤 이벤트 (랜딩 페이지 헤더)
  useEffect(() => {
    if (!isAppRoute) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const heroSectionHeight = window.innerHeight * 0.9;
        setIsScrolled(scrollPosition > heroSectionHeight);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isAppRoute]);

  const baseBtn = 'hover:text-rose-500 shrink-0 pb-1 transition-colors';
  const activeBtn = 'font-medium text-rose-500 border-b-2 border-rose-500';

  return (
    <header
      className={`flex flex-wrap justify-between items-center px-4 sm:px-6 py-3 gap-3
        ${
          isAppRoute
            ? 'bg-white shadow'
            : `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white shadow-md' : 'bg-transparent text-rose-500'
              }`
        }
      `}
    >
      {/* 로고 + 메뉴 */}
      <div className="flex items-center gap-4 sm:gap-8 min-w-0">
        <Link href="/" className="shrink-0 text-lg font-bold text-rose-500">
          Sealium
        </Link>

        {isAppRoute ? (
          <nav className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-700 overflow-x-auto">
            {[
              { href: '/dashboard', label: '대시보드' },
              { href: '/certificates/my', label: '내 수료증' },
              { href: '/certificates/request', label: '요청 현황' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`${baseBtn} ${
                    pathname === item.href ||
                    pathname?.startsWith(item.href + '/')
                      ? activeBtn
                      : ''
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>
        ) : (
          <nav
            className={`hidden md:flex gap-6 text-sm ${
              isScrolled ? 'text-black' : 'text-gray-200'
            }`}
          >
            <Link href="#about" className="hover:text-rose-500">
              서비스 소개
            </Link>
            <Link href="#how" className="hover:text-rose-500">
              사용 방법
            </Link>
            <Link href="#contact" className="hover:text-rose-500">
              문의
            </Link>
          </nav>
        )}
      </div>

      {/* 오른쪽 영역 */}
      <div className="flex items-center gap-4">
        {isHydrated && (
          <>
            {/* 알림 벨 - 로그인된 사용자만 표시 */}
            {isLoggedIn && <NotificationBell />}

            {isLoggedIn && isAppRoute ? (
              // 앱 내부: 드롭다운 메뉴
              <div
                ref={menuWrapperRef}
                className="relative"
                tabIndex={0}
                onMouseEnter={() => {
                  cancelClose();
                  setMenuOpen(true);
                }}
                onMouseLeave={scheduleClose}
                onFocus={() => setMenuOpen(true)}
                onBlur={handleBlur}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 focus:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-700 font-medium max-w-[10rem] truncate">
                    {displayName}
                    {/* 개발 중 확인용 - 로그인 타입 표시 */}
                    {userType && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({userType === 'kakao' ? '카카오' : '일반'})
                      </span>
                    )}
                  </span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg ring-1 ring-gray-200 z-10 overflow-hidden"
                  >
                    <Link href="/profile">
                      <button className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                        내정보
                      </button>
                    </Link>
                    <button
                      role="menuitem"
                      tabIndex={0}
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : isLoggedIn ? (
              // 랜딩 페이지에서 로그인된 경우 - 프로필 정보만 표시 (클릭 불가)
              <div className={`flex items-center gap-2 ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}>
                <img
                  src={profileImage}
                  alt="프로필"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
                <span className="hidden sm:block text-sm font-medium max-w-[8rem] lg:max-w-[10rem] truncate">
                  {displayName}
                </span>
              </div>
            ) : (
              // 로그인하지 않은 경우: 빈 공간
              <div className="flex items-center gap-2"></div>
            )}
          </>
        )}
      </div>
    </header>
  );
}