import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { updateReservation, deleteReservation, type ReservationInput } from "@/lib/data/reservations";
import { validateInputs } from "@/lib/badwords";

type Params = { params: Promise<{ id: string }> };

function statusFor(message: string) {
  return message === "권한이 없습니다" ? 403 : message === "예약을 찾을 수 없습니다" ? 404 : 400;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  const body = (await request.json()) as ReservationInput;

  const missing: string[] = [];
  if (!body.date) missing.push("예약 날짜");
  if (!body.name?.trim()) missing.push("고객명");
  if (!body.phone?.trim()) missing.push("연락처");
  if (!body.car_num?.trim()) missing.push("차량 번호");
  if (!body.loc?.trim()) missing.push("주차 위치");
  if (missing.length) {
    return NextResponse.json({ error: `${missing.join(", ")}을(를) 입력해주세요` }, { status: 400 });
  }
  if (!validateInputs(body.name, body.phone, body.car_num, body.car_model, body.loc, body.note)) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있습니다" }, { status: 400 });
  }

  try {
    const reservation = await updateReservation({ id, userId: user.id, isAdmin, input: body });
    return NextResponse.json({ reservation });
  } catch (e) {
    const message = (e as Error).message;
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);

  try {
    await deleteReservation({ id, userId: user.id, isAdmin });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = (e as Error).message;
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}
