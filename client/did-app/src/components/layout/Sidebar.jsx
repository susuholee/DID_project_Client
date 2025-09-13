'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useUserStore from '@/Store/userStore';


export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout} = useUserStore();
  // console.log("뭐가 들어있지?",user?.type);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // hydration 완료 체크
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

const isActive = (href) => {
  // 상세 페이지에서는 사이드바를 숨김
  if (pathname?.includes('/certificates/detail')) {
    return false;
  }

  if (href === '/profile') {
    return pathname === '/profile';
  }
  return pathname === href || pathname?.startsWith(href + '/');
};



 const handleLogout = async () => {
  console.log("로그아웃 시작, 타입:", user?.type);

  if (user?.type === "kakao") {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kakao/logout`;
  } else {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/logout`;
  }
};
  const userMenus = [
    {
      title: '대시보드',
      items: [
        { href: '/dashboard', label: '대시보드' }
      ]
    },
    {
      title: '수료증 관리',
      items: [
        { href: '/certificates/my', label: '내 수료증' },
        { href: '/certificates/issue', label: '발급 요청' },
        { href: '/certificates/request', label: '요청 현황' }
      ]
    },
    {
      title: '계정 관리',
      items: [
        { href: '/profile', label: '내 정보' },
        { href: '/profile/edit', label: '정보 수정' }
      ]
    }
  ];

  if (!isHydrated || !user) {
    return null; // 하이드레이션 완료 전이거나 로그인하지 않은 경우 렌더링하지 않음
  }

  return (
    <>
      {/* 모바일 햄버거 메뉴 버튼 */}
      {!pathname?.includes('/certificates/detail') && (
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
          aria-label="메뉴 열기"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
            <div className="w-5 h-0.5 bg-gray-500"></div>
            <div className="w-5 h-0.5 bg-gray-500"></div>
            <div className="w-5 h-0.5 bg-gray-500"></div>
          </div>
        </button>
      )}

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black opacity-50 z-40"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed
          ${pathname?.includes('/certificates/detail') ? '-translate-x-full' : isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          w-80 lg:w-64 h-screen
          bg-white
          overflow-y-auto flex-shrink-0 
          top-0 left-0 z-40
          shadow-[8px_0_25px_-5px_rgba(0,0,0,0.1),4px_0_15px_-3px_rgba(0,0,0,0.05)]
        `}
      >
        {/* 상단 로고 */}
        <div className="flex items-center justify-between h-16 bg-white px-4">
          <div className="flex items-center space-x-3">
            <img src="/icons/sealium_logo.png" alt="Sealium" className="w-10 h-10" />
            <Link href="/">
              <span className="text-2xl font-bold text-cyan-500 tracking-tight">
                Sealium
              </span>
            </Link>
          </div>
          
          {/* 모바일 닫기 버튼 */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="메뉴 닫기"
          >
            <div className="w-6 h-6 relative">
              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
          </button>
        </div>

        {/* 메뉴 네비게이션 */}
        <nav className="p-4 pb-20">
          {userMenus.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={handleMenuClick}>
                                             <div className={`
                         flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200 shadow-sm
                         ${isActive(item.href) 
                           ? 'bg-cyan-500 text-white font-semibold shadow-md transform scale-105' 
                           : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                         }
                       `}>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {isActive(item.href) && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
                {/* 하단 로그아웃 버튼 */}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-white">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-cyan-500 border-0 rounded-xl hover:bg-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <div className="w-4 h-4 mr-2 relative">
              </div>
              로그아웃
            </button>
        </div>
      </aside>
    </>
  );
}
