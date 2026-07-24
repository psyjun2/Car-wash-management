import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// Same reasoning as auto-renew: `cancel_my_subscription` is SECURITY
// DEFINER and checks `auth.uid()` itself, so this must run with the
// caller's own session client.
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_subscription", { p_subscription_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
