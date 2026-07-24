import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { ensureWashRecord, addWashRecordPhoto } from "@/lib/data/wash-records";

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const form = await request.formData();
  const vehicleId = form.get("vehicleId");
  const washDate = form.get("washDate");
  const file = form.get("file");

  if (typeof vehicleId !== "string" || typeof washDate !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  try {
    const record = await ensureWashRecord({ isAdmin, vehicleId, washDate });
    const buffer = Buffer.from(await file.arrayBuffer());
    const photo = await addWashRecordPhoto({
      isAdmin,
      washRecordId: record.id,
      vehicleId,
      fileName: file.name,
      fileBuffer: buffer,
      contentType: file.type || "image/jpeg",
    });
    return NextResponse.json({ photo, record }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
