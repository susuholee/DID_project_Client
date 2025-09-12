// 'use client';
// import Image from 'next/image';
// import { useEffect, useRef, useState } from 'react';
// import useUserStore from '@/Store/userStore';

// export default function NotificationBell() {
//   const btnRef = useRef(null);
//   const popRef = useRef(null);
//   const [open, setOpen] = useState(false);

//   const { notifications, setNotifications } = useUserStore();
  
//   // 안전한 배열 처리 - persist 복원 과정에서 null이 될 수 있음
//   const safeNotifications = Array.isArray(notifications) ? notifications : [];
//   const unread = safeNotifications.filter((n) => n && !n.read).length;

//   useEffect(() => {
//     const onDown = (e) => {
//       if (!open) return;
//       const withinBtn = btnRef.current && btnRef.current.contains(e.target);
//       const withinPop = popRef.current && popRef.current.contains(e.target);
//       if (!withinBtn && !withinPop) setOpen(false);
//     };
//     window.addEventListener('mousedown', onDown);
//     return () => window.removeEventListener('mousedown', onDown);
//   }, [open]);

//   const markAllRead = () => {
//     setNotifications((prev) => {
//       const safePrev = Array.isArray(prev) ? prev : [];
//       return safePrev.map((n) => ({ ...n, read: true }));
//     });
//   };

//   const clearAll = () => setNotifications([]);

//   const toggleOneRead = (id) =>
//     setNotifications((prev) => {
//       const safePrev = Array.isArray(prev) ? prev : [];
//       return safePrev.map((n) => (n.id === id ? { ...n, read: true } : n));
//     });

//   return (
//     <div className="relative">
//       <button
//         ref={btnRef}
//         onClick={() => setOpen((v) => !v)}
//         className="w-10 h-10 lg:w-9 lg:h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 relative transition-colors duration-200"
//         aria-label="알림"
//       >
//         <Image src="/icons/bell.png" width={20} height={20} alt="알림" className="w-5 h-5 lg:w-4 lg:h-4" />
//         {unread > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] lg:text-[10px] min-w-[20px] lg:min-w-[18px] h-[20px] lg:h-[18px] px-1 flex items-center justify-center rounded-full font-semibold">
//             {unread > 9 ? '9+' : unread}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div
//           ref={popRef}
//           className="absolute right-0 mt-2 w-[320px] lg:w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
//         >
//           <div className="flex items-center justify-between px-4 py-3 lg:px-3 lg:py-2 border-b">
//             <span className="text-base lg:text-sm font-semibold">알림</span>
//             <div className="flex items-center gap-3 lg:gap-2">
//               {safeNotifications.length > 0 && (
//                 <button
//                   onClick={markAllRead}
//                   className="text-sm lg:text-xs text-gray-600 hover:text-gray-900 active:text-gray-700 px-2 py-1 rounded transition-colors"
//                 >
//                   모두 읽음
//                 </button>
//               )}
//               {safeNotifications.length > 0 && (
//                 <button
//                   onClick={clearAll}
//                   className="text-sm lg:text-xs text-red-500 hover:text-red-600 active:text-red-700 px-2 py-1 rounded transition-colors"
//                 >
//                   전체 삭제
//                 </button>
//               )}
//             </div>
//           </div>

//           {safeNotifications.length === 0 ? (
//             <div className="p-6 lg:p-4 text-base lg:text-sm text-gray-500 text-center">새 알림이 없습니다.</div>
//           ) : (
//             <ul className="max-h-[50vh] lg:max-h-[60vh] overflow-auto divide-y">
//               {safeNotifications.map((n) => (
//                 <li
//                   key={n.id}
//                   className={`p-4 lg:p-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors ${
//                     !n.read ? 'bg-amber-50' : ''
//                   }`}
//                   onClick={() => toggleOneRead(n.id)}
//                 >
//                   <div className="min-w-0">
//                     <p className="text-base lg:text-sm font-medium text-gray-900 truncate">
//                       {n.title}
//                     </p>
//                     <p className="text-sm lg:text-sm text-gray-700 mt-1 lg:mt-0.5 break-words leading-relaxed">
//                       {n.message}
//                     </p>
//                     <p className="text-xs lg:text-[11px] text-gray-500 mt-2 lg:mt-1">
//                       {formatRelativeTime(n.ts)}
//                     </p>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// function formatRelativeTime(ts) {
//   const diff = Date.now() - ts;
//   const sec = Math.floor(diff / 1000);
//   if (sec < 60) return `${sec}초 전`;
//   const min = Math.floor(sec / 60);
//   if (min < 60) return `${min}분 전`;
//   const hr = Math.floor(min / 60);
//   if (hr < 24) return `${hr}시간 전`;
//   const d = Math.floor(hr / 24);
//   return `${d}일 전`;
// }