import { NextResponse } from "next/server";
import { getServerUser, getIsAdmin } from "@/lib/auth/session";
import { confirmSubscriptionSync } from "@/lib/data/subscriptions";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const isAdmin = await getIsAdmin(user);
  if (!isAdmin) return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });

  try {
    const result = await confirmSubscriptionSync(id);
    if (!result.ok) {
      const messages = {
        no_vehicle: "등록된 차량이 없어 자동 연동할 수 없습니다. 고객에게 차량 등록을 요청해주세요",
        multiple_vehicles: "등록된 차량이 여러 대라 자동 연동할 수 없습니다. 차량 상세에서 직접 연동해주세요",
        not_found: "구독을 찾을 수 없습니다",
      };
      return NextResponse.json({ error: messages[result.reason] }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
