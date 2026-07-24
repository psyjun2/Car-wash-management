import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { listWashRecords, upsertWashRecord } from "@/lib/data/wash-records";

export async function GET(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);

  const vehicleId = new URL(request.url).searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId가 필요합니다" }, { status: 400 });

  try {
    const records = await listWashRecords({ vehicleId, userId: user.id, isAdmin });
    return NextResponse.json({ records });
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "권한이 없습니다" ? 403 : message === "차량을 찾을 수 없습니다" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const body = (await request.json()) as {
    vehicleId: string;
    washDate: string;
    serviceType: "onetime" | "subscription";
    status: "scheduled" | "washing" | "done";
    note: string | null;
  };

  try {
    const record = await upsertWashRecord({ isAdmin, ...body });
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
