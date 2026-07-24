import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { listReservations, createReservation, type ReservationInput } from "@/lib/data/reservations";
import { listVehicles } from "@/lib/data/vehicles";
import { validateInputs } from "@/lib/badwords";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  const reservations = await listReservations({ userId: user.id, isAdmin });
  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
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

  // Vehicle registration is required before booking — the customer's first action.
  if (!isAdmin) {
    const vehicles = await listVehicles({ userId: user.id, isAdmin: false });
    if (vehicles.length === 0) {
      return NextResponse.json({ error: "먼저 차량을 등록해주세요" }, { status: 400 });
    }
  }

  try {
    const reservation = await createReservation({ userId: user.id, isAdmin, input: body });
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
