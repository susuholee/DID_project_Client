import { create } from "zustand";
import axios from "axios";

const useUserStore = create((set) => ({
  user: null,
  userType: null,
  token: null,
  notifications: [],
  isLoggedIn: false,

  // 통합된 setUser 함수 (일반/카카오 로그인 지원)
  setUser: (userData, type = "local") =>
    set(() => {
      console.log('setUser 호출됨:', { userData, type }); // 디버깅 로그 추가
      
      let normalizedData;

      try {
        if (type === "kakao") {
          // 카카오 로그인 데이터 정규화
          normalizedData = {
            id: userData.id,
            userName: `kakao_${userData.id}`,
            userId: `kakao_${userData.id}`,
            nickName: userData.properties?.nickname || "카카오 사용자",
            imgPath: userData.properties?.profile_image || userData.properties?.thumbnail_image,
            type: "kakao",
            kakaoData: userData.properties,
          };
        } else {
          // 일반 로그인 데이터 처리
          // API 응답 형태 확인: {state: 200, data: []} 또는 직접 사용자 객체
          let userInfo;
          
          if (userData.state && userData.data) {
            // API 래핑된 응답: {state: 200, data: [...]}
            userInfo = Array.isArray(userData.data) ? userData.data[0] : userData.data;
          } else {
            // 직접 사용자 객체
            userInfo = userData;
          }
          
          console.log('추출된 사용자 정보:', userInfo); // 디버깅 로그
          
          if (!userInfo) {
            console.error('사용자 정보가 없습니다:', userData);
            return {}; // 상태 변경하지 않음
          }
          
          const { password, ...userWithoutPassword } = userInfo;
          normalizedData = { ...userWithoutPassword, type: "local" };
        }

        console.log('정규화된 데이터:', normalizedData); // 디버깅 로그

        return { 
          user: normalizedData, 
          userType: type,
          isLoggedIn: true
        };
      } catch (error) {
        console.error('setUser 처리 중 오류:', error);
        return {}; // 오류 발생시 상태 변경하지 않음
      }
    }),

  setToken: (tokenValue) =>
    set(() => ({
      token: tokenValue,
    })),

  setIsLoggedIn: (status) =>
    set((state) => {
      // false로 설정할 때는 모든 사용자 정보 초기화
      if (!status) {
        return {
          isLoggedIn: false,
          user: null,
          userType: null,
          token: null,
          notifications: [],
        };
      }
      // true로 설정할 때는 user 정보가 있을 때만 허용
      if (status && !state.user) {
        console.warn('setIsLoggedIn(true) called but no user data exists');
        return state; // 상태 변경하지 않음
      }
      return { isLoggedIn: status };
    }),

  logout: () =>
    set(() => ({
      user: null,
      userType: null,
      token: null,
      notifications: [],
      isLoggedIn: false,
    })),

  addNotification: (userId, newNotification) =>
    set((state) => {
      const updated = [...(state.notifications || []), newNotification];
      return { notifications: updated };
    }),

  setNotifications: (userId, newList) =>
    set(() => {
      return { notifications: newList || [] };
    }),

  updateUser: (updatedData) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedData };
      return { user: updatedUser };
    }),

  // 서버에서 인증 상태 확인하는 함수 추가
  checkAuthStatus: async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/oauth`, {
        withCredentials: true,
      });
      console.log('인증 상태 확인 응답:', response.data);
      
      if (response.data) {
        // 응답 데이터가 있는 경우 (일반 계정 또는 카카오 계정)
        let userData;
        let userType;
        
        if (response.data.id && response.data.properties) {
          // 카카오 계정인 경우
          userData = {
            id: response.data.id,
            userName: `kakao_${response.data.id}`,
            userId: `kakao_${response.data.id}`,
            nickName: response.data.properties?.nickname || "카카오 사용자",
            imgPath: response.data.properties?.profile_image || response.data.properties?.thumbnail_image,
            type: "kakao",
            kakaoData: response.data.properties,
          };
          userType = "kakao";
        } else {
          // 일반 계정인 경우 (서버에서 표준 사용자 정보 반환)
          userData = response.data;
          userType = "user";
        }
        
        set(() => ({
          user: userData,
          userType: userType,
          isLoggedIn: true,
        }));
        return true;
      } else {
        set(() => ({
          user: null,
          userType: null,
          isLoggedIn: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      set(() => ({
        user: null,
        userType: null,
        isLoggedIn: false,
      }));
      return false;
    }
  },
}));

export default useUserStore;