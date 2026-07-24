"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Replaces the app.js `onAuthStateChange` orchestrator that manually
 * re-ran ~10 fetch/render functions after every login/logout. Here we
 * just refresh the router so Server Components re-fetch user/role with
 * the new session; each page owns its own data fetching.
 *
 * Only refresh on an actual user-id change (sign-in/out/switch). Refreshing
 * on every event — including TOKEN_REFRESHED, which fires periodically and
 * whenever proxy.ts rewrites the session cookie on a request — created a
 * feedback loop: refresh -> new request -> proxy.ts touches the cookie ->
 * browser client sees a session change -> fires another event -> refresh.
 */
export function AuthListener() {
  const router = useRouter();
  const lastUserId = useRef<string | undefined>(undefined);
  const initialized = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (!initialized.current) {
        initialized.current = true;
        lastUserId.current = userId;
        return;
      }
      if (userId === lastUserId.current) return;
      lastUserId.current = userId;
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
