import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { setReservationStatus } from "@/lib/data/reservations";

type Params = { params: Promise<{ id: string }> };

function statusFor(message: string) {
  return message === "권한이 없습니다" ? 403 : message === "예약을 찾을 수 없습니다" ? 404 : 400;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  const body = (await request.json()) as { status?: string };
  const allowed = ["awaiting_payment", "accepted", "rejected"] as const;
  if (!allowed.includes(body.status as (typeof allowed)[number])) {
    return NextResponse.json({ error: "잘못된 상태 값입니다" }, { status: 400 });
  }
  const status = body.status as (typeof allowed)[number];

  try {
    const reservation = await setReservationStatus({ id, isAdmin, status });
    return NextResponse.json({ reservation });
  } catch (e) {
    const message = (e as Error).message;
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}
