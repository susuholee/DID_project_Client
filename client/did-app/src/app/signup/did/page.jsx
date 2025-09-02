"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import useUserStore from "@/Store/userStore";

export default function DIDSignupPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const detailRef = useRef(null);

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.hasDID) {
      router.replace("/dashboard");
      return;
    }

    if (user.name) setName(user.name);
    if (user.address) setAddress(user.address);
    if (user.birth) setBirth(user.birth);
  }, [user, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = {
      ...user,
      name,
      birth,
      address: `${address} ${detail}`.trim(),
      hasDID: true,
    };

    // 전역 상태 업데이트
    setUser(updatedUser);

    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">DID 정보 입력</h1>

        {user && (
          <div className="mb-5 flex items-center gap-3">
            {user.profile ? (
              <img
                src={user.profile}
                alt="프로필"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                {(user.nickname ?? user.name ?? "유")[0]}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">연동된 소셜 정보</p>
              <p className="text-sm font-medium text-gray-900">
                {user.nickname ?? user.name ?? "사용자"}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름(실명)"
            required
          />
          <Input
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Input value={address} placeholder="주소" readOnly required />
            <Button type="button" onClick={() => {}}>주소 검색</Button>
          </div>
          <Input
            ref={detailRef}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세주소"
          />

          <Button
            type="submit"
            className="w-full bg-rose-400 text-black py-3 rounded cursor-pointer"
          >
            DID 생성
          </Button>
        </form>
      </div>
    </main>
  );
}
