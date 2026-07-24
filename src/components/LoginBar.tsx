"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

type Props = {
  nickname: string | null;
  isAdmin: boolean;
};

export function LoginBar({ nickname, isAdmin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const showToast = useToast();
  const [pending, setPending] = useState(false);

  async function handleLogin() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}`,
      },
    });
    if (error) {
      showToast("로그인 실패: " + error.message);
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    setPending(false);
  }

  // TODO: 임시 테스트용 고객 로그인 - 실제 서비스 오픈 전 제거할 것
  async function handleTestCustomerLogin() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: "testcustomer@example.com",
      password: "test1234!",
    });
    setPending(false);
    if (error) {
      showToast("테스트 로그인 실패: " + error.message);
      return;
    }
    router.refresh();
  }

  if (nickname) {
    return (
      <div className="resv-user-bar">
        <div className="resv-user-name">
          안녕하세요, <em>{isAdmin ? "관리자" : nickname}</em>님
        </div>
        <button className="resv-logout-btn" onClick={handleLogout} disabled={pending}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="kakao-login-btn" onClick={handleLogin} disabled={pending}>
        카카오 1초 로그인
      </button>
      <button
        className="kakao-login-btn"
        style={{ marginTop: 8, background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}
        onClick={handleTestCustomerLogin}
        disabled={pending}
      >
        (임시) 테스트 고객으로 입장
      </button>
    </>
  );
}
