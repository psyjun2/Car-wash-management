import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { deleteWashRecordPhoto } from "@/lib/data/wash-records";

type Params = { params: Promise<{ photoId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const { photoId } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const storagePath = new URL(request.url).searchParams.get("storagePath");
  if (!storagePath) return NextResponse.json({ error: "storagePath가 필요합니다" }, { status: 400 });

  try {
    await deleteWashRecordPhoto({ isAdmin, id: photoId, storagePath });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
