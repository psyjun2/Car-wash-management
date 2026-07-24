import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// Uses the caller's own session (not the service-role client): the
// `set_subscription_auto_renew` RPC is SECURITY DEFINER and checks
// `auth.uid()` against the subscription's `user_id` internally — that's
// the actual authorization boundary, so the DB call must carry the
// caller's real JWT, not an admin bypass.
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { autoRenew } = (await request.json()) as { autoRenew: boolean };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_subscription_auto_renew", {
    p_subscription_id: id,
    p_auto_renew: autoRenew,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
