'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();


  const noLayoutRoutes = [
    '/signup',
    '/profile',
    '/signup/did'
  ];

  const hideLayout = noLayoutRoutes.includes(pathname);

  return (
    <html lang="ko">
      <body>
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
      </body>
    </html>
  );
}
