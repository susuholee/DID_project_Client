import { create } from "zustand";
import api from "../lib/axios";


const useUserStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isInitialized: false,
  loginType: null,

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

  
    if (res.data?.id && res.data?.properties) {
      loginType = "kakao";
      userId = res.data.id;

      const userRes = await api.get(`/user/${userId}`, { withCredentials: true });
      userData = Array.isArray(userRes.data.data)
        ? userRes.data.data[0]
        : userRes.data.data;
    } 
    
    else if (res.data?.state === 200 && res.data?.data) {
      loginType = "normal";
      userData = Array.isArray(res.data.data)
        ? res.data.data[0]
        : res.data.data;
    }

 
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
    } catch (err) {
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
