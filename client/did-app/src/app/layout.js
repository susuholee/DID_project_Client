'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ClientNav from '@/components/layout/ClientNav';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
    const router = useRouter();
  
    useEffect(() => {
      const signupDIDpage = "/signup/did";
      // console.log(pathname === signupDIDpage, "dsadasd", pathname, signupDIDpage)
      if (pathname === "/signup/did") {
        console.log()
        router.push("/signup/did");
      }
    }, [pathname, router]);


  const [queryClient] = useState(() => new QueryClient());

  const noLayoutRoutes = ['/signup', '/profile', '/signup/did', '/'];
  const hideLayout = noLayoutRoutes.includes(pathname);

  return (
    <html lang="ko">
      <body>
        <QueryClientProvider client={queryClient}>
            {hideLayout ? (
              <>{children}</>
            ) : (
              <div className="flex min-h-screen">
                <ClientNav />
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