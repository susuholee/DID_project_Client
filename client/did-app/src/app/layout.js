'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // hydration 문제를 피하려면 useState로 인스턴스를 생성해야 함
  const [queryClient] = useState(() => new QueryClient());

  const noLayoutRoutes = ['/signup', '/profile', '/signup/did'];
  const hideLayout = noLayoutRoutes.includes(pathname);

  return (
    <html lang="ko">
      <body>
        <QueryClientProvider client={queryClient}>
          {hideLayout ? (
            <>{children}</>
          ) : (
            <div className="flex min-h-screen">
              <div className="flex flex-col flex-1">
                <Header />
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
