"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export function HeroGuestCta() {
  const pathname = usePathname();
  const showToast = useToast();

  async function handleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}`,
      },
    });
    if (error) showToast("로그인 실패: " + error.message);
  }

  return (
    <button className="hero-guest-cta" onClick={handleLogin}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#191600">
        <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.83 5.18 4.6 6.58-.2.75-.73 2.7-.84 3.12-.13.52.19.51.4.37.17-.11 2.65-1.8 3.73-2.54.68.1 1.38.15 2.11.15 5.52 0 10-3.48 10-7.68C22 6.48 17.52 3 12 3z" />
      </svg>
      카카오 1초 로그인
    </button>
  );
}
