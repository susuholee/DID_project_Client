// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import useUserStore from "@/Store/userStore";

// export default function KakaoCallbackPage() {
//   const router = useRouter();
//   const { setUser, setIsLoggedIn } = useUserStore();

//   useEffect(() => {
//     const checkAuth = async () => {
//    try {
//     const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/oauth`, { 
//     withCredentials: true 
//   });
  
//   console.log("사용자 정보:", res.data);
  
//   // 사용자 정보 추출 및 상태 업데이트
//   const userData = {
//     id: res.data.id,
//     nickname: res.data.properties.nickname,
//     profileImage: res.data.properties.profile_image,
//     thumbnailImage: res.data.properties.thumbnail_image
//   };
  
//   setUser(userData);
//   setIsLoggedIn(true);
  
//   // 토큰 확인 후 무조건 signup/did로 이동
//   router.replace("/signup/did");
  
//   } catch (error) {
//     console.error("API 호출 오류:", error);
//     router.replace("/login?error=auth_failed");
//   }
//     };

//     checkAuth();
//   }, []);

//   return <p>카카오 로그인 처리 중...</p>;
// }