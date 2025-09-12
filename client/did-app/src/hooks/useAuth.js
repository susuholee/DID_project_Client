import { useEffect } from "react";
import useUserStore from "../Store/userStore";

export const useAuth = () => {
  const { initializeUser, isInitialized, isLoggedIn, user, loginType } = useUserStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeUser();
    }
  }, [isInitialized, initializeUser]);

  return { isLoggedIn, user, isInitialized, loginType };
};
