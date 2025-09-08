'use client';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import ClientNav from '@/components/layout/ClientNav';
import useUserStore from '@/Store/userStore';

export default function RootLayout({ children }) {
  const pathname = usePathname();

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
