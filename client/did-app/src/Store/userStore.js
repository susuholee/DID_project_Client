// store/userStore.js
import { create } from "zustand";
import api from "../lib/axios";


const useUserStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isInitialized: false,
  loginType: null, // 'normal' | 'kakao'

  setUser: (user, type = "normal") =>
    set({
      user,
      isLoggedIn: !!user,
      loginType: type,
    }),


    
initializeUser: async () => {
  const { isInitialized } = get();
  if (isInitialized) return;

  try {
    const res = await api.get("/user/oauth", { withCredentials: true });

    let loginType = "normal";
    let userId = null;
    let userData = null;

    // 1. 카카오 로그인
    if (res.data?.id && res.data?.properties) {
      loginType = "kakao";
      userId = res.data.id;

      const userRes = await api.get(`/user/${userId}`, { withCredentials: true });
      userData = Array.isArray(userRes.data.data)
        ? userRes.data.data[0]
        : userRes.data.data;
    } 
    // 2. 일반 로그인
    else if (res.data?.state === 200 && res.data?.data) {
      loginType = "normal";
      userData = Array.isArray(res.data.data)
        ? res.data.data[0]
        : res.data.data;
    }

    // 3. 상태 저장
    if (userData) {
      set({
        user: { ...userData, type: loginType },
        isLoggedIn: true,
        isInitialized: true,
        loginType,
      });
    } else {
      set({
        user: null,
        isLoggedIn: false,
        isInitialized: true,
        loginType: null,
      });
    }
  } catch (err) {
    console.log("사용자 인증 실패:", err);
    set({
      user: null,
      isLoggedIn: false,
      isInitialized: true,
      loginType: null,
    });
  }
},

  logout: async () => {
    const { loginType } = get();
    try {
      if (loginType === "kakao") {
        await api.get("/kakao/logout", {withCredentials : true})
      } else {
        await api.get("/user/logout", { withCredentials: true });
      }
      console.log("로그아웃 응답")
    } catch (err) {
      console.log("서버 로그아웃 실패:", err);
    }

    set({
      user: null,
      isLoggedIn: false,
      isInitialized: true,
      loginType: null,
    });
  },
}));

export default useUserStore;
