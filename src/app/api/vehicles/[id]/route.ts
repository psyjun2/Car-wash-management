import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { updateVehicle, deleteVehicle, type VehicleInput } from "@/lib/data/vehicles";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  const body = (await request.json()) as VehicleInput;

  if (!body.car_num?.trim()) {
    return NextResponse.json({ error: "차량 번호를 입력해주세요" }, { status: 400 });
  }

  try {
    const vehicle = await updateVehicle({ id, userId: user.id, isAdmin, input: body });
    return NextResponse.json({ vehicle });
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "권한이 없습니다" ? 403 : message === "차량을 찾을 수 없습니다" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);

  try {
    await deleteVehicle({ id, userId: user.id, isAdmin });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "권한이 없습니다" ? 403 : message === "차량을 찾을 수 없습니다" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
