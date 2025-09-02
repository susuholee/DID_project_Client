"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import useUserStore from "@/Store/userStore";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const { setUser, setIsLoggedIn } = useUserStore();

  useEffect(() => {
    const doAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        router.replace("/login?error=missing_code");
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao/callback?code=${code}`,
          { withCredentials: true }
        );

        const { user, isExistingUser } = res.data;

        setUser(user);
        setIsLoggedIn(true);

        if (isExistingUser) {
          router.replace("/dashboard");
        } else {
          router.replace("/did/signup");
        }
      } catch (err) {
        console.error(err);
        router.replace("/");
      }
    };

    doAuth();
  }, [router, setUser, setIsLoggedIn]);

  return <p>카카오 로그인 처리 중...</p>;
}
