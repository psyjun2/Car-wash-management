import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { listVehicles, createVehicle, type VehicleInput } from "@/lib/data/vehicles";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  const vehicles = await listVehicles({ userId: user.id, isAdmin });
  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  const body = (await request.json()) as VehicleInput;

  if (!body.car_num?.trim()) {
    return NextResponse.json({ error: "차량 번호를 입력해주세요" }, { status: 400 });
  }

  try {
    const vehicle = await createVehicle({ userId: user.id, isAdmin, input: body });
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
