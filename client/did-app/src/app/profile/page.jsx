"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useModal from "@/hooks/useModal";
import Modal from "@/components/UI/Modal";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { isOpen, message, openModal, closeModal } = useModal();
  const [user, setUser] = useState(null);

  // 프로필, 주소, 생년월일
  const [profilePreview, setProfilePreview] = useState("/images/default-avatar.png");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [birthday, setBirthday] = useState("");
  const detailRef = useRef(null);

  // 비밀번호 변경 관련
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // 회원탈퇴 관련
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 에러 메시지
  const [pwError, setPwError] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [nameError, setNameError] = useState("");

  // 비밀번호 유효성
  const pwValid = useMemo(() => {
    if (!newPassword) return true;
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':",.<>/?]).{8,}$/;
    return regex.test(newPassword);
  }, [newPassword]);

  // 사용자 이름 가져오기 (카카오: name, 일반: userName)
  const getUserName = (userObj) => {
    return userObj?.isKakaoUser ? userObj.name : userObj.userName;
  };

  // 닉네임 유효성 검사
  const validateName = (name) => {
    const trimmedName = name.trim();
    
    // 빈 문자열 체크
    if (!trimmedName) {
      return "닉네임을 입력해주세요.";
    }
    
    // 앞뒤 공백이 있는 경우
    if (name !== trimmedName) {
      return "닉네임 앞뒤 공백을 제거해주세요.";
    }
    
    // 길이 체크 (2-10자)
    if (trimmedName.length < 2 || trimmedName.length > 10) {
      return "닉네임은 2-10자 사이여야 합니다.";
    }
    
    // 한글, 영문, 숫자만 허용 (특수문자 제외)
    const regex = /^[가-힣a-zA-Z0-9]+$/;
    if (!regex.test(trimmedName)) {
      return "닉네임은 한글, 영문, 숫자만 사용 가능합니다.";
    }
    
    return "";
  };

  useEffect(() => {
    const scriptId = "daum-postcode-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.async = true;
      document.body.appendChild(s);
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
      router.push("/");
      return;
    }

    setUser(currentUser);
    setAddress(currentUser.address || "");
    setAddressDetail(currentUser.addressDetail || "");
    setProfilePreview(currentUser.profile || "/images/default-avatar.png");
    setBirthday(currentUser.birthday || "");
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 닉네임 변경 시 유효성 검사 (카카오는 name, 일반은 userName)
    if (name === 'name' || name === 'userName') {
      const error = validateName(value);
      setNameError(error);
    }
    
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpload = (e) => {
    // 카카오 계정은 프로필 사진 변경 불가
    if (user?.isKakaoUser) {
      openModal("카카오 계정은 프로필 사진을 변경할 수 없습니다.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      openModal("JPG, PNG, WEBP 형식의 이미지를 선택해 주세요.");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      openModal("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePreview(reader.result);
      setUser((prev) => ({ ...prev, profile: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) {
      openModal("주소 검색 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const base = data.roadAddress || data.jibunAddress;
        setAddress(base);
        setTimeout(() => detailRef.current?.focus(), 0);
      },
    }).open();
  };

  const handleSave = () => {
    if (!user) return;

    // 현재 사용자 이름 가져오기
    const currentName = getUserName(user);
    
    // 닉네임 유효성 검사
    const nameValidationError = validateName(currentName || "");
    if (nameValidationError) {
      setNameError(nameValidationError);
      openModal(nameValidationError);
      return;
    }
    setNameError("");

    const wantsPwChange = currentPassword || newPassword || newPasswordConfirm;

    // 일반 회원만 비밀번호 변경 로직 적용
    if (!user.isKakaoUser && wantsPwChange) {
      if (currentPassword !== user.password) {
        setPwError("현재 비밀번호가 올바르지 않습니다.");
        return;
      }
      if (!pwValid) {
        setPwError("새 비밀번호는 8자 이상이며, 문자/숫자/특수문자를 포함해야 합니다.");
        return;
      }
      if (newPassword === currentPassword) {
        setPwError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setPwError("새 비밀번호가 일치하지 않습니다.");
        return;
      }
    }
    setPwError("");

    // 카카오/일반 계정에 따라 다른 필드 업데이트
    const updatedUser = {
      ...user,
      ...(user.isKakaoUser 
        ? { name: (user.name || "").trim() } // 카카오는 name 필드
        : { userName: (user.userName || "").trim() } // 일반은 userName 필드
      ),
      password: !user.isKakaoUser
        ? wantsPwChange
          ? newPassword
          : user.password
        : user.password,
      address,
      addressDetail: addressDetail.trim(),
      profile: profilePreview,
      birthday,
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem("users", JSON.stringify(users));
    }

    openModal("프로필이 수정되었습니다.");
  };

  // 회원탈퇴 모달 열기
  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
    setWithdrawPassword("");
    setWithdrawError("");
  };

  // 회원탈퇴 모달 닫기
  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawPassword("");
    setWithdrawError("");
  };

  // 회원탈퇴 처리
  const handleWithdraw = async () => {
    if (!user) return;

    // 일반 회원은 비밀번호 확인 필요
    if (!user.isKakaoUser && !withdrawPassword.trim()) {
      setWithdrawError("비밀번호를 입력해주세요.");
      return;
    }

    if (!user.isKakaoUser && withdrawPassword !== user.password) {
      setWithdrawError("비밀번호가 올바르지 않습니다.");
      return;
    }

    setWithdrawError("");
    setIsWithdrawing(true);

    try {
      // 탈퇴 처리 시뮬레이션 (실제로는 서버 API 호출)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. 사용자 데이터 삭제
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.filter(u => u.id !== user.id);
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // 2. 현재 사용자 세션 삭제
      localStorage.removeItem("currentUser");

      // 3. 관련 데이터 삭제
      localStorage.removeItem(`certificate_requests`);
      localStorage.removeItem(`revokeRequests`);
      localStorage.removeItem(`notifications`);

      // 4. 홈으로 리다이렉트
      closeWithdrawModal();
      openModal("회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      
      // 모달 닫힌 후 홈으로 이동
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (error) {
      setWithdrawError("탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleModalClose = () => {
    closeModal();
    if (message === "프로필이 수정되었습니다.") {
      router.push("/dashboard");
    }
  };

  if (!user) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">
        <Link href="/dashboard">
          <h2 className="text-2xl font-semibold mb-6 cursor-pointer hover:text-blue-600">← 이전</h2>
        </Link>

        {/* 카카오 계정 안내 메시지 */}
        {user?.isKakaoUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
             카카오 계정은 프로필 사진과 비밀번호 변경이 제한됩니다
            </p>
          </div>
        )}

        {/* 프로필 이미지 업로드 */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <img
            src={profilePreview}
            alt="프로필"
            className="w-24 h-24 rounded-full object-cover border border-gray-200"
          />
          <div className="flex flex-col items-center sm:items-start gap-2">
            {!user?.isKakaoUser && (
              <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg border hover:bg-gray-200 text-sm font-medium">
                프로필 사진 변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                />
              </label>
            )}
            {user?.isKakaoUser && (
              <div className="bg-gray-100 px-4 py-2 rounded-lg border text-sm font-medium text-gray-500 cursor-not-allowed">
                프로필 사진 변경 불가
              </div>
            )}
            <p className="text-xs text-gray-500">
              {user?.isKakaoUser 
                ? "카카오 계정은 프로필 사진 변경이 제한됩니다" 
                : "JPG, PNG, WEBP 파일 권장 • 2MB 이하"
              }
            </p>
          </div>
        </div>

        {/* 닉네임 - 카카오는 name, 일반은 userName */}
        <label className="block text-sm font-medium mb-1">닉네임</label>
        <input
          type="text"
          name={user.isKakaoUser ? "name" : "userName"}
          value={getUserName(user) || ""}
          onChange={handleChange}
          className={`border rounded px-3 py-2 w-full mb-1 ${
            nameError ? 'border-red-400' : ''
          }`}
          placeholder="2-10자 이내 (한글, 영문, 숫자)"
        />
        {nameError && <p className="text-red-600 text-xs mb-4">{nameError}</p>}
        {!nameError && <div className="mb-4"></div>}

        {/* 생년월일 */}
        <label className="block text-sm font-medium mb-1">생년월일</label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-4"
        />

        {/* 비밀번호 변경 - 일반 회원만 */}
        {!user.isKakaoUser && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">비밀번호 변경</p>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
              className={`border rounded px-3 py-2 w-full mb-2 ${
                pwError.includes("현재 비밀번호") ? "border-red-400" : ""
              }`}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (문자/숫자/특수문자 포함 8자+)"
              className={`border rounded px-3 py-2 w-full mb-2 ${
                newPassword && !pwValid ? "border-red-400" : ""
              }`}
            />
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호 확인"
              className={`border rounded px-3 py-2 w-full ${
                pwError.includes("일치하지 않습니다") ? "border-red-400" : ""
              }`}
            />
            {pwError && <p className="mt-2 text-xs text-red-600">{pwError}</p>}
          </div>
        )}

        {/* 주소 */}
        <label className="block text-sm font-medium mb-1">주소</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={address}
            readOnly
            className="border rounded px-3 py-2 flex-1 bg-gray-100"
          />
          <button
            type="button"
            onClick={openPostcode}
            className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-900"
          >
            검색
          </button>
        </div>
        <input
          type="text"
          ref={detailRef}
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
          placeholder="상세 주소"
          className="border rounded px-3 py-2 w-full mb-4"
        />

        {/* DID */}
        <label className="block text-sm font-medium mb-1">DID</label>
        <input
          type="text"
          value={user.did || ""}
          readOnly
          className="border rounded px-3 py-2 w-full mb-4 bg-gray-100"
        />

        {/* 지갑 주소 */}
        <label className="block text-sm font-medium mb-1">지갑 주소</label>
        <input
          type="text"
          value={user.wallet || ""}
          readOnly
          className="border rounded px-3 py-2 w-full mb-6 bg-gray-100"
        />

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 mb-4"
        >
          저장하기
        </button>

        {/* 회원탈퇴 버튼 */}
        <button
          onClick={openWithdrawModal}
          className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          회원탈퇴
        </button>
      </div>

      {/* 기본 모달 */}
      <Modal isOpen={isOpen} message={message} onClose={handleModalClose} />

      {/* 회원탈퇴 모달 */}
      {showWithdrawModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40"
            onClick={closeWithdrawModal}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">회원탈퇴</h3>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">
                    탈퇴 시 모든 수료증 및 요청 내역이 삭제되며, 복구할 수 없습니다.
                  </p>
                </div>

                {/* 일반 회원은 비밀번호 확인 */}
                {!user.isKakaoUser && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">비밀번호 확인</label>
                    <input
                      type="password"
                      value={withdrawPassword}
                      onChange={(e) => setWithdrawPassword(e.target.value)}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                {/* 카카오 사용자 확인 메시지 */}
                {user.isKakaoUser && (
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm text-center">
                      정말로 회원탈퇴를 진행하시겠습니까?
                    </p>
                  </div>
                )}

                {withdrawError && (
                  <p className="text-red-600 text-sm mb-4">{withdrawError}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={closeWithdrawModal}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {isWithdrawing ? (
                      <span className="flex items-center justify-center">
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        처리중...
                      </span>
                    ) : (
                      '탈퇴하기'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}