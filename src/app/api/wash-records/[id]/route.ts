import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { deleteWashRecord } from "@/lib/data/wash-records";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  try {
    await deleteWashRecord({ isAdmin, id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
