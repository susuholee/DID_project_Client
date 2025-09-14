'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import ClientNav from '@/components/layout/ClientNav';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { io } from "socket.io-client";
import { useWebSocket } from '@/Store/socketStore';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); 
  const {setSocket} = useWebSocket();
  
  
const { isInitialized, isLoggedIn, user } = useAuth();
// console.log("무슨 상태야",isInitialized)

useEffect(() => {
  // connect to backend WebSocket
  const socket = io('http://localhost:4000', {
    transports: ["websocket"], // force pure WebSocket, skip long polling
  });
  console.log('socketconnect', socket)
  setSocket(socket)

  // when connected
  socket.on("connect", () => {
    console.log("Connected with id:", socket.id);
  });

  // listen for notifications
  socket.on("receiveNotification", (data) => {
    console.log("🔔 Notification:", data);
  });

  // listen for messages
  socket.on("receiveMessage", (data) => {
    console.log("💬 Message:", data);
  });

  // cleanup on component unmount
  return () => {
    socket.disconnect();
  };
}, []);


useEffect(() => {
  if (!isInitialized) {
    console.log("앱 시작: 사용자 상태 확인 중...");
  }
}, [isInitialized]);
  
  // 클라이언트에서만 렌더링되도록 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (pathname === "/signup/did") {
      router.push("/signup/did");
    }
  }, [pathname]);

  const [queryClient] = useState(() => new QueryClient());

  // 전체 레이아웃을 숨길 경로
  const noLayoutRoutes = ['/signup/', '/signup/did/', "/"];
  const hideLayout = noLayoutRoutes.includes(pathname);

  // ClientNav만 숨길 경로
  const hideClientNavRoutes = ['/profile/edit/'];
  const hideClientNav = hideClientNavRoutes.includes(pathname);

  // 서버 렌더링 시에는 기본 레이아웃 반환
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

  // // 클라이언트에서 초기화가 완료되지 않았으면 로딩 표시
  // if (!isInitialized) {
  //   return (
  //     <html lang="ko">
  //       <body>
  //         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
  //           <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center space-y-4">
  //             <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
  //             <div className="text-center">
  //               <p className="text-lg font-medium text-gray-800">사용자 정보를 가져오는 중...</p>
  //               <p className="text-sm text-gray-500 mt-1">잠시만 기다려주세요</p>
  //             </div>
  //           </div>
  //         </div>
  //       </body>
  //     </html>
  //   );
  // }

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