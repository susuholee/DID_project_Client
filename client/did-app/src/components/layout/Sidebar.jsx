'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useUserStore from '@/Store/userStore';


export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout} = useUserStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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
  if (pathname?.includes('/certificates/detail')) {
    return false;
  }

  if (href === '/profile') {
    return pathname === '/profile';
  }
  return pathname === href || pathname?.startsWith(href + '/');
};



 const handleLogout = async () => {

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
    return null; 
  }

  return (
    <>
      {!pathname?.includes('/certificates/detail') && !isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
          aria-label="메뉴 열기"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1.5">
            <div className="w-5 h-0.5 bg-gray-700 rounded-full"></div>
            <div className="w-5 h-0.5 bg-gray-700 rounded-full"></div>
            <div className="w-5 h-0.5 bg-gray-700 rounded-full"></div>
          </div>
        </button>
      )}

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black opacity-50 z-40"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed
          ${pathname?.includes('/certificates/detail') ? '-translate-x-full' : isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          w-64 lg:w-56 h-screen
          bg-white
          overflow-y-auto flex-shrink-0 
          top-0 left-0 z-40
          shadow-[8px_0_25px_-5px_rgba(0,0,0,0.1),4px_0_15px_-3px_rgba(0,0,0,0.05)]
        `}
      >
       
        <div className="flex items-center h-16 bg-gradient-to-r from-cyan-50 to-white px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src="/icons/sealium_logo.png" alt="Sealium" className="w-12 h-12 flex-shrink-0 drop-shadow-sm" />
            <Link href="/">
              <span className="text-2xl font-bold text-cyan-600 tracking-tight">
                Sealium
              </span>
            </Link>
          </div>
        </div>

      
        <nav className="p-4 pb-20">
          {userMenus.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-3">
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
                           : 'hover:bg-gray-100 hover:shadow-md'
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
