import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Replaces the old hash-based error_description parsing + the
// KAKAO_RETURN_PAGE_KEY localStorage round-trip hack: Supabase redirects
// here with a `code`, we exchange it for a session server-side, then
// bounce to whatever page the login was started from via `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorDescription) {
    const url = new URL("/", origin);
    url.searchParams.set("login_error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    const url = new URL("/", origin);
    url.searchParams.set("login_error", error.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, origin));
}
