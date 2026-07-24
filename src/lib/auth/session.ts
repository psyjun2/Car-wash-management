import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Re-derives the caller's identity server-side via `auth.getUser()`, which
 * revalidates the JWT against the Auth server — unlike `getSession()`,
 * which only decodes the cookie and can't be trusted as an authorization
 * boundary. Every Server Component / Route Handler that needs to know who
 * is calling should go through this, not through anything the client sends.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * There's a single login path now (Kakao) — admin-ness is decided by
 * whether the logged-in account's email is on the `ADMIN_EMAILS`
 * allowlist, checked server-side against the JWT-verified user, never a
 * client-sent flag. The legacy `admins` table (keyed by user_id, from the
 * old email/password admin login) is still honored too, so promoting a
 * future admin by DB row instead of redeploying env vars keeps working.
 */
export async function getIsAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;

  const email = user.email?.toLowerCase();
  if (email && adminEmailAllowlist().includes(email)) return true;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not set — getIsAdmin() can't check the admins table. " +
        "Admin features will be inaccessible until the key is configured (see .env.local.example).",
    );
    return false;
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export function kakaoNickname(user: User | null): string {
  if (!user) return "고객";
  const m = user.user_metadata ?? {};
  return m.name || m.nickname || m.full_name || m.preferred_username || user.email || "고객";
}

export type SessionInfo = {
  user: User | null;
  isAdmin: boolean;
};

/** Convenience for pages that need both the user and their role in one round trip. */
export async function getSessionInfo(): Promise<SessionInfo> {
  const user = await getServerUser();
  const isAdmin = await getIsAdmin(user);
  return { user, isAdmin };
}
