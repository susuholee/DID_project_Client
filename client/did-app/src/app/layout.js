'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ClientNav from '@/components/layout/ClientNav';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); 
  
  
const { isInitialized, isLoggedIn, user } = useAuth();


useEffect(() => {
  if (!isInitialized) {
    console.log("앱 시작: 사용자 상태 확인 중...");
  }
}, [isInitialized]);
  

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (pathname === "/signup/did") {
      router.push("/signup/did");
    }
  }, [pathname]);

  const [queryClient] = useState(() => new QueryClient());


  const noLayoutRoutes = ['/signup/', '/signup/did/', "/"];
  const hideLayout = noLayoutRoutes.includes(pathname);


  const hideClientNavRoutes = ['/profile/edit/'];
  const hideClientNav = hideClientNavRoutes.includes(pathname);


  if (!isMounted) {
    return (
      <html lang="ko">
        <body>
          <QueryClientProvider client={queryClient}>
            {hideLayout ? (
              <>{children}</>
            ) : (
              <div className="flex min-h-screen">
                {!hideClientNav && <ClientNav />}
                <div className="flex flex-col flex-1">
                  <Sidebar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </div>
            )}
          </QueryClientProvider>
        </body>
      </html>
    );
  }


  return (
    <html lang="ko">
      <body>
        <QueryClientProvider client={queryClient}>
          {hideLayout ? (
            <>{children}</>
          ) : (
            <div className="flex min-h-screen">
              {!hideClientNav && <ClientNav />}
              <div className="flex flex-col flex-1">
                <Sidebar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </div>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}